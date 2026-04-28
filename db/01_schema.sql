-- STOCK.FLIX schema (MySQL 8 / TiDB compatible)
-- Multi-platform stock aggregator for Y2K / streetwear brands.
-- Run order: 01_schema.sql -> 02_triggers.sql -> 03_procedures.sql -> 04_seed.sql

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role ENUM('admin', 'manager', 'analyst') NOT NULL DEFAULT 'analyst',
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platforms = the storefronts we aggregate from.
-- MARKETPLACE = multi-brand (Myntra, Flipkart, Ajio).
-- BRAND_DTC   = brand's own site (The Souled Store, Bewakoof, Everdeon).
CREATE TABLE IF NOT EXISTS platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  kind ENUM('MARKETPLACE', 'BRAND_DTC') NOT NULL DEFAULT 'MARKETPLACE',
  url VARCHAR(500),
  logo_url VARCHAR(500),
  brand_color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  lead_time_days INT NOT NULL DEFAULT 7,
  reliability_score DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  base_price DECIMAL(10, 2) NOT NULL,
  brand VARCHAR(100),
  poster_url VARCHAR(500),
  broll_url VARCHAR(500),
  is_hyped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FULLTEXT KEY ft_products_search (name, description, brand)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_hyped ON products(is_hyped);
CREATE INDEX idx_products_brand ON products(brand);

-- inventory_nodes = stock of a (product, size, color) on a specific platform.
-- platform_price captures cross-platform price variance — same product, different price on Myntra vs Souled Store.
CREATE TABLE IF NOT EXISTS inventory_nodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform_id INT NOT NULL,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL,
  current_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  capacity INT NOT NULL DEFAULT 1000,
  platform_price DECIMAL(10, 2),
  product_url VARCHAR(500),
  is_low_stock BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_platform_product_variant (platform_id, product_id, size, color),
  CONSTRAINT fk_inv_platform
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_inv_low_stock ON inventory_nodes(is_low_stock);
CREATE INDEX idx_inv_product ON inventory_nodes(product_id);
CREATE INDEX idx_inv_platform ON inventory_nodes(platform_id);

-- movements = stock-change events captured by the scrapers.
-- Used to compute velocity ("3.6 sold per day"), spot drops, and surface restocks.
CREATE TABLE IF NOT EXISTS movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  source_node_id INT,
  dest_node_id INT,
  quantity INT NOT NULL,
  action_type ENUM('SALE', 'RESTOCK', 'RETURN', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
  user_id INT,
  notes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mv_product
    FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_mv_source
    FOREIGN KEY (source_node_id) REFERENCES inventory_nodes(id),
  CONSTRAINT fk_mv_dest
    FOREIGN KEY (dest_node_id) REFERENCES inventory_nodes(id),
  CONSTRAINT fk_mv_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_mv_product_time ON movements(product_id, created_at);
CREATE INDEX idx_mv_action_time ON movements(action_type, created_at);

CREATE TABLE IF NOT EXISTS product_sourcing (
  product_id INT NOT NULL,
  supplier_id INT NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (product_id, supplier_id),
  CONSTRAINT fk_ps_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);
