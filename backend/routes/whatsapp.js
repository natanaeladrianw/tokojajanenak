const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Ensure tables exist
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_numbers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone_number VARCHAR(20) NOT NULL UNIQUE,
      button_type VARCHAR(100) DEFAULT 'order,reseller,contact',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active (is_active),
      INDEX idx_button_type (button_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  // Add button_type column if not exists (for existing databases)
  try {
    await db.query(`ALTER TABLE whatsapp_numbers ADD COLUMN button_type VARCHAR(100) DEFAULT 'order,reseller,contact' AFTER phone_number`);
  } catch (e) {
    // Column might already exist, ignore error
    if (!e.message.includes('Duplicate column name')) {
      console.error('Error adding button_type column:', e);
    }
  }
  try {
    await db.query(`CREATE INDEX idx_button_type ON whatsapp_numbers(button_type)`);
  } catch (e) {
    // Index might already exist, ignore error
    if (!e.message.includes('Duplicate key name')) {
      console.error('Error adding index:', e);
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      template_type VARCHAR(50) NOT NULL UNIQUE,
      template_format TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_type (template_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

// Initialize tables and default data at load time
ensureTables().catch((e) => console.error('Failed ensuring whatsapp tables:', e));

// Function to initialize default data
const initializeDefaultData = async () => {
  try {
    await ensureTables();
    
    // Check and insert default WhatsApp numbers
    const [numbersCheck] = await db.query('SELECT COUNT(*) as count FROM whatsapp_numbers');
    if (numbersCheck[0].count === 0) {
      await db.query(`
        INSERT INTO whatsapp_numbers (phone_number, button_type, is_active) VALUES 
        ('6285745599571', 'order,reseller,contact', 1),
        ('62881026145072', 'order,reseller,contact', 1)
      `);
      console.log('✅ Default WhatsApp numbers inserted');
    } else {
      // Update existing numbers to have button_type if missing
      await db.query(`
        UPDATE whatsapp_numbers 
        SET button_type = 'order,reseller,contact' 
        WHERE button_type IS NULL OR button_type = ''
      `);
    }
    
    // Check and insert default message templates
    const [templatesCheck] = await db.query('SELECT COUNT(*) as count FROM message_templates');
    if (templatesCheck[0].count === 0) {
      const orderTemplate = `Halo admin ENAKHO!, saya mau pesan
*
Nama: {{nama}}
No WA: {{wa}}
Kota / Kecamatan: {{kota}}
Alamat: {{alamat}}
Keranjang:
{{keranjang}}
{{total_item}}
{{total_harga}}

Mohon segera diproses ya kak, Terima Kasih`;
      
      const resellerTemplate = `Halo admin ENAKHO!, saya mau daftar sebagai reseller
*
Nama: {{nama}}
No WA: {{wa}}
Kota / Kecamatan: {{kota}}
Alamat: {{alamat}}

Mohon segera diproses ya kak, Terima Kasih`;
      
      const contactTemplate = `Halo admin ENAKHO!,
Saya ingin bertanya {{pertanyaan}}.

Terima Kasih`;
      
      const packageTemplate = `Halo admin ENAKHO!, saya mau pesan paket {{nama_paket}}

Mohon segera diproses ya kak, Terima Kasih`;
      
      await db.query(`
        INSERT INTO message_templates (template_type, template_format) VALUES 
        ('order', ?),
        ('reseller', ?),
        ('contact', ?),
        ('package', ?)
      `, [orderTemplate, resellerTemplate, contactTemplate, packageTemplate]);
      console.log('✅ Default message templates inserted');
    } else {
      // Check if package template exists, if not insert it
      try {
        const [packageCheck] = await db.query('SELECT COUNT(*) as count FROM message_templates WHERE template_type = ?', ['package']);
        if (packageCheck[0].count === 0) {
          const packageTemplate = `Halo admin ENAKHO!, saya mau pesan paket {{nama_paket}}

Mohon segera diproses ya kak, Terima Kasih`;
          await db.query(`
            INSERT INTO message_templates (template_type, template_format) VALUES 
            ('package', ?)
          `, [packageTemplate]);
          console.log('✅ Package template inserted');
        }
      } catch (e) {
        console.error('Error checking/inserting package template:', e);
      }
    }
  } catch (e) {
    console.error('Error initializing default data:', e);
  }
};

// Initialize default data at load time
initializeDefaultData().catch((e) => console.error('Failed initializing default data:', e));

// Endpoint to manually initialize default data (for existing databases)
router.post('/whatsapp/init-defaults', async (req, res) => {
  try {
    await initializeDefaultData();
    res.json({ message: 'Default data initialized successfully' });
  } catch (e) {
    console.error('Error initializing default data:', e);
    res.status(500).json({ error: 'Failed to initialize default data' });
  }
});

// ==================== WHATSAPP NUMBERS CRUD ====================

// GET /api/whatsapp/numbers - Get all WhatsApp numbers
router.get('/whatsapp/numbers', async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await db.query('SELECT * FROM whatsapp_numbers ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    console.error('Error fetching WhatsApp numbers:', e);
    res.status(500).json({ error: 'Failed to fetch WhatsApp numbers' });
  }
});

// GET /api/whatsapp/numbers/active - Get active WhatsApp numbers only
// Optional query param: ?button_type=order|reseller|contact
router.get('/whatsapp/numbers/active', async (req, res) => {
  try {
    await ensureTables();
    const { button_type } = req.query;
    
    let query = 'SELECT * FROM whatsapp_numbers WHERE is_active = 1';
    const params = [];
    
    if (button_type) {
      // Find numbers that include this button_type in their button_type field
      query += ' AND (button_type LIKE ? OR button_type = ?)';
      params.push(`%${button_type}%`, button_type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params.length > 0 ? params : []);
    res.json(rows);
  } catch (e) {
    console.error('Error fetching active WhatsApp numbers:', e);
    res.status(500).json({ error: 'Failed to fetch active WhatsApp numbers' });
  }
});

// POST /api/whatsapp/numbers - Create new WhatsApp number
router.post('/whatsapp/numbers', async (req, res) => {
  try {
    await ensureTables();
    const { phone_number, button_type = 'order,reseller,contact', is_active = 1 } = req.body || {};
    
    if (!phone_number || typeof phone_number !== 'string' || phone_number.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Clean phone number (remove +, spaces, etc)
    const cleanNumber = phone_number.replace(/[^\d]/g, '');
    
    if (cleanNumber.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate and format button_type
    let buttonTypes = button_type;
    if (Array.isArray(button_type)) {
      buttonTypes = button_type.join(',');
    }
    // Ensure valid button types
    const validTypes = ['order', 'reseller', 'contact', 'package'];
    const types = buttonTypes.split(',').map(t => t.trim()).filter(t => validTypes.includes(t));
    if (types.length === 0) {
      return res.status(400).json({ error: 'At least one valid button type is required (order, reseller, contact, or package)' });
    }
    const finalButtonType = types.join(',');

    const [result] = await db.query(
      'INSERT INTO whatsapp_numbers (phone_number, button_type, is_active) VALUES (?, ?, ?)',
      [cleanNumber, finalButtonType, is_active ? 1 : 0]
    );

    const [newRecord] = await db.query('SELECT * FROM whatsapp_numbers WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    console.error('Error creating WhatsApp number:', e);
    res.status(500).json({ error: 'Failed to create WhatsApp number' });
  }
});

// PUT /api/whatsapp/numbers/:id - Update WhatsApp number
router.put('/whatsapp/numbers/:id', async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const { phone_number, button_type, is_active } = req.body || {};

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const updates = [];
    const values = [];

    if (phone_number !== undefined) {
      const cleanNumber = phone_number.replace(/[^\d]/g, '');
      if (cleanNumber.length < 10) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      updates.push('phone_number = ?');
      values.push(cleanNumber);
    }

    if (button_type !== undefined) {
      let buttonTypes = button_type;
      if (Array.isArray(button_type)) {
        buttonTypes = button_type.join(',');
      }
      const validTypes = ['order', 'reseller', 'contact', 'package'];
      const types = buttonTypes.split(',').map(t => t.trim()).filter(t => validTypes.includes(t));
      if (types.length === 0) {
        return res.status(400).json({ error: 'At least one valid button type is required (order, reseller, contact, or package)' });
      }
      updates.push('button_type = ?');
      values.push(types.join(','));
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await db.query(
      `UPDATE whatsapp_numbers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await db.query('SELECT * FROM whatsapp_numbers WHERE id = ?', [id]);
    if (updated.length === 0) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    res.json(updated[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    console.error('Error updating WhatsApp number:', e);
    res.status(500).json({ error: 'Failed to update WhatsApp number' });
  }
});

// DELETE /api/whatsapp/numbers/:id - Delete WhatsApp number
router.delete('/whatsapp/numbers/:id', async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const [result] = await db.query('DELETE FROM whatsapp_numbers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    res.json({ message: 'WhatsApp number deleted successfully' });
  } catch (e) {
    console.error('Error deleting WhatsApp number:', e);
    res.status(500).json({ error: 'Failed to delete WhatsApp number' });
  }
});

// ==================== MESSAGE TEMPLATES CRUD ====================

// GET /api/whatsapp/templates - Get all message templates
router.get('/whatsapp/templates', async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await db.query('SELECT * FROM message_templates ORDER BY template_type');
    res.json(rows);
  } catch (e) {
    console.error('Error fetching message templates:', e);
    res.status(500).json({ error: 'Failed to fetch message templates' });
  }
});

// GET /api/whatsapp/templates/:type - Get template by type
router.get('/whatsapp/templates/:type', async (req, res) => {
  try {
    await ensureTables();
    const { type } = req.params;
    const [rows] = await db.query('SELECT * FROM message_templates WHERE template_type = ?', [type]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error('Error fetching message template:', e);
    res.status(500).json({ error: 'Failed to fetch message template' });
  }
});

// POST /api/whatsapp/templates - Create new message template
router.post('/whatsapp/templates', async (req, res) => {
  try {
    await ensureTables();
    const { template_type, template_format } = req.body || {};
    
    if (!template_type || typeof template_type !== 'string' || template_type.trim().length === 0) {
      return res.status(400).json({ error: 'Template type is required' });
    }

    if (!template_format || typeof template_format !== 'string' || template_format.trim().length === 0) {
      return res.status(400).json({ error: 'Template format is required' });
    }

    const validTypes = ['order', 'reseller', 'contact', 'package'];
    if (!validTypes.includes(template_type)) {
      return res.status(400).json({ error: 'Invalid template type. Must be: order, reseller, contact, or package' });
    }

    const [result] = await db.query(
      'INSERT INTO message_templates (template_type, template_format) VALUES (?, ?)',
      [template_type, template_format]
    );

    const [newRecord] = await db.query('SELECT * FROM message_templates WHERE id = ?', [result.insertId]);
    res.status(201).json(newRecord[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Template type already exists' });
    }
    console.error('Error creating message template:', e);
    res.status(500).json({ error: 'Failed to create message template' });
  }
});

// PUT /api/whatsapp/templates/:type - Update message template
router.put('/whatsapp/templates/:type', async (req, res) => {
  try {
    await ensureTables();
    const { type } = req.params;
    const { template_format } = req.body || {};

    if (!template_format || typeof template_format !== 'string' || template_format.trim().length === 0) {
      return res.status(400).json({ error: 'Template format is required' });
    }

    const [result] = await db.query(
      'UPDATE message_templates SET template_format = ? WHERE template_type = ?',
      [template_format, type]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const [updated] = await db.query('SELECT * FROM message_templates WHERE template_type = ?', [type]);
    res.json(updated[0]);
  } catch (e) {
    console.error('Error updating message template:', e);
    res.status(500).json({ error: 'Failed to update message template' });
  }
});

// DELETE /api/whatsapp/templates/:type - Delete message template
router.delete('/whatsapp/templates/:type', async (req, res) => {
  try {
    await ensureTables();
    const { type } = req.params;

    const [result] = await db.query('DELETE FROM message_templates WHERE template_type = ?', [type]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (e) {
    console.error('Error deleting message template:', e);
    res.status(500).json({ error: 'Failed to delete message template' });
  }
});

module.exports = router;
