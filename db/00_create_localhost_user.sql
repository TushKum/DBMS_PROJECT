-- Create localhost user for TCP connections (127.0.0.1)
-- MySQL 8 treats 'localhost' (socket) and '127.0.0.1' (TCP) as different
CREATE USER IF NOT EXISTS 'stockflix'@'localhost' IDENTIFIED BY 'stockflix_pw';
GRANT ALL PRIVILEGES ON stockflix.* TO 'stockflix'@'localhost';
FLUSH PRIVILEGES;