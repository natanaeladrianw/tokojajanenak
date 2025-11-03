const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api', require('./routes/variantDetail')); // Variant and Detail Produk routes
app.use('/api', require('./routes/settings')); // Site settings (CTA texts)
app.use('/api/testimonials', require('./routes/testimonials')); // Testimonials images
app.use('/api/paket', require('./routes/paket')); // Paket images with links
app.use('/api/popup', require('./routes/popup')); // Popup images for landing
app.use('/api', require('./routes/whatsapp')); // WhatsApp numbers and message templates
app.use('/api', require('./routes/buyers')); // Buyers data (orders)
app.use('/api', require('./routes/resellers')); // Resellers data (registrations)

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ENAKHO LANDING PAGE Backend is running!',
    status: 'Success'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ENAKHO LANDING PAGE Server running on http://localhost:${PORT}`);
});