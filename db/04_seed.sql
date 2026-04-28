-- STOCK.FLIX seed: Y2K / streetwear stock across India's biggest fashion platforms

INSERT INTO categories (name, slug) VALUES
  ('Tops',        'tops'),
  ('Bottoms',     'bottoms'),
  ('Outerwear',   'outerwear'),
  ('Footwear',    'footwear'),
  ('Accessories', 'accessories');

INSERT INTO platforms (slug, name, kind, url, brand_color) VALUES
  ('myntra',         'Myntra',           'MARKETPLACE', 'https://www.myntra.com',         '#ff3f6c'),
  ('flipkart',       'Flipkart',         'MARKETPLACE', 'https://www.flipkart.com',       '#2874f0'),
  ('ajio',           'Ajio',             'MARKETPLACE', 'https://www.ajio.com',           '#3b1f4d'),
  ('thesouledstore', 'The Souled Store', 'BRAND_DTC',   'https://www.thesouledstore.com', '#ff6e2e'),
  ('everdeon',       'Everdeon',         'BRAND_DTC',   'https://www.everdeon.com',       '#c8a96e'),
  ('bewakoof',       'Bewakoof',         'BRAND_DTC',   'https://www.bewakoof.com',       '#fdb913');

INSERT INTO suppliers (name, lead_time_days, reliability_score, contact_email) VALUES
  ('The Souled Store', 7,  0.92, 'partners@thesouledstore.com'),
  ('Bewakoof Studio',  10, 0.89, 'wholesale@bewakoof.com'),
  ('Everdeon Atelier', 14, 0.95, 'b2b@everdeon.com');

INSERT INTO users (name, role, email) VALUES
  ('Aggregator Bot', 'admin',   'bot@stockflix.local'),
  ('Aanya Reddy',    'manager', 'aanya@stockflix.local'),
  ('Kabir Mehta',    'analyst', 'kabir@stockflix.local');

