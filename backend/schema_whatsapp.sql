-- Schema untuk nomor WhatsApp admin dan format pesan
-- Jalankan file ini untuk membuat tabel yang diperlukan

-- Tabel untuk menyimpan nomor WhatsApp admin
CREATE TABLE IF NOT EXISTS whatsapp_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Nomor WhatsApp tanpa tanda +',
    button_type VARCHAR(100) DEFAULT 'order,reseller,contact' COMMENT 'Tombol yang menggunakan nomor ini: order, reseller, contact (bisa multiple, dipisah koma)',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Status aktif/nonaktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_button_type (button_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel untuk menyimpan format pesan untuk setiap tombol
CREATE TABLE IF NOT EXISTS message_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_type VARCHAR(50) NOT NULL UNIQUE COMMENT 'Jenis template: order, reseller, contact',
    template_format TEXT NOT NULL COMMENT 'Format pesan dengan placeholder seperti {{nama}}, {{wa}}, dll',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert data default untuk nomor WhatsApp (jika belum ada)
INSERT IGNORE INTO whatsapp_numbers (phone_number, button_type, is_active) VALUES 
('6285745599571', 'order,reseller,contact', 1),
('62881026145072', 'order,reseller,contact', 1);

-- Insert format pesan default
INSERT IGNORE INTO message_templates (template_type, template_format) VALUES 
('order', 'Halo admin ENAKHO!, saya mau pesan\n*\nNama: {{nama}}\nNo WA: {{wa}}\nKota / Kecamatan: {{kota}}\nAlamat: {{alamat}}\nKeranjang:\n{{keranjang}}\n{{total_item}}\n{{total_harga}}\n\nMohon segera diproses ya kak, Terima Kasih'),
('reseller', 'Halo admin ENAKHO!, saya mau daftar sebagai reseller\n*\nNama: {{nama}}\nNo WA: {{wa}}\nKota / Kecamatan: {{kota}}\nAlamat: {{alamat}}\n\nMohon segera diproses ya kak, Terima Kasih'),
('contact', 'Halo admin ENAKHO!,\nSaya ingin bertanya {{pertanyaan}}.\n\nTerima Kasih');
