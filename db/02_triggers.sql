-- The Scarcity Trigger + overshoot guard
-- Auto-flags is_low_stock when current_quantity <= reorder_level
-- Refuses any update that would push quantity below zero (oversell guard)

DROP TRIGGER IF EXISTS trg_inventory_before_insert;
DROP TRIGGER IF EXISTS trg_inventory_before_update;

DELIMITER //

CREATE TRIGGER trg_inventory_before_insert
BEFORE INSERT ON inventory_nodes
FOR EACH ROW
BEGIN
  IF NEW.current_quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'INVALID_INVENTORY: current_quantity cannot be negative';
  END IF;
  SET NEW.is_low_stock = (NEW.current_quantity <= NEW.reorder_level);
END//

CREATE TRIGGER trg_inventory_before_update
BEFORE UPDATE ON inventory_nodes
FOR EACH ROW
BEGIN
  IF NEW.current_quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OVERSELL: current_quantity cannot go negative';
  END IF;
  SET NEW.is_low_stock = (NEW.current_quantity <= NEW.reorder_level);
END//

DELIMITER ;