INSERT INTO products (sku, name, description, category_id, base_price, brand, poster_url, is_hyped) VALUES
  ('TSS-OH-Y2K-01', 'Y2K Mesh Layered Tee',         'Translucent mesh long-sleeve over a printed cotton tee. Y2K coded.',                1, 1499.00, 'The Souled Store', 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800', TRUE),
  ('BWK-CGO-22',    'Multi-Pocket Cargo Pants',     'Loose-fit cargo with strap detail and bungee hem.',                                 2, 1899.00, 'Bewakoof',         'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', FALSE),
  ('EVR-MJR-7',     'Distressed Mesh Jersey',       'Vintage racing jersey reissue, cropped at the hem.',                                1, 2299.00, 'Everdeon',         'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800', TRUE),
  ('TSS-PFR-09',    'Cropped Puffer Vest',          'Boxy quilted puffer with detachable hood. Y2K snowboard core.',                     3, 3499.00, 'The Souled Store', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', FALSE),
  ('BWK-OHD-77',    'Acid-Wash Oversized Hoodie',   'Heavy fleece pullover hoodie with embroidered crest.',                              1, 2199.00, 'Bewakoof',         'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', TRUE),
  ('EVR-BAG-CR',    'Crossbody Tech Bag',           'Modular nylon sling with mag-lock front pocket.',                                   5,  999.00, 'Everdeon',         'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800', FALSE),
  ('TSS-CGD-03',    'Carpenter Jorts',              'Knee-length cargo jorts in washed denim. Wide leg, big pockets.',                   2, 1599.00, 'The Souled Store', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800', FALSE),
  ('BWK-LYR-15',    'Layered Tank Set',             'Two-piece set: ribbed white tank + mesh black overlay.',                            1, 1299.00, 'Bewakoof',         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', FALSE),
  ('EVR-CHR-44',    'Chrome Mary Janes',            'Liquid-finish chunky platform Mary Janes.',                                         4, 2799.00, 'Everdeon',         'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', TRUE),
  ('TSS-SLV-02',    'Silver Tracksuit Jacket',      'Metallic shell warmup jacket with mesh lining.',                                    3, 2599.00, 'The Souled Store', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', FALSE);

-- Inventory across platforms — same product, different stock per platform/variant.
-- Note: row order matters for the AUTO_INCREMENT IDs referenced in movements below.
INSERT INTO inventory_nodes (platform_id, product_id, size, color, current_quantity, reorder_level, platform_price, product_url) VALUES
  -- 1-5: Y2K Mesh Tee (hyped, stock running low across the board)
  (1, 1, 'M',  'Black',     3,  5, 1499.00, 'https://www.myntra.com/p/tss-mesh-tee'),
  (1, 1, 'L',  'Black',     0,  5, 1499.00, 'https://www.myntra.com/p/tss-mesh-tee'),
  (2, 1, 'M',  'Black',     7,  5, 1599.00, 'https://www.flipkart.com/p/tss-mesh-tee'),
  (4, 1, 'M',  'Black',    18,  5, 1399.00, 'https://www.thesouledstore.com/y2k-mesh-tee'),
  (4, 1, 'L',  'Black',     2,  5, 1399.00, 'https://www.thesouledstore.com/y2k-mesh-tee'),
  -- 6-10: Cargo Pants
  (1, 2, '30', 'Olive',    24,  8, 1899.00, 'https://www.myntra.com/p/bwk-cargo'),
  (2, 2, '30', 'Olive',    11,  8, 1999.00, 'https://www.flipkart.com/p/bwk-cargo'),
  (2, 2, '32', 'Olive',     6,  8, 1999.00, 'https://www.flipkart.com/p/bwk-cargo'),
  (6, 2, '30', 'Olive',    33,  8, 1799.00, 'https://www.bewakoof.com/p/cargo-pants'),
  (6, 2, '32', 'Olive',    21,  8, 1799.00, 'https://www.bewakoof.com/p/cargo-pants'),
  -- 11-14: Mesh Jersey (trending hard, sold out on Ajio)
  (1, 3, 'M',  'White/Red', 4,  6, 2299.00, 'https://www.myntra.com/p/evr-jersey'),
  (3, 3, 'M',  'White/Red', 0,  6, 2299.00, 'https://www.ajio.com/p/evr-jersey'),
  (5, 3, 'M',  'White/Red', 9,  6, 1999.00, 'https://www.everdeon.com/jersey'),
  (5, 3, 'L',  'White/Red', 7,  6, 1999.00, 'https://www.everdeon.com/jersey'),
  -- 15-16: Puffer Vest
  (1, 4, 'M',  'Cream',    12,  6, 3499.00, 'https://www.myntra.com/p/tss-puffer'),
  (4, 4, 'M',  'Cream',    18,  6, 3299.00, 'https://www.thesouledstore.com/puffer'),
  -- 17-20: Acid-Wash Hoodie (hyped, sold out on Flipkart)
  (1, 5, 'M',  'Acid',      2,  5, 2199.00, 'https://www.myntra.com/p/bwk-hoodie'),
  (1, 5, 'L',  'Acid',      6,  5, 2199.00, 'https://www.myntra.com/p/bwk-hoodie'),
  (2, 5, 'M',  'Acid',      0,  5, 2299.00, 'https://www.flipkart.com/p/bwk-hoodie'),
  (6, 5, 'M',  'Acid',     14,  5, 2099.00, 'https://www.bewakoof.com/p/acid-hoodie'),
  -- 21-22: Crossbody Bag
  (1, 6, 'OS', 'Black',    23,  8,  999.00, 'https://www.myntra.com/p/evr-bag'),
  (5, 6, 'OS', 'Black',    19,  8,  899.00, 'https://www.everdeon.com/sling'),
  -- 23-24: Carpenter Jorts
  (1, 7, '30', 'Indigo',    9,  5, 1599.00, 'https://www.myntra.com/p/tss-jorts'),
  (4, 7, '30', 'Indigo',   16,  5, 1499.00, 'https://www.thesouledstore.com/jorts'),
  -- 25-26: Layered Tank
  (1, 8, 'M',  'B/W',      11,  5, 1299.00, 'https://www.myntra.com/p/bwk-tank'),
  (6, 8, 'M',  'B/W',      28,  5, 1199.00, 'https://www.bewakoof.com/p/tank-set'),
  -- 27-29: Chrome Mary Janes (hyped, scarce)
  (1, 9, 'UK 5', 'Chrome',  3,  4, 2799.00, 'https://www.myntra.com/p/evr-chrome'),
  (3, 9, 'UK 6', 'Chrome',  1,  4, 2799.00, 'https://www.ajio.com/p/evr-chrome'),
  (5, 9, 'UK 5', 'Chrome',  6,  4, 2599.00, 'https://www.everdeon.com/chrome-mj'),
  -- 30-31: Silver Tracksuit
  (1, 10, 'M', 'Silver',    8,  5, 2599.00, 'https://www.myntra.com/p/tss-silver'),
  (4, 10, 'M', 'Silver',   13,  5, 2399.00, 'https://www.thesouledstore.com/silver-jacket');

INSERT INTO product_sourcing (product_id, supplier_id, unit_cost, is_primary) VALUES
  (1,  1, 600.00,  TRUE),
  (2,  2, 750.00,  TRUE),
  (3,  3, 900.00,  TRUE),
  (4,  1, 1400.00, TRUE),
  (5,  2, 880.00,  TRUE),
  (6,  3, 400.00,  TRUE),
  (7,  1, 600.00,  TRUE),
  (8,  2, 480.00,  TRUE),
  (9,  3, 1200.00, TRUE),
  (10, 1, 1100.00, TRUE);

-- Recent activity (last 7 days) — drives the High Velocity + Recently Restocked rows.
-- These are HISTORICAL records; current_quantity above already reflects post-event state.
INSERT INTO movements (product_id, source_node_id, dest_node_id, quantity, action_type, user_id, created_at) VALUES
  (1, 1,    NULL, 47, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (1, 4,    NULL, 32, 'SALE',    2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (3, 11,   NULL, 16, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (3, 13,   NULL, 21, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (5, 17,   NULL, 28, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (5, 20,   NULL, 11, 'SALE',    2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (2, 6,    NULL,  6, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (9, 27,   NULL, 14, 'SALE',    2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (9, 29,   NULL,  9, 'SALE',    1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (1, NULL, 4,    50, 'RESTOCK', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
  (5, NULL, 20,   25, 'RESTOCK', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (10,NULL, 31,   20, 'RESTOCK', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, NULL, 13,   30, 'RESTOCK', 1, DATE_SUB(NOW(), INTERVAL 6 DAY));
