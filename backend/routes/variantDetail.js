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
    
    if (!nama_varian || nama_varian.trim() === '') {
      return res.status(400).json({ error: 'Nama varian tidak boleh kosong' });
    }
    
    if (!produk_id) {
      return res.status(400).json({ error: 'produk_id diperlukan' });
    }

    const [result] = await pool.execute(
      'INSERT INTO varian (nama_varian, produk_id, harga) VALUES (?, ?, ?)',
      [nama_varian.trim(), produk_id, parsedHarga]
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
    if (harga !== undefined) {
      if (harga === null || harga === '') harga = 0;
      const parsedHarga = Number.parseInt(harga, 10);
      if (Number.isNaN(parsedHarga) || parsedHarga < 0) {
        return res.status(400).json({ error: 'Harga tidak valid' });
      }
      await pool.execute(
        'UPDATE varian SET nama_varian = ?, harga = ? WHERE id = ?',
        [nama_varian.trim(), parsedHarga, id]
      );
    } else {
      await pool.execute(
        'UPDATE varian SET nama_varian = ? WHERE id = ?',
        [nama_varian.trim(), id]
      );
    }

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

