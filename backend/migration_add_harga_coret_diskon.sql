-- Migration script to add harga_coret and diskon columns to varian table
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE
-- Use the Node.js migration script instead: node migrate_harga_coret_diskon.js
-- Or run these commands manually if columns don't exist:

ALTER TABLE varian 
ADD COLUMN harga_coret INT NULL DEFAULT NULL COMMENT 'Strikethrough price (harga yang dicoret)';

ALTER TABLE varian 
ADD COLUMN diskon DECIMAL(5,2) NULL DEFAULT NULL COMMENT 'Discount percentage (0-100)';

