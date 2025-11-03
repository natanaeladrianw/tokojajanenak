const express = require('express');
const pool = require('../models/database');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    let { username, password } = req.body;
    username = (username || '').trim();
    password = (password || '').trim();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }
    // Match ERD: table `user` with columns `username`, `password`
    const [users] = await pool.execute(
      'SELECT * FROM `user` WHERE `username` = ? AND `password` = ?',
      [username, password]
    );

    if (users.length > 0) {
      res.json({ 
        success: true, 
        message: 'Login berhasil',
        user: users[0]
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
});

module.exports = router;