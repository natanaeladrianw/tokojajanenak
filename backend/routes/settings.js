const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Ensure settings table exists
const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS settings (
      ` + '`key`' + ` VARCHAR(100) PRIMARY KEY,
      ` + '`value`' + ` TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

// Initialize table at load time
ensureTable().catch((e) => console.error('Failed ensuring settings table:', e));

// GET /api/settings?keys=a,b,c
router.get('/settings', async (req, res) => {
  try {
    await ensureTable();
    const keysParam = (req.query.keys || '').toString();
    const keys = keysParam
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length === 0) {
      const [rows] = await db.query('SELECT `key`, `value` FROM settings');
      return res.json(rows);
    }

    const placeholders = keys.map(() => '?').join(',');
    const [rows] = await db.query(`SELECT ` + '`key`, `value`' + ` FROM settings WHERE ` + '`key`' + ` IN (${placeholders})`, keys);
    return res.json(rows);
  } catch (e) {
    console.error('Error fetching settings:', e);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings  { key: string, value: string|null }
router.put('/settings', async (req, res) => {
  try {
    await ensureTable();
    const { key, value } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Invalid key' });
    }
    // Upsert
    await db.query(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      [key, value ?? null]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Error saving setting:', e);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

module.exports = router;


