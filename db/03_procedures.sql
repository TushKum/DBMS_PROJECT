-- "Specter" backend procedures

DROP PROCEDURE IF EXISTS sp_calculate_reorder_suggestions;
DROP PROCEDURE IF EXISTS sp_record_sale;
DROP PROCEDURE IF EXISTS sp_record_restock;

DELIMITER //

-- Binge-Stock: Velocity of Sale + lead-time aware reorder suggestion
-- p_window_days: rolling sales window to compute daily velocity
CREATE PROCEDURE sp_calculate_reorder_suggestions(IN p_window_days INT)
BEGIN
  SELECT
    p.id AS product_id,
    p.sku,
    p.name,
    p.brand,
    COALESCE(SUM(CASE WHEN m.action_type = 'SALE' THEN m.quantity ELSE 0 END), 0) AS units_sold,
    ROUND(
      COALESCE(SUM(CASE WHEN m.action_type = 'SALE' THEN m.quantity ELSE 0 END), 0)
        / GREATEST(p_window_days, 1),
      2
    ) AS daily_velocity,
    COALESCE(inv.total_on_hand, 0) AS total_on_hand,
    COALESCE(s.lead_time_days, 7) AS lead_time_days,
    GREATEST(
      CEIL(
        (COALESCE(SUM(CASE WHEN m.action_type = 'SALE' THEN m.quantity ELSE 0 END), 0)
          / GREATEST(p_window_days, 1))
        * COALESCE(s.lead_time_days, 7) * 1.5
      ) - COALESCE(inv.total_on_hand, 0),
      0
    ) AS suggested_reorder_qty
  FROM products p
  LEFT JOIN movements m
    ON m.product_id = p.id
   AND m.created_at >= DATE_SUB(NOW(), INTERVAL p_window_days DAY)
  LEFT JOIN (
    SELECT product_id, SUM(current_quantity) AS total_on_hand
    FROM inventory_nodes
    GROUP BY product_id
  ) inv ON inv.product_id = p.id
  LEFT JOIN product_sourcing ps
    ON ps.product_id = p.id AND ps.is_primary = TRUE
  LEFT JOIN suppliers s ON s.id = ps.supplier_id
  GROUP BY p.id, p.sku, p.name, p.brand, inv.total_on_hand, s.lead_time_days
  ORDER BY daily_velocity DESC;
END//

-- Atomic sale: lock row, deduct, log movement, all in one transaction
-- Throws SQLSTATE 45000 'INSUFFICIENT_STOCK' if the node lacks enough quantity
CREATE PROCEDURE sp_record_sale(
  IN p_inventory_node_id INT,
  IN p_quantity INT,
  IN p_user_id INT,
  OUT p_movement_id BIGINT
)
BEGIN
  DECLARE v_product_id INT;
  DECLARE v_current_qty INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT product_id, current_quantity
    INTO v_product_id, v_current_qty
  FROM inventory_nodes
  WHERE id = p_inventory_node_id
  FOR UPDATE;

  IF v_current_qty IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'NODE_NOT_FOUND';
  END IF;

  IF v_current_qty < p_quantity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'INSUFFICIENT_STOCK';
  END IF;

  UPDATE inventory_nodes
    SET current_quantity = current_quantity - p_quantity
  WHERE id = p_inventory_node_id;

  INSERT INTO movements (product_id, source_node_id, quantity, action_type, user_id)
  VALUES (v_product_id, p_inventory_node_id, p_quantity, 'SALE', p_user_id);

  SET p_movement_id = LAST_INSERT_ID();

  COMMIT;
END//

CREATE PROCEDURE sp_record_restock(
  IN p_inventory_node_id INT,
  IN p_quantity INT,
  IN p_user_id INT,
  OUT p_movement_id BIGINT
)
BEGIN
  DECLARE v_product_id INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT product_id INTO v_product_id
  FROM inventory_nodes
  WHERE id = p_inventory_node_id
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'NODE_NOT_FOUND';
  END IF;

  UPDATE inventory_nodes
    SET current_quantity = current_quantity + p_quantity
  WHERE id = p_inventory_node_id;

  INSERT INTO movements (product_id, dest_node_id, quantity, action_type, user_id)
  VALUES (v_product_id, p_inventory_node_id, p_quantity, 'RESTOCK', p_user_id);

  SET p_movement_id = LAST_INSERT_ID();

  COMMIT;
END//

DELIMITER ;
