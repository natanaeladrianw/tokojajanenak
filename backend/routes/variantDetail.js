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

// Multer storage config for detail images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `detail-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// ===== VARIAN ROUTES =====

// Get all variants for a product
router.get('/varian/:produkId', async (req, res) => {
  try {
    const { produkId } = req.params;
    const [variants] = await pool.execute(
      'SELECT * FROM varian WHERE produk_id = ? ORDER BY id',
      [produkId]
    );
    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create variant
router.post('/varian', async (req, res) => {
  try {
    const { nama_varian, produk_id } = req.body;
    // harga bisa null/undefined, default 0 jika kosong
    let { harga } = req.body;
    if (harga === undefined || harga === null || harga === '') {
      harga = 0;
    }
    // pastikan numerik bilangan bulat tidak negatif
    const parsedHarga = Number.parseInt(harga, 10);
    if (Number.isNaN(parsedHarga) || parsedHarga < 0) {
      return res.status(400).json({ error: 'Harga tidak valid' });
    }
    
    // Handle harga_coret (strikethrough price)
    let { harga_coret } = req.body;
    let parsedHargaCoret = null;
    if (harga_coret !== undefined && harga_coret !== null && harga_coret !== '') {
      parsedHargaCoret = Number.parseInt(harga_coret, 10);
      if (Number.isNaN(parsedHargaCoret) || parsedHargaCoret < 0) {
        return res.status(400).json({ error: 'Harga coret tidak valid' });
      }
    }
    
    // Handle diskon (discount percentage)
    let { diskon } = req.body;
    let parsedDiskon = null;
    if (diskon !== undefined && diskon !== null && diskon !== '') {
      parsedDiskon = Number.parseFloat(diskon, 10);
      if (Number.isNaN(parsedDiskon) || parsedDiskon < 0 || parsedDiskon > 100) {
        return res.status(400).json({ error: 'Diskon tidak valid (harus antara 0-100)' });
      }
    }
    
    if (!nama_varian || nama_varian.trim() === '') {
      return res.status(400).json({ error: 'Nama varian tidak boleh kosong' });
    }
    
    if (!produk_id) {
      return res.status(400).json({ error: 'produk_id diperlukan' });
    }

    const [result] = await pool.execute(
      'INSERT INTO varian (nama_varian, produk_id, harga, harga_coret, diskon) VALUES (?, ?, ?, ?, ?)',
      [nama_varian.trim(), produk_id, parsedHarga, parsedHargaCoret, parsedDiskon]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating variant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update variant
router.put('/varian/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_varian } = req.body;
    let { harga } = req.body;
    
    if (!nama_varian || nama_varian.trim() === '') {
      return res.status(400).json({ error: 'Nama varian tidak boleh kosong' });
    }
    
    // Handle harga
    let parsedHarga = null;
    if (harga !== undefined) {
      if (harga === null || harga === '') {
        parsedHarga = 0;
      } else {
        parsedHarga = Number.parseInt(harga, 10);
        if (Number.isNaN(parsedHarga) || parsedHarga < 0) {
          return res.status(400).json({ error: 'Harga tidak valid' });
        }
      }
    }
    
    // Handle harga_coret (strikethrough price)
    let { harga_coret } = req.body;
    let parsedHargaCoret = null;
    if (harga_coret !== undefined && harga_coret !== null) {
      // Handle empty string or string 'null'
      if (harga_coret === '' || harga_coret === 'null' || harga_coret === 'undefined') {
        parsedHargaCoret = null;
      } else {
        // Convert to number (handles both string and number inputs)
        const numValue = typeof harga_coret === 'string' ? harga_coret.trim() : String(harga_coret);
        parsedHargaCoret = Number.parseInt(numValue, 10);
        if (Number.isNaN(parsedHargaCoret) || parsedHargaCoret < 0) {
          return res.status(400).json({ error: 'Harga coret tidak valid' });
        }
      }
    } else if (harga_coret === null) {
      parsedHargaCoret = null;
    }
    
    // Handle diskon (discount percentage)
    let { diskon } = req.body;
    let parsedDiskon = null;
    if (diskon !== undefined && diskon !== null) {
      // Handle empty string or string 'null'
      if (diskon === '' || diskon === 'null' || diskon === 'undefined') {
        parsedDiskon = null;
      } else {
        // Convert to number (handles both string and number inputs)
        const numValue = typeof diskon === 'string' ? diskon.trim() : String(diskon);
        parsedDiskon = Number.parseFloat(numValue, 10);
        if (Number.isNaN(parsedDiskon) || parsedDiskon < 0 || parsedDiskon > 100) {
          return res.status(400).json({ error: 'Diskon tidak valid (harus antara 0-100)' });
        }
      }
    } else if (diskon === null) {
      parsedDiskon = null;
    }
    
    // Build update query dynamically
    const updates = ['nama_varian = ?'];
    const values = [nama_varian.trim()];
    
    if (harga !== undefined) {
      updates.push('harga = ?');
      values.push(parsedHarga);
    }
    
    if (harga_coret !== undefined) {
      updates.push('harga_coret = ?');
      values.push(parsedHargaCoret);
    }
    
    if (diskon !== undefined) {
      updates.push('diskon = ?');
      values.push(parsedDiskon);
    }
    
    values.push(id);
    
    const query = `UPDATE varian SET ${updates.join(', ')} WHERE id = ?`;
    console.log('Updating variant:', { id, query, values });
    
    const [result] = await pool.execute(query, values);
    console.log('Update result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete variant
router.delete('/varian/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM varian WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DETAIL PRODUK ROUTES =====

// Get all detail produk for a product
router.get('/detail/:produkId', async (req, res) => {
  try {
    const { produkId } = req.params;
    const [details] = await pool.execute(
      'SELECT * FROM detail_produk WHERE produk_id = ? ORDER BY id',
      [produkId]
    );
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create detail produk
router.post('/detail', upload.single('gambar'), async (req, res) => {
  try {
    const { produk_id, keterangan } = req.body;
    
    if (!produk_id) {
      return res.status(400).json({ error: 'produk_id diperlukan' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Gambar detail produk diperlukan' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const [result] = await pool.execute(
      'INSERT INTO detail_produk (gambar, keterangan, produk_id) VALUES (?, ?, ?)',
      [imagePath, keterangan || null, produk_id]
    );

    res.json({ success: true, id: result.insertId, gambar: imagePath });
  } catch (error) {
    console.error('Error creating detail produk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update detail produk
router.put('/detail/:id', upload.single('gambar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    if (imagePath) {
      // Update dengan gambar baru
      await pool.execute(
        'UPDATE detail_produk SET gambar = ?, keterangan = ? WHERE id = ?',
        [imagePath, keterangan || null, id]
      );
    } else {
      // Update hanya keterangan
      await pool.execute(
        'UPDATE detail_produk SET keterangan = ? WHERE id = ?',
        [keterangan || null, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating detail produk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete detail produk
router.delete('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image path before deleting
    const [details] = await pool.execute(
      'SELECT gambar FROM detail_produk WHERE id = ?',
      [id]
    );
    
    if (details.length > 0 && details[0].gambar) {
      const imagePath = path.join(process.cwd(), details[0].gambar);
      // Delete file if exists
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await pool.execute('DELETE FROM detail_produk WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting detail produk:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

