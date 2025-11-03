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
    cb(null, `paket-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Ensure table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS paket (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipe VARCHAR(100) NOT NULL,
      image_path VARCHAR(255) NOT NULL,
      link_wa VARCHAR(255),
      link_shopee VARCHAR(255),
      link_tiktok VARCHAR(255),
      subtitle_wa VARCHAR(255),
      subtitle_shopee VARCHAR(255),
      subtitle_tiktok VARCHAR(255),
      active_wa TINYINT(1) NOT NULL DEFAULT 1,
      active_shopee TINYINT(1) NOT NULL DEFAULT 1,
      active_tiktok TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  // Ensure columns exist for existing deployments
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS subtitle_wa VARCHAR(255) NULL'); } catch (_) {}
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS subtitle_shopee VARCHAR(255) NULL'); } catch (_) {}
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS subtitle_tiktok VARCHAR(255) NULL'); } catch (_) {}
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS active_wa TINYINT(1) NOT NULL DEFAULT 1'); } catch (_) {}
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS active_shopee TINYINT(1) NOT NULL DEFAULT 1'); } catch (_) {}
  try { await pool.query('ALTER TABLE paket ADD COLUMN IF NOT EXISTS active_tiktok TINYINT(1) NOT NULL DEFAULT 1'); } catch (_) {}
};

// Public: get active paket
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.execute(
      'SELECT id, tipe, image_path, link_shopee, link_tiktok, subtitle_wa, subtitle_shopee, subtitle_tiktok, active_wa, active_shopee, active_tiktok, sort_order FROM paket WHERE is_active = 1 ORDER BY sort_order IS NULL, sort_order, id'
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
    const [rows] = await pool.execute('SELECT * FROM paket ORDER BY sort_order IS NULL, sort_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create paket
router.post('/', upload.single('image'), async (req, res) => {
  try {
    await ensureTable();
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const { tipe, link_shopee, link_tiktok, subtitle_wa, subtitle_shopee, subtitle_tiktok, active_wa, active_shopee, active_tiktok, sort_order, is_active } = req.body;
    if (!tipe) return res.status(400).json({ error: 'Tipe paket wajib diisi' });
    const imagePath = `/uploads/${req.file.filename}`;
    const active = is_active === '0' ? 0 : 1;
    const orderVal = sort_order ? Number(sort_order) : null;
    const toNull = (v) => (v === undefined || v === '' ? null : v);
    const aWa = (active_wa === true || active_wa === 1 || active_wa === '1') ? 1 : 0;
    const aShopee = (active_shopee === true || active_shopee === 1 || active_shopee === '1') ? 1 : 0;
    const aTiktok = (active_tiktok === true || active_tiktok === 1 || active_tiktok === '1') ? 1 : 0;
    const [result] = await pool.execute(
      'INSERT INTO paket (tipe, image_path, link_shopee, link_tiktok, subtitle_wa, subtitle_shopee, subtitle_tiktok, active_wa, active_shopee, active_tiktok, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tipe, imagePath, toNull(link_shopee), toNull(link_tiktok), toNull(subtitle_wa), toNull(subtitle_shopee), toNull(subtitle_tiktok), aWa, aShopee, aTiktok, orderVal, active]
    );
    res.json({ success: true, id: result.insertId, image_path: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update paket
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { tipe, link_shopee, link_tiktok, subtitle_wa, subtitle_shopee, subtitle_tiktok, active_wa, active_shopee, active_tiktok, sort_order, is_active } = req.body;
    const orderVal = sort_order !== undefined && sort_order !== '' ? Number(sort_order) : null;
    const active = is_active === '0' ? 0 : 1;

    let qPart = '', params = [];
    if (typeof tipe === 'string') { qPart += 'tipe = ?, '; params.push(tipe); }
    if (typeof link_shopee === 'string') { qPart += 'link_shopee = ?, '; params.push(link_shopee); }
    if (typeof link_tiktok === 'string') { qPart += 'link_tiktok = ?, '; params.push(link_tiktok); }
    if (typeof subtitle_wa === 'string') { qPart += 'subtitle_wa = ?, '; params.push(subtitle_wa); }
    if (typeof subtitle_shopee === 'string') { qPart += 'subtitle_shopee = ?, '; params.push(subtitle_shopee); }
    if (typeof subtitle_tiktok === 'string') { qPart += 'subtitle_tiktok = ?, '; params.push(subtitle_tiktok); }
    if (active_wa !== undefined) { const v = (active_wa === true || active_wa === 1 || active_wa === '1') ? 1 : 0; qPart += 'active_wa = ?, '; params.push(v); }
    if (active_shopee !== undefined) { const v = (active_shopee === true || active_shopee === 1 || active_shopee === '1') ? 1 : 0; qPart += 'active_shopee = ?, '; params.push(v); }
    if (active_tiktok !== undefined) { const v = (active_tiktok === true || active_tiktok === 1 || active_tiktok === '1') ? 1 : 0; qPart += 'active_tiktok = ?, '; params.push(v); }
    qPart += 'sort_order = ?, is_active = ?';
    params.push(orderVal, active);

    if (req.file) {
      const [rows] = await pool.execute('SELECT image_path FROM paket WHERE id = ?', [id]);
      if (rows && rows[0] && rows[0].image_path) {
        const oldImage = path.join(process.cwd(), rows[0].image_path.replace(/^\//, ''));
        fs.unlink(oldImage, () => {});
      }
      const imagePath = `/uploads/${req.file.filename}`;
      await pool.execute(
        `UPDATE paket SET image_path = ?, ${qPart} WHERE id = ?`,
        [imagePath, ...params, id]
      );
    } else {
      await pool.execute(
        `UPDATE paket SET ${qPart} WHERE id = ?`,
        [...params, id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete paket
router.delete('/:id', async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT image_path FROM paket WHERE id = ?', [id]);
    await pool.execute('DELETE FROM paket WHERE id = ?', [id]);
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


