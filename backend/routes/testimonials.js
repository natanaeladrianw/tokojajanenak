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

// Multer storage for testimonials
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `testi-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Ensure table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_path VARCHAR(255) NOT NULL,
      sort_order INT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

// Public: get active testimonials
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.execute(
      'SELECT id, image_path, sort_order, is_active FROM testimonials WHERE is_active = 1 ORDER BY sort_order IS NULL, sort_order, id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all
router.get('/all', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.execute(
      'SELECT id, image_path, sort_order, is_active FROM testimonials ORDER BY sort_order IS NULL, sort_order, id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', upload.single('image'), async (req, res) => {
  try {
    await ensureTable();
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const { sort_order, is_active } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    const active = is_active === '0' ? 0 : 1;
    const orderVal = sort_order ? Number(sort_order) : null;
    const [result] = await pool.execute(
      'INSERT INTO testimonials (image_path, sort_order, is_active) VALUES (?, ?, ?)',
      [imagePath, orderVal, active]
    );
    res.json({ success: true, id: result.insertId, image_path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { sort_order, is_active } = req.body;
    const orderVal = sort_order !== undefined && sort_order !== '' ? Number(sort_order) : null;
    const active = is_active === '0' ? 0 : 1;

    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      await pool.execute(
        'UPDATE testimonials SET image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [imagePath, orderVal, active, id]
      );
    } else {
      await pool.execute(
        'UPDATE testimonials SET sort_order = ?, is_active = ? WHERE id = ?',
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
    await ensureTable();
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT image_path FROM testimonials WHERE id = ?', [id]);
    await pool.execute('DELETE FROM testimonials WHERE id = ?', [id]);
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


