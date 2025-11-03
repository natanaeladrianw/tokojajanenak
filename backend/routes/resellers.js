const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Ensure table exists
const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS resellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(20) NOT NULL,
      kota VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

// Initialize table at load time
ensureTable().catch((e) => console.error('Failed ensuring resellers table:', e));

// GET /api/resellers - Get all resellers
router.get('/resellers', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await db.query('SELECT * FROM resellers ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    console.error('Error fetching resellers:', e);
    res.status(500).json({ error: 'Failed to fetch resellers' });
  }
});

// GET /api/resellers/:id - Get reseller by ID
router.get('/resellers/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const [rows] = await db.query('SELECT * FROM resellers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Error fetching reseller:', e);
    res.status(500).json({ error: 'Failed to fetch reseller' });
  }
});

// POST /api/resellers - Create new reseller registration
router.post('/resellers', async (req, res) => {
  try {
    await ensureTable();
    const { nama, whatsapp, kota, alamat } = req.body || {};
    
    if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
      return res.status(400).json({ error: 'Nama is required' });
    }
    if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.trim().length === 0) {
      return res.status(400).json({ error: 'WhatsApp is required' });
    }
    if (!kota || typeof kota !== 'string' || kota.trim().length === 0) {
      return res.status(400).json({ error: 'Kota is required' });
    }
    if (!alamat || typeof alamat !== 'string' || alamat.trim().length === 0) {
      return res.status(400).json({ error: 'Alamat is required' });
    }

    const [result] = await db.query(
      'INSERT INTO resellers (nama, whatsapp, kota, alamat) VALUES (?, ?, ?, ?)',
      [
        nama.trim(),
        whatsapp.trim(),
        kota.trim(),
        alamat.trim()
      ]
    );

    const [newRecord] = await db.query('SELECT * FROM resellers WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (e) {
    console.error('Error creating reseller:', e);
    res.status(500).json({ error: 'Failed to create reseller registration' });
  }
});

// DELETE /api/resellers/:id - Delete reseller
router.delete('/resellers/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const [result] = await db.query('DELETE FROM resellers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    res.json({ message: 'Reseller deleted successfully' });
  } catch (e) {
    console.error('Error deleting reseller:', e);
    res.status(500).json({ error: 'Failed to delete reseller' });
  }
});

module.exports = router;

