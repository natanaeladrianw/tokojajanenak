// Migration script to add harga_coret and diskon columns to varian table
// Run this with: node migrate_harga_coret_diskon.js

const pool = require('./models/database');

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔄 Starting migration...');
    
    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'varian' 
      AND COLUMN_NAME IN ('harga_coret', 'diskon')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add harga_coret if it doesn't exist
    if (!existingColumns.includes('harga_coret')) {
      console.log('➕ Adding column: harga_coret');
      await connection.execute(`
        ALTER TABLE varian 
        ADD COLUMN harga_coret INT NULL DEFAULT NULL COMMENT 'Strikethrough price (harga yang dicoret)'
      `);
      console.log('✅ Column harga_coret added successfully');
    } else {
      console.log('ℹ️  Column harga_coret already exists');
    }
    
    // Add diskon if it doesn't exist
    if (!existingColumns.includes('diskon')) {
      console.log('➕ Adding column: diskon');
      await connection.execute(`
        ALTER TABLE varian 
        ADD COLUMN diskon DECIMAL(5,2) NULL DEFAULT NULL COMMENT 'Discount percentage (0-100)'
      `);
      console.log('✅ Column diskon added successfully');
    } else {
      console.log('ℹ️  Column diskon already exists');
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

migrate();

