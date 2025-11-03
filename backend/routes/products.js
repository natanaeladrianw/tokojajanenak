const express = require('express');
const pool = require('../models/database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Get all products with variants
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, 
             GROUP_CONCAT(DISTINCT v.nama_varian) as varian,
             GROUP_CONCAT(DISTINCT d.gambar) as detail_gambar
      FROM produk p
      LEFT JOIN varian v ON p.id = v.produk_id
      LEFT JOIN detail_produk d ON p.id = d.produk_id
      GROUP BY p.id
    `);
    
    // Format data
    const formattedProducts = products.map(product => ({
      ...product,
      varian: product.varian ? product.varian.split(',') : [],
      detail_gambar: product.detail_gambar ? product.detail_gambar.split(',') : []
    }));

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (with image upload)
router.post('/', upload.single('gambar_produk'), async (req, res) => {
  let connection;
  try {
    const { nama_produk } = req.body;
    
    // Validasi nama produk
    if (!nama_produk || nama_produk.trim() === '') {
      return res.status(400).json({ error: 'Nama produk tidak boleh kosong' });
    }
    
    // varian could be array or comma-separated string
    // support either array of strings or array of objects { nama_varian, harga }
    let { varian } = req.body;
    if (typeof varian === 'string') {
      try { varian = JSON.parse(varian); } catch { varian = varian.split(',').map(s => s.trim()).filter(Boolean); }
    }
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Get connection from pool for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Insert product
    const [result] = await connection.execute(
      'INSERT INTO produk (nama_produk, gambar_produk, user_id) VALUES (?, ?, ?)',
      [nama_produk.trim(), imagePath, 1]
    );

    // Get the insertId - try multiple methods
    let insertId = result.insertId;
    if (!insertId || insertId === 0) {
      // Fallback: query LAST_INSERT_ID()
      const [idResult] = await connection.execute('SELECT LAST_INSERT_ID() as id');
      insertId = idResult[0]?.id || insertId;
    }

    // If still 0, check table structure and provide helpful error
    if (insertId === 0) {
      console.warn('insertId is 0, checking table structure...');
      try {
        // Check if AUTO_INCREMENT is set
        const [columns] = await connection.execute(`
          SELECT EXTRA
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'produk'
          AND COLUMN_NAME = 'id'
        `);
        
        if (columns.length > 0 && (!columns[0].EXTRA || !columns[0].EXTRA.includes('auto_increment'))) {
          // Rollback the failed insert
          await connection.rollback();
          connection.release();
          
          return res.status(500).json({ 
            error: 'Kolom id pada tabel produk tidak memiliki AUTO_INCREMENT. Silakan perbaiki struktur tabel terlebih dahulu.',
            fixEndpoint: 'POST /api/products/fix-table',
            instruction: 'Panggil endpoint fix-table untuk memperbaiki struktur tabel secara otomatis.'
          });
        }
      } catch (checkError) {
        console.error('Error checking table structure:', checkError);
        // Continue - maybe it's a different issue
      }
    }

    // Insert variants if any
    if (Array.isArray(varian) && varian.length > 0 && insertId > 0) {
      for (let item of varian) {
        if (item == null) continue;
        if (typeof item === 'string') {
          await connection.execute(
            'INSERT INTO varian (nama_varian, produk_id, harga) VALUES (?, ?, ?)',
            [item, insertId, 0]
          );
        } else if (typeof item === 'object') {
          const name = (item.nama_varian || '').trim();
          if (!name) continue;
          let price = Number.parseInt(item.harga ?? 0, 10);
          if (Number.isNaN(price) || price < 0) price = 0;
          await connection.execute(
            'INSERT INTO varian (nama_varian, produk_id, harga) VALUES (?, ?, ?)',
            [name, insertId, price]
          );
        }
      }
    }

    await connection.commit();
    connection.release();

    if (insertId === 0) {
      console.error('Warning: insertId is 0 after INSERT and auto-fix attempts');
      return res.status(500).json({ 
        error: 'Gagal mendapatkan ID produk yang baru dibuat. Silakan panggil POST /api/products/fix-table untuk memperbaiki struktur tabel.',
        suggestion: 'Coba akses: POST http://localhost:5000/api/products/fix-table'
      });
    }

    res.json({ success: true, id: insertId });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product (optionally with new image)
router.put('/:id', upload.single('gambar_produk'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (imagePath) {
      await pool.execute(
        'UPDATE produk SET nama_produk = ?, gambar_produk = ? WHERE id = ?',
        [nama_produk, imagePath, id]
      );
    } else {
      await pool.execute(
        'UPDATE produk SET nama_produk = ? WHERE id = ?',
        [nama_produk, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM produk WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fix table structure - ensure AUTO_INCREMENT is set (admin utility)
router.post('/fix-table', async (req, res) => {
  try {
    // Check current structure
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produk'
      AND COLUMN_NAME = 'id'
    `);

    if (columns.length === 0) {
      return res.status(404).json({ error: 'Tabel produk tidak ditemukan' });
    }

    const idColumn = columns[0];
    
    // Check if AUTO_INCREMENT is already set
    if (idColumn.EXTRA && idColumn.EXTRA.includes('auto_increment')) {
      return res.json({ 
        success: true, 
        message: 'Tabel produk sudah memiliki AUTO_INCREMENT',
        current_structure: idColumn
      });
    }

    // Get max ID to set AUTO_INCREMENT properly
    const [maxResult] = await pool.execute('SELECT COALESCE(MAX(id), 0) as max_id FROM produk');
    const nextId = (maxResult[0]?.max_id || 0) + 1;

    // Fix: Set AUTO_INCREMENT
    await pool.execute(`
      ALTER TABLE produk 
      MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY
    `);

    // Set AUTO_INCREMENT starting value if needed
    if (nextId > 1) {
      await pool.execute(`ALTER TABLE produk AUTO_INCREMENT = ${nextId}`);
    }

    // Verify the fix
    const [updatedColumns] = await pool.execute(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'produk'
      AND COLUMN_NAME = 'id'
    `);

    res.json({ 
      success: true, 
      message: 'Tabel produk berhasil diperbaiki',
      next_id: nextId,
      updated_structure: updatedColumns[0]
    });
  } catch (error) {
    console.error('Error fixing table:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;