const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../models/database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `carousel-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Get active carousel images (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, image_path, sort_order, is_active FROM carousel_images WHERE is_active = 1 ORDER BY sort_order IS NULL, sort_order, id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all (admin)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, image_path, sort_order, is_active FROM carousel_images ORDER BY sort_order IS NULL, sort_order, id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const { sort_order, is_active } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    const active = is_active === '0' ? 0 : 1;
    const orderVal = sort_order ? Number(sort_order) : null;
    const [result] = await pool.execute(
      'INSERT INTO carousel_images (image_path, sort_order, is_active) VALUES (?, ?, ?)',
      [imagePath, orderVal, active]
    );
    res.json({ success: true, id: result.insertId, image_path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update (metadata and optionally image)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { sort_order, is_active } = req.body;
    const orderVal = sort_order !== undefined && sort_order !== '' ? Number(sort_order) : null;
    const active = is_active === '0' ? 0 : 1;

    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      await pool.execute(
        'UPDATE carousel_images SET image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [imagePath, orderVal, active, id]
      );
    } else {
      await pool.execute(
        'UPDATE carousel_images SET sort_order = ?, is_active = ? WHERE id = ?',
        [orderVal, active, id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Optionally fetch file to delete
    const [rows] = await pool.execute('SELECT image_path FROM carousel_images WHERE id = ?', [id]);
    await pool.execute('DELETE FROM carousel_images WHERE id = ?', [id]);
    // Try remove file (best-effort)
    if (rows && rows[0] && rows[0].image_path) {
      const filePath = path.join(process.cwd(), rows[0].image_path.replace(/^\//, ''));
      fs.unlink(filePath, () => {});
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


