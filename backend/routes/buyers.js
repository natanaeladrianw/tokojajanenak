const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Ensure table exists
const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS buyers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(20) NOT NULL,
      kota VARCHAR(255) NOT NULL,
      alamat TEXT NOT NULL,
      keranjang TEXT NOT NULL COMMENT 'JSON string atau text format dari keranjang',
      total_item INT DEFAULT 0,
      total_harga DECIMAL(15,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

// Initialize table at load time
ensureTable().catch((e) => console.error('Failed ensuring buyers table:', e));

// GET /api/buyers - Get all buyers
router.get('/buyers', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await db.query('SELECT * FROM buyers ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    console.error('Error fetching buyers:', e);
    res.status(500).json({ error: 'Failed to fetch buyers' });
  }
});

// GET /api/buyers/:id - Get buyer by ID
router.get('/buyers/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const [rows] = await db.query('SELECT * FROM buyers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Error fetching buyer:', e);
    res.status(500).json({ error: 'Failed to fetch buyer' });
  }
});

// POST /api/buyers - Create new buyer order
router.post('/buyers', async (req, res) => {
  try {
    await ensureTable();
    const { nama, whatsapp, kota, alamat, keranjang, total_item, total_harga } = req.body || {};
    
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
    if (!keranjang || typeof keranjang !== 'string' || keranjang.trim().length === 0) {
      return res.status(400).json({ error: 'Keranjang is required' });
    }

    const [result] = await db.query(
      'INSERT INTO buyers (nama, whatsapp, kota, alamat, keranjang, total_item, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        nama.trim(),
        whatsapp.trim(),
        kota.trim(),
        alamat.trim(),
        keranjang,
        total_item || 0,
        total_harga || 0
      ]
    );

    const [newRecord] = await db.query('SELECT * FROM buyers WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (e) {
    console.error('Error creating buyer:', e);
    res.status(500).json({ error: 'Failed to create buyer order' });
  }
});

// DELETE /api/buyers/:id - Delete buyer
router.delete('/buyers/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const [result] = await db.query('DELETE FROM buyers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    res.json({ message: 'Buyer deleted successfully' });
  } catch (e) {
    console.error('Error deleting buyer:', e);
    res.status(500).json({ error: 'Failed to delete buyer' });
  }
});

module.exports = router;

