import React, { useState, useRef } from 'react';
import { apiClient, getImageUrl } from '../config/api';
import { useToast, ToastContainer } from './Toast';
import ConfirmationModal from './ConfirmationModal';

const AdminPanel = ({ products, onUpdate, user }) => {
  // Currency helpers for ID format
  const parseRupiahToInt = (value) => {
    const digits = String(value ?? '').replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };
  const formatRupiahFromNumber = (num) => {
    const n = Number(num || 0);
    return 'Rp ' + Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  };
  const formatRupiahFromString = (value) => {
    const digits = String(value ?? '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    const n = parseInt(digits, 10);
    return 'Rp ' + Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  };

  const { toasts, showToast, removeToast } = useToast();
  
  // Confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'product', // 'product', 'carousel', 'variant', or 'detail'
    id: null,
    message: ''
  });
  // Carousel state
  const [carousel, setCarousel] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newCarousel, setNewCarousel] = useState({ image: null, sort_order: '', is_active: true });
  const fileInputRef = useRef(null);

  const fetchCarousel = async () => {
    try {
      const res = await apiClient.get('/api/carousel/all');
      setCarousel(res.data);
    } catch (e) {
      console.error('Error fetching carousel:', e);
    }
  };

  React.useEffect(() => { fetchCarousel(); }, []);

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState({ image: null, sort_order: '', is_active: true });
  const testiFileInputRef = useRef(null);
  const [testiPreview, setTestiPreview] = useState(null);

  // Paket state
  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({ image: null, tipe: '', link_shopee: '', link_tiktok: '', subtitle_wa: '', subtitle_shopee: '', subtitle_tiktok: '', active_wa: true, active_shopee: true, active_tiktok: true, sort_order: '', is_active: true });
  const paketFileInputRef = useRef(null);
  const [paketPreview, setPaketPreview] = useState(null);

  const fetchTestimonials = async () => {
    try {
      const res = await apiClient.get('/api/testimonials/all');
      setTestimonials(res.data);
    } catch (e) {
      console.error('Error fetching testimonials:', e);
    }
  };
  React.useEffect(() => { fetchTestimonials(); }, []);
  const fetchPackages = async () => {
    try {
      const res = await apiClient.get('/api/paket/all');
      setPackages(res.data);
    } catch (e) { console.error('Error fetching paket:', e); }
  };
  React.useEffect(() => { fetchPackages(); }, []);

  // Popup state
  const [popups, setPopups] = useState([]);
  const [newPopup, setNewPopup] = useState({ image: null, sort_order: '', is_active: true });
  const popupFileRef = useRef(null);
  const [popupPreview, setPopupPreview] = useState(null);
  const fetchPopups = async () => {
    try {
      const res = await apiClient.get('/api/popup/all');
      setPopups(res.data);
    } catch (e) { console.error('Error fetching popups:', e); }
  };
  React.useEffect(() => { fetchPopups(); }, []);
  const handleAddPopup = async (e) => {
    e.preventDefault();
    if (!newPopup.image) { showToast('Pilih gambar terlebih dahulu!', 'error'); return; }
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', newPopup.image);
      if (newPopup.sort_order !== '') data.append('sort_order', newPopup.sort_order);
      data.append('is_active', newPopup.is_active ? '1' : '0');
      await apiClient.post('/api/popup', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewPopup({ image: null, sort_order: '', is_active: true });
      setPopupPreview(null);
      if (popupFileRef.current) popupFileRef.current.value='';
      await fetchPopups();
      showToast('Popup berhasil ditambahkan!', 'success');
    } catch (e) {
      console.error('Error creating popup:', e);
      showToast('Gagal menambahkan popup: ' + (e.response?.data?.error || e.message), 'error');
    } finally { setUploading(false); }
  };
  const handleUpdatePopup = async (item) => {
    try {
      const data = new FormData();
      if (item._newFile) data.append('image', item._newFile);
      if (item.sort_order !== undefined) data.append('sort_order', item.sort_order);
      data.append('is_active', item.is_active ? '1' : '0');
      await apiClient.put(`/api/popup/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchPopups();
      showToast('Popup berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating popup:', e);
      showToast('Gagal mengupdate popup: ' + (e.response?.data?.error || e.message), 'error');
    }
  };
  const handleDeletePopup = async (id) => {
    setDeleteModal({ isOpen: true, type: 'popup', id, message: 'Hapus gambar popup ini?' });
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.image) {
      showToast('Pilih gambar terlebih dahulu!', 'error');
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', newTestimonial.image);
      if (newTestimonial.sort_order !== '') data.append('sort_order', newTestimonial.sort_order);
      data.append('is_active', newTestimonial.is_active ? '1' : '0');
      await apiClient.post('/api/testimonials', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewTestimonial({ image: null, sort_order: '', is_active: true });
      setTestiPreview(null);
      if (testiFileInputRef.current) testiFileInputRef.current.value = '';
      await fetchTestimonials();
      showToast('Gambar testimoni berhasil ditambahkan!', 'success');
    } catch (e) {
      console.error('Error creating testimonial:', e);
      showToast('Gagal menambahkan gambar testimoni: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateTestimonial = async (item) => {
    try {
      const data = new FormData();
      if (item._newFile) data.append('image', item._newFile);
      if (item.sort_order !== undefined) data.append('sort_order', item.sort_order);
      data.append('is_active', item.is_active ? '1' : '0');
      await apiClient.put(`/api/testimonials/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchTestimonials();
      showToast('Testimoni berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating testimonial:', e);
      showToast('Gagal mengupdate testimoni: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    setDeleteModal({ isOpen: true, type: 'testi', id, message: 'Hapus gambar testimoni ini?' });
  };

  const handleAddCarousel = async (e) => {
    e.preventDefault();
    if (!newCarousel.image) {
      showToast('Pilih gambar terlebih dahulu!', 'error');
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', newCarousel.image);
      if (newCarousel.sort_order !== '') data.append('sort_order', newCarousel.sort_order);
      data.append('is_active', newCarousel.is_active ? '1' : '0');
      await apiClient.post('/api/carousel', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // Reset form
      setNewCarousel({ image: null, sort_order: '', is_active: true });
      setCarouselPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh data
      await fetchCarousel();
      onUpdate();
      
      showToast('Gambar slider berhasil ditambahkan!', 'success');
    } catch (e) {
      console.error('Error creating carousel:', e);
      showToast('Gagal menambahkan gambar slider: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateCarousel = async (item) => {
    try {
      const data = new FormData();
      if (item._newFile) data.append('image', item._newFile);
      if (item.sort_order !== undefined) data.append('sort_order', item.sort_order);
      data.append('is_active', item.is_active ? '1' : '0');
      await apiClient.put(`/api/carousel/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchCarousel();
      onUpdate();
      showToast('Gambar slider berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating carousel:', e);
      showToast('Gagal mengupdate gambar slider: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const handleDeleteCarousel = async (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'carousel',
      id: id,
      message: 'Apakah Anda yakin ingin menghapus gambar slider ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDeleteCarousel = async () => {
    try {
      await apiClient.delete(`/api/carousel/${deleteModal.id}`);
      await fetchCarousel();
      onUpdate();
      showToast('Gambar slider berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting carousel:', e);
      showToast('Gagal menghapus gambar slider: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  const confirmDeleteTesti = async () => {
    try {
      await apiClient.delete(`/api/testimonials/${deleteModal.id}`);
      await fetchTestimonials();
      showToast('Gambar testimoni berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting testimonial:', e);
      showToast('Gagal menghapus testimoni: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  const confirmDeletePopup = async () => {
    try {
      await apiClient.delete(`/api/popup/${deleteModal.id}`);
      await fetchPopups();
      showToast('Gambar popup berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting popup:', e);
      showToast('Gagal menghapus popup: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    if (!newPackage.image || !newPackage.tipe.trim()) {
      showToast('Tipe dan gambar wajib diisi!', 'error');
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', newPackage.image);
      data.append('tipe', newPackage.tipe.trim());
      if (newPackage.link_shopee) data.append('link_shopee', newPackage.link_shopee);
      if (newPackage.link_tiktok) data.append('link_tiktok', newPackage.link_tiktok);
      if (newPackage.subtitle_wa) data.append('subtitle_wa', newPackage.subtitle_wa);
      if (newPackage.subtitle_shopee) data.append('subtitle_shopee', newPackage.subtitle_shopee);
      if (newPackage.subtitle_tiktok) data.append('subtitle_tiktok', newPackage.subtitle_tiktok);
      data.append('active_wa', newPackage.active_wa ? '1' : '0');
      data.append('active_shopee', newPackage.active_shopee ? '1' : '0');
      data.append('active_tiktok', newPackage.active_tiktok ? '1' : '0');
      if (newPackage.sort_order !== '') data.append('sort_order', newPackage.sort_order);
      data.append('is_active', newPackage.is_active ? '1' : '0');
      await apiClient.post('/api/paket', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewPackage({ image: null, tipe: '', link_shopee: '', link_tiktok: '', subtitle_wa: '', subtitle_shopee: '', subtitle_tiktok: '', active_wa: true, active_shopee: true, active_tiktok: true, sort_order: '', is_active: true });
      setPaketPreview(null);
      if (paketFileInputRef.current) paketFileInputRef.current.value = '';
      await fetchPackages();
      showToast('Paket berhasil ditambahkan!', 'success');
    } catch (e) {
      console.error('Error creating paket:', e);
      showToast('Gagal menambahkan paket: ' + (e.response?.data?.error || e.message), 'error');
    } finally { setUploading(false); }
  };

  const handleUpdatePackage = async (item) => {
    try {
      const data = new FormData();
      if (item._newFile) data.append('image', item._newFile);
      if (item.tipe !== undefined) data.append('tipe', item.tipe);
      if (item.link_shopee !== undefined) data.append('link_shopee', item.link_shopee);
      if (item.link_tiktok !== undefined) data.append('link_tiktok', item.link_tiktok);
      if (item.subtitle_wa !== undefined) data.append('subtitle_wa', item.subtitle_wa);
      if (item.subtitle_shopee !== undefined) data.append('subtitle_shopee', item.subtitle_shopee);
      if (item.subtitle_tiktok !== undefined) data.append('subtitle_tiktok', item.subtitle_tiktok);
      if (item.active_wa !== undefined) data.append('active_wa', item.active_wa ? '1' : '0');
      if (item.active_shopee !== undefined) data.append('active_shopee', item.active_shopee ? '1' : '0');
      if (item.active_tiktok !== undefined) data.append('active_tiktok', item.active_tiktok ? '1' : '0');
      if (item.sort_order !== undefined) data.append('sort_order', item.sort_order);
      data.append('is_active', item.is_active ? '1' : '0');
      await apiClient.put(`/api/paket/${item.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchPackages();
      showToast('Paket berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating paket:', e);
      showToast('Gagal mengupdate paket: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const handleDeletePackage = async (id) => {
    setDeleteModal({ isOpen: true, type: 'paket', id, message: 'Hapus paket ini?' });
  };

  const confirmDeletePaket = async () => {
    try {
      await apiClient.delete(`/api/paket/${deleteModal.id}`);
      await fetchPackages();
      showToast('Paket berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting paket:', e);
      showToast('Gagal menghapus paket: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Varian & Detail Produk State - Must be declared before functions that use them
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'carousel', 'variants', 'details', 'settings', 'whatsapp', 'buyers', 'resellers'

  // WhatsApp & Message Templates State
  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [newWhatsappNumber, setNewWhatsappNumber] = useState({ 
    phone_number: '', 
    button_type: ['order', 'reseller', 'contact'], 
    is_active: true 
  });
  const [editingWhatsappNumber, setEditingWhatsappNumber] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  // Buyers State
  const [buyers, setBuyers] = useState([]);
  // Resellers State
  const [resellers, setResellers] = useState([]);
  const [selectedVariantProductId, setSelectedVariantProductId] = useState(null);
  const [selectedDetailProductId, setSelectedDetailProductId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [details, setDetails] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Fetch WhatsApp numbers and templates
  const fetchWhatsappNumbers = async () => {
    try {
      const res = await apiClient.get('/api/whatsapp/numbers');
      setWhatsappNumbers(res.data);
    } catch (e) {
      console.error('Error fetching WhatsApp numbers:', e);
      showToast('Gagal memuat nomor WhatsApp', 'error');
    }
  };

  const fetchMessageTemplates = async () => {
    try {
      const res = await apiClient.get('/api/whatsapp/templates');
      setMessageTemplates(res.data);
    } catch (e) {
      console.error('Error fetching message templates:', e);
      showToast('Gagal memuat format pesan', 'error');
    }
  };

  // Fetch WhatsApp data when whatsapp tab is active
  React.useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWhatsappNumbers();
      fetchMessageTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch Buyers data
  const fetchBuyers = async () => {
    try {
      const res = await apiClient.get('/api/buyers');
      setBuyers(res.data || []);
    } catch (e) {
      console.error('Error fetching buyers:', e);
      showToast('Gagal memuat data pembeli', 'error');
    }
  };

  // Fetch Buyers data when buyers tab is active
  React.useEffect(() => {
    if (activeTab === 'buyers') {
      fetchBuyers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch Resellers data
  const fetchResellers = async () => {
    try {
      const res = await apiClient.get('/api/resellers');
      setResellers(res.data || []);
    } catch (e) {
      console.error('Error fetching resellers:', e);
      showToast('Gagal memuat data reseller', 'error');
    }
  };

  // Fetch Resellers data when resellers tab is active
  React.useEffect(() => {
    if (activeTab === 'resellers') {
      fetchResellers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Delete Reseller handler
  const handleDeleteReseller = (id) => {
    setDeleteModal({ isOpen: true, type: 'reseller', id, message: 'Hapus data reseller ini?' });
  };

  const confirmDeleteReseller = async () => {
    try {
      await apiClient.delete(`/api/resellers/${deleteModal.id}`);
      await fetchResellers();
      showToast('Data reseller berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting reseller:', e);
      showToast('Gagal menghapus data reseller: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Delete Buyer handler
  const handleDeleteBuyer = (id) => {
    setDeleteModal({ isOpen: true, type: 'buyer', id, message: 'Hapus data pembeli ini?' });
  };

  const confirmDeleteBuyer = async () => {
    try {
      await apiClient.delete(`/api/buyers/${deleteModal.id}`);
      await fetchBuyers();
      showToast('Data pembeli berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting buyer:', e);
      showToast('Gagal menghapus data pembeli: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // WhatsApp Number CRUD handlers
  const handleAddWhatsappNumber = async (e) => {
    e.preventDefault();
    if (!newWhatsappNumber.phone_number || !newWhatsappNumber.phone_number.trim()) {
      showToast('Nomor WhatsApp wajib diisi!', 'error');
      return;
    }
    if (!newWhatsappNumber.button_type || newWhatsappNumber.button_type.length === 0) {
      showToast('Pilih minimal satu tombol!', 'error');
      return;
    }
    try {
      await apiClient.post('/api/whatsapp/numbers', {
        phone_number: newWhatsappNumber.phone_number,
        button_type: newWhatsappNumber.button_type,
        is_active: newWhatsappNumber.is_active ? 1 : 0
      });
      setNewWhatsappNumber({ phone_number: '', button_type: ['order', 'reseller', 'contact'], is_active: true });
      await fetchWhatsappNumbers();
      showToast('Nomor WhatsApp berhasil ditambahkan!', 'success');
    } catch (e) {
      console.error('Error adding WhatsApp number:', e);
      showToast('Gagal menambahkan nomor WhatsApp: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const handleUpdateWhatsappNumber = async (id, updates) => {
    try {
      // Ensure button_type is sent as array if it exists
      if (updates.button_type && typeof updates.button_type === 'string') {
        updates.button_type = updates.button_type.split(',').map(t => t.trim());
      }
      await apiClient.put(`/api/whatsapp/numbers/${id}`, updates);
      await fetchWhatsappNumbers();
      setEditingWhatsappNumber(null);
      showToast('Nomor WhatsApp berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating WhatsApp number:', e);
      showToast('Gagal mengupdate nomor WhatsApp: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const handleDeleteWhatsappNumber = async (id) => {
    setDeleteModal({ isOpen: true, type: 'whatsapp_number', id, message: 'Hapus nomor WhatsApp ini?' });
  };

  const confirmDeleteWhatsappNumber = async () => {
    try {
      await apiClient.delete(`/api/whatsapp/numbers/${deleteModal.id}`);
      await fetchWhatsappNumbers();
      showToast('Nomor WhatsApp berhasil dihapus!', 'success');
    } catch (e) {
      console.error('Error deleting WhatsApp number:', e);
      showToast('Gagal menghapus nomor WhatsApp: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Message Template CRUD handlers
  const handleUpdateTemplate = async (type, format) => {
    try {
      await apiClient.put(`/api/whatsapp/templates/${type}`, {
        template_format: format
      });
      await fetchMessageTemplates();
      setEditingTemplate(null);
      showToast('Format pesan berhasil diupdate!', 'success');
    } catch (e) {
      console.error('Error updating template:', e);
      showToast('Gagal mengupdate format pesan: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  const [variantFormData, setVariantFormData] = useState({ nama_varian: '', harga: '' });
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({ keterangan: '', gambar: null });
  const [detailPreview, setDetailPreview] = useState(null);
  const detailImageInputRef = useRef(null);

  // CTA Settings state
  const [settings, setSettings] = useState({
    cta_whatsapp: '',
    cta_shopee: '',
    cta_tiktok: '',
    cta_reseller: '',
    cta_shopee_link: '',
    cta_tiktok_link: ''
  });
  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/settings', { params: { keys: 'cta_whatsapp,cta_shopee,cta_tiktok,cta_reseller,cta_shopee_link,cta_tiktok_link' }});
      const map = { cta_whatsapp: '', cta_shopee: '', cta_tiktok: '', cta_reseller: '', cta_shopee_link: '', cta_tiktok_link: '' };
      (res.data || []).forEach(r => { map[r.key] = r.value ?? ''; });
      setSettings(map);
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };
  React.useEffect(() => { fetchSettings(); }, []);
  const saveSetting = async (key, value) => {
    await apiClient.put('/api/settings', { key, value });
  };

  // Fetch variants for a product
  const fetchVariants = async (produkId) => {
    try {
      const res = await apiClient.get(`/api/varian/${produkId}`);
      setVariants(res.data);
    } catch (error) {
      console.error('Error fetching variants:', error);
      showToast('Gagal memuat varian: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Fetch details for a product
  const fetchDetails = async (produkId) => {
    try {
      const res = await apiClient.get(`/api/detail/${produkId}`);
      setDetails(res.data);
    } catch (error) {
      console.error('Error fetching details:', error);
      showToast('Gagal memuat detail produk: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Handle product selection per tab
  React.useEffect(() => {
    if (activeTab === 'variants' && selectedVariantProductId) {
      fetchVariants(selectedVariantProductId);
    } else if (activeTab === 'details' && selectedDetailProductId) {
      fetchDetails(selectedDetailProductId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantProductId, selectedDetailProductId, activeTab]);

  // Varian CRUD handlers
  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    if (!variantFormData.nama_varian || variantFormData.nama_varian.trim() === '') {
      showToast('Nama varian tidak boleh kosong!', 'error');
      return;
    }
    // Validasi harga bila diisi
    if (variantFormData.harga !== '' && (Number.isNaN(parseRupiahToInt(variantFormData.harga)) || parseRupiahToInt(variantFormData.harga) < 0)) {
      showToast('Harga tidak valid!', 'error');
      return;
    }
    try {
      if (editingVariant) {
        // No-change validation for variant update
        const newName = variantFormData.nama_varian.trim();
        const currentName = (editingVariant.nama_varian || '').trim();
        const newPrice = variantFormData.harga === '' ? (editingVariant.harga ?? 0) : parseRupiahToInt(variantFormData.harga);
        const priceUnchanged = (editingVariant.harga ?? 0) === (variantFormData.harga === '' ? (editingVariant.harga ?? 0) : parseRupiahToInt(variantFormData.harga));
        if (newName === currentName && priceUnchanged) {
          showToast('Tidak ada yang diperbarui. Ubah nama varian atau harga.', 'error');
          return;
        }
        await apiClient.put(`/api/varian/${editingVariant.id}`, {
          nama_varian: newName,
          harga: newPrice
        });
        showToast('Varian berhasil diupdate!', 'success');
      } else {
        await apiClient.post('/api/varian', {
          nama_varian: variantFormData.nama_varian.trim(),
          harga: variantFormData.harga === '' ? 0 : parseRupiahToInt(variantFormData.harga),
          produk_id: selectedVariantProductId
        });
        showToast('Varian berhasil ditambahkan!', 'success');
      }
      await fetchVariants(selectedVariantProductId);
      setShowVariantForm(false);
      setEditingVariant(null);
      setVariantFormData({ nama_varian: '', harga: '' });
    } catch (error) {
      console.error('Error saving variant:', error);
      showToast('Gagal menyimpan varian: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleDeleteVariant = (id, nama_varian) => {
    setDeleteModal({
      isOpen: true,
      type: 'variant',
      id: id,
      message: `Apakah Anda yakin ingin menghapus varian "${nama_varian}"? Tindakan ini tidak dapat dibatalkan.`
    });
  };

  const confirmDeleteVariant = async () => {
    try {
      await apiClient.delete(`/api/varian/${deleteModal.id}`);
      await fetchVariants(selectedVariantProductId);
      showToast('Varian berhasil dihapus!', 'success');
    } catch (error) {
      console.error('Error deleting variant:', error);
      showToast('Gagal menghapus varian: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Detail Produk CRUD handlers
  const handleSubmitDetail = async (e) => {
    e.preventDefault();
    if (!selectedDetailProductId) {
      showToast('Pilih produk terlebih dahulu!', 'error');
      return;
    }
    if (!editingDetail && !detailFormData.gambar) {
      showToast('Gambar detail produk diperlukan!', 'error');
      return;
    }
    try {
      const data = new FormData();
      data.append('produk_id', selectedDetailProductId);
      data.append('keterangan', detailFormData.keterangan || '');
      if (detailFormData.gambar instanceof File) {
        data.append('gambar', detailFormData.gambar);
      }

      if (editingDetail) {
        // No-change validation for detail update
        const newText = (detailFormData.keterangan || '').trim();
        const currentText = (editingDetail.keterangan || '').trim();
        const imageUnchanged = !(detailFormData.gambar instanceof File);
        if (newText === currentText && imageUnchanged) {
          showToast('Tidak ada yang diperbarui. Silakan ubah keterangan atau upload gambar baru.', 'error');
          return;
        }
        await apiClient.put(`/api/detail/${editingDetail.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Detail produk berhasil diupdate!', 'success');
      } else {
        await apiClient.post('/api/detail', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Detail produk berhasil ditambahkan!', 'success');
      }
      await fetchDetails(selectedDetailProductId);
      setShowDetailForm(false);
      setEditingDetail(null);
      setDetailFormData({ keterangan: '', gambar: null });
      setDetailPreview(null);
      if (detailImageInputRef.current) {
        detailImageInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error saving detail:', error);
      showToast('Gagal menyimpan detail produk: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleDeleteDetail = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'detail',
      id: id,
      message: 'Apakah Anda yakin ingin menghapus detail produk ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDeleteDetail = async () => {
    try {
      await apiClient.delete(`/api/detail/${deleteModal.id}`);
      await fetchDetails(selectedDetailProductId);
      showToast('Detail produk berhasil dihapus!', 'success');
    } catch (error) {
      console.error('Error deleting detail:', error);
      showToast('Gagal menghapus detail produk: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nama_produk: '',
    gambar_produk: null,
    varian: []
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [carouselPreview, setCarouselPreview] = useState(null);
  const productImageInputRef = useRef(null);
  
  // Search & Pagination States
  const ITEMS_PER_PAGE = 6;
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [variantSearch, setVariantSearch] = useState('');
  const [variantPage, setVariantPage] = useState(1);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  // Reset pages when dependencies change
  React.useEffect(() => {
    setProductPage(1);
  }, [productSearch]);
  React.useEffect(() => {
    setVariantPage(1);
  }, [variantSearch, selectedVariantProductId]);
  React.useEffect(() => {
    setDetailPage(1);
  }, [detailSearch, selectedDetailProductId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi nama produk tidak boleh kosong
    if (!formData.nama_produk || formData.nama_produk.trim() === '') {
      showToast('Nama produk tidak boleh kosong!', 'error');
      return;
    }

    // Validasi untuk update: cek apakah ada perubahan
    if (editingProduct) {
      const namaProdukBerubah = formData.nama_produk.trim() !== editingProduct.nama_produk.trim();
      // gambar_produk adalah File object jika ada gambar baru, atau null/string jika tidak ada perubahan
      const adaGambarBaru = formData.gambar_produk instanceof File;
      
      if (!namaProdukBerubah && !adaGambarBaru) {
        showToast('Tidak ada yang diperbarui. Silakan ubah nama produk atau upload gambar baru.', 'error');
        return;
      }
    }

    try {
      const data = new FormData();
      data.append('nama_produk', formData.nama_produk.trim());
      if (formData.gambar_produk instanceof File) {
        data.append('gambar_produk', formData.gambar_produk);
      }
      data.append('varian', JSON.stringify(formData.varian || []));

      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Produk berhasil diupdate!', 'success');
      } else {
        await apiClient.post('/api/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Produk berhasil ditambahkan!', 'success');
      }
      
      onUpdate();
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ nama_produk: '', gambar_produk: null, varian: [] });
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Terjadi kesalahan saat menyimpan produk';
      showToast('Gagal menyimpan produk: ' + errorMessage, 'error');
    }
  };

  const handleDelete = (id) => {
    setDeleteModal({
      isOpen: true,
      type: 'product',
      id: id,
      message: 'Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const confirmDeleteProduct = async () => {
    try {
      await apiClient.delete(`/api/products/${deleteModal.id}`);
        onUpdate();
      showToast('Produk berhasil dihapus!', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
      showToast('Gagal menghapus produk: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Enable horizontal scroll (wheel + drag) for tabs
  const tabsScrollRef = React.useRef(null);
  React.useEffect(() => {
    const container = tabsScrollRef.current;
    if (!container) return;

    // Wheel to horizontal scroll
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    };
    const onMouseLeave = () => {
      isDown = false;
      container.style.cursor = '';
    };
    const onMouseUp = () => {
      isDown = false;
      container.style.cursor = '';
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1; // multiplier for speed
      container.scrollLeft = scrollLeft - walk;
    };

    // Touch support
    let touchStartX = 0;
    let touchScrollLeft = 0;
    const onTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchScrollLeft = container.scrollLeft;
    };
    const onTouchMove = (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      container.scrollLeft = touchScrollLeft - dx;
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="food-theme-bg dimsum-pattern" style={{minHeight: '100vh', paddingTop: '20px', paddingBottom: '40px'}}>
    <div className="container mt-4">
        <h2 className="fw-bold text-with-shadow mb-4" style={{color: 'white'}}>Admin Panel</h2>

        {/* Tabs */}
        <div 
          className="nav-tabs-container mb-4" 
          ref={tabsScrollRef}
          style={{
            borderBottom: '2px solid #6d2316',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            width: '100%',
            cursor: 'grab'
          }}
        >
          <ul 
            className="nav nav-tabs mb-0" 
            style={{
              display: 'inline-flex',
              flexWrap: 'nowrap',
              minWidth: 'max-content',
              borderBottom: 'none',
              paddingRight: '20px'
            }}
          >
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
                style={{
                  color: activeTab === 'products' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'products' ? 'white' : 'transparent',
                  border: activeTab === 'products' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'products' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'products' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Produk
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'variants' ? 'active' : ''}`}
                onClick={() => setActiveTab('variants')}
                style={{
                  color: activeTab === 'variants' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'variants' ? 'white' : 'transparent',
                  border: activeTab === 'variants' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'variants' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'variants' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Varian
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
                style={{
                  color: activeTab === 'details' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'details' ? 'white' : 'transparent',
                  border: activeTab === 'details' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'details' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Detail Produk
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'carousel' ? 'active' : ''}`}
                onClick={() => setActiveTab('carousel')}
                style={{
                  color: activeTab === 'carousel' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'carousel' ? 'white' : 'transparent',
                  border: activeTab === 'carousel' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'carousel' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'carousel' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Slider Carousel
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'testimonials' ? 'active' : ''}`}
                onClick={() => setActiveTab('testimonials')}
                style={{
                  color: activeTab === 'testimonials' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'testimonials' ? 'white' : 'transparent',
                  border: activeTab === 'testimonials' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'testimonials' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'testimonials' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Testimoni
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'paket' ? 'active' : ''}`}
                onClick={() => setActiveTab('paket')}
                style={{
                  color: activeTab === 'paket' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'paket' ? 'white' : 'transparent',
                  border: activeTab === 'paket' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'paket' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'paket' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Paket
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'popup' ? 'active' : ''}`}
                onClick={() => setActiveTab('popup')}
                style={{
                  color: activeTab === 'popup' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'popup' ? 'white' : 'transparent',
                  border: activeTab === 'popup' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'popup' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'popup' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Pengaturan Pop Up
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{
                  color: activeTab === 'settings' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'settings' ? 'white' : 'transparent',
                  border: activeTab === 'settings' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'settings' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Pengaturan CTA
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setActiveTab('whatsapp')}
                style={{
                  color: activeTab === 'whatsapp' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'whatsapp' ? 'white' : 'transparent',
                  border: activeTab === 'whatsapp' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'whatsapp' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'whatsapp' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                WhatsApp & Format Pesan
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'buyers' ? 'active' : ''}`}
                onClick={() => setActiveTab('buyers')}
                style={{
                  color: activeTab === 'buyers' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'buyers' ? 'white' : 'transparent',
                  border: activeTab === 'buyers' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'buyers' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'buyers' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Data Pembeli
              </button>
            </li>
            <li className="nav-item" style={{flexShrink: 0, marginRight: '8px'}}>
              <button 
                className={`nav-link ${activeTab === 'resellers' ? 'active' : ''}`}
                onClick={() => setActiveTab('resellers')}
                style={{
                  color: activeTab === 'resellers' ? '#6d2316' : 'white',
                  backgroundColor: activeTab === 'resellers' ? 'white' : 'transparent',
                  border: activeTab === 'resellers' ? '2px solid #6d2316' : '2px solid transparent',
                  borderBottom: activeTab === 'resellers' ? '2px solid white' : 'none',
                  fontWeight: activeTab === 'resellers' ? 'bold' : 'normal',
                  borderRadius: '8px 8px 0 0',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  padding: '8px 16px'
                }}
              >
                Data Reseller
              </button>
            </li>
          </ul>
        </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{flexWrap: 'nowrap', gap: '12px'}}>
            <h3 className="fw-bold mb-0" style={{color: '#6d2316', fontSize: '1.5rem'}}>Mengelola Produk</h3>
        <button 
              className="btn fw-bold"
              onClick={() => {
                // Reset form dan buka form baru untuk tambah produk
                setEditingProduct(null);
                setFormData({ nama_produk: '', gambar_produk: null, varian: [] });
                setImagePreview(null);
                if (productImageInputRef.current) {
                  productImageInputRef.current.value = '';
                }
                setShowForm(true);
              }}
              style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px', whiteSpace: 'nowrap'}}
        >
          + Tambah Produk
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold" style={{color: '#6d2316'}}>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold" style={{color: '#6d2316'}}>Nama Produk</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nama_produk}
                  onChange={(e) => setFormData({...formData, nama_produk: e.target.value})}
                  required
                  style={{borderRadius: '8px'}}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Produk</label>
                <input
                  ref={productImageInputRef}
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    setFormData({...formData, gambar_produk: file});
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  required={!editingProduct}
                  style={{borderRadius: '8px'}}
                />
                {imagePreview && (
                  <div className="mt-2" style={{position: 'relative', display: 'inline-block'}}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        borderRadius: '8px',
                        border: '2px solid #6d2316',
                        padding: '4px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({...formData, gambar_produk: null});
                        if (productImageInputRef.current) {
                          productImageInputRef.current.value = '';
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 53, 69, 0.9)',
                        border: 'none',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1',
                        padding: '0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {editingProduct && !imagePreview && editingProduct.gambar_produk && (
                  <div className="mt-2">
                    <label className="form-label small text-muted">Gambar saat ini:</label>
                    <img 
                      src={getImageUrl(editingProduct.gambar_produk)} 
                      alt="Current" 
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        borderRadius: '8px',
                        border: '2px solid #6d2316',
                        padding: '4px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn fw-bold" style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px'}}>
                  {editingProduct ? 'Update' : 'Simpan'}
                </button>
                <button 
                  type="button" 
                  className="btn fw-bold"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    setFormData({ nama_produk: '', gambar_produk: null, varian: [] });
                    setImagePreview(null);
                  }}
                  style={{backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px'}}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search - Products */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Cari produk..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{borderRadius: '8px', maxWidth: '400px'}}
        />
      </div>

      {/* Products List */}
      {(() => {
        const keyword = (productSearch || '').toLowerCase().trim();
        const filtered = (products || []).filter(p => (p?.nama_produk || '').toLowerCase().includes(keyword));
        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        const page = Math.min(productPage, totalPages);
        const startIdx = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
        return (
          <>
            <div className="row" style={{minHeight: '540px'}}>
              {pageItems.map(product => (
          <div key={product.id} className="col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold" style={{color: '#6d2316'}}>{product.nama_produk}</h5>
                <p className="card-text">
                  <strong>Varian:</strong> {product.varian.join(', ') || 'Tidak ada varian'}
                </p>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm fw-bold"
                    onClick={() => {
                      // Reset form sebelumnya dan buka form edit untuk produk ini
                      setEditingProduct(product);
                      setFormData({
                        nama_produk: product.nama_produk,
                        gambar_produk: null, // Reset to null, show current image separately
                        varian: product.varian || []
                      });
                      setImagePreview(null);
                      if (productImageInputRef.current) {
                        productImageInputRef.current.value = '';
                      }
                      setShowForm(true);
                    }}
                    style={{backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '8px'}}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm fw-bold"
                    onClick={() => handleDelete(product.id)}
                    style={{backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px'}}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
              ))}
            </div>

            {/* Pagination - Products */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">Menampilkan {pageItems.length} dari {filtered.length} produk</small>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setProductPage(page - 1)}>Prev</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} className={`btn btn-sm ${page === i+1 ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setProductPage(i+1)}>{i+1}</button>
                ))}
                <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setProductPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        );
      })()}

      {products.length === 0 && (
            <div className="text-center mt-5" style={{color: '#6d2316'}}>
          <p>Belum ada produk. Silakan tambah produk baru.</p>
            </div>
          )}
        </div>
      )}

      {/* Carousel Tab */}
      {activeTab === 'carousel' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold" style={{color: '#6d2316'}}>Slider Carousel</h3>
          </div>
      <div className="card mb-3 border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleAddCarousel} className="row g-3 align-items-end">
            <div className="col-12 col-sm-4">
              <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Slider</label>
              <input 
                type="file" 
                accept="image/*" 
                className="form-control" 
                ref={fileInputRef} 
                onChange={(e)=> {
                  const file = e.target.files[0] || null;
                  setNewCarousel({...newCarousel, image: file});
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setCarouselPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setCarouselPreview(null);
                  }
                }} 
                required 
                style={{borderRadius: '8px'}} 
              />
              {carouselPreview && (
                <div className="mt-2" style={{position: 'relative', display: 'inline-block'}}>
                  <img 
                    src={carouselPreview} 
                    alt="Preview" 
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      borderRadius: '8px',
                      border: '2px solid #6d2316',
                      padding: '4px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCarouselPreview(null);
                      setNewCarousel({...newCarousel, image: null});
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(220, 53, 69, 0.9)',
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      padding: '0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="col-12 col-sm-3">
              <label className="form-label fw-bold" style={{color: '#6d2316'}}>Urutan</label>
              <input type="number" className="form-control" value={newCarousel.sort_order} onChange={(e)=> setNewCarousel({...newCarousel, sort_order: e.target.value})} placeholder="Opsional" style={{borderRadius: '8px'}} />
            </div>
            <div className="col-12 col-sm-3">
              <div className="form-check mt-4">
                <input className="form-check-input" type="checkbox" checked={newCarousel.is_active} onChange={(e)=> setNewCarousel({...newCarousel, is_active: e.target.checked})} id="carouselActive" />
                <label className="form-check-label fw-bold" htmlFor="carouselActive" style={{color: '#6d2316'}}>Aktif</label>
              </div>
            </div>
            <div className="col-12 col-sm-2 d-flex align-items-end">
              <button className="btn fw-bold w-100" disabled={uploading} style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px'}}>{uploading ? 'Menyimpan...' : 'Tambah'}</button>
            </div>
          </form>
        </div>
      </div>

      <div className="row">
        {carousel.length === 0 ? (
          <div className="col-12">
            <div className="text-center" style={{color: '#6d2316'}}>
              <p className="mb-0">Belum ada gambar slider. Silakan tambah gambar slider baru.</p>
            </div>
          </div>
        ) : (
          carousel.map((c) => (
            <div key={c.id} className="col-md-4 mb-3">
              <div className="card h-100 border-0 shadow-sm">
                <img 
                  src={getImageUrl(c.image_path)} 
                  className="card-img-top" 
                  alt={`carousel-${c.id}`} 
                  style={{maxHeight:'200px', objectFit:'cover', borderRadius: '8px 8px 0 0'}} 
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="card-body">
                  <div className="mb-2">
                    <label className="form-label fw-bold" style={{color: '#6d2316'}}>Urutan</label>
                    <input type="number" className="form-control" value={c.sort_order ?? ''} onChange={(e)=> setCarousel(prev => prev.map(x => x.id===c.id ? {...x, sort_order: e.target.value} : x))} style={{borderRadius: '8px'}} />
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={!!c.is_active} onChange={(e)=> setCarousel(prev => prev.map(x => x.id===c.id ? {...x, is_active: e.target.checked ? 1 : 0} : x))} id={`active-${c.id}`} />
                    <label className="form-check-label fw-bold" htmlFor={`active-${c.id}`} style={{color: '#6d2316'}}>Aktif</label>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold" style={{color: '#6d2316'}}>Ubah Gambar (Opsional)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control"
                      id={`carousel-file-${c.id}`}
                      onChange={(e)=> {
                        const file = e.target.files[0] || null;
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCarousel(prev => prev.map(x => x.id === c.id ? {...x, _newFile: file, _preview: reader.result} : x));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setCarousel(prev => prev.map(x => x.id === c.id ? {...x, _newFile: null, _preview: null} : x));
                        }
                      }} 
                      style={{borderRadius: '8px'}} 
                    />
                    {c._preview && (
                      <div className="mt-2">
                        <label className="form-label small text-muted d-block">Preview gambar baru:</label>
                        <div style={{position: 'relative', display: 'inline-block'}}>
                          <img 
                            src={c._preview} 
                            alt="Preview" 
                            style={{
                              maxWidth: '100%',
                              maxHeight: '150px',
                              borderRadius: '8px',
                              border: '2px solid #6d2316',
                              padding: '4px',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCarousel(prev => prev.map(x => x.id === c.id ? {...x, _newFile: null, _preview: null} : x));
                              // Reset file input for this specific carousel item
                              const fileInput = document.getElementById(`carousel-file-${c.id}`);
                              if (fileInput) {
                                fileInput.value = '';
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(220, 53, 69, 0.9)',
                              border: 'none',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1',
                              padding: '0',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm fw-bold" onClick={()=> handleUpdateCarousel(c)} style={{backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '8px'}}>Simpan</button>
                    <button className="btn btn-sm fw-bold" onClick={()=> handleDeleteCarousel(c.id)} style={{backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px'}}>Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </div>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold" style={{color: '#6d2316'}}>Testimoni (Gambar)</h3>
          </div>
          <div className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleAddTestimonial} className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Testimoni</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="form-control" 
                    ref={testiFileInputRef} 
                    onChange={(e)=> {
                      const file = e.target.files[0] || null;
                      setNewTestimonial({...newTestimonial, image: file});
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTestiPreview(reader.result);
                        reader.readAsDataURL(file);
                      } else {
                        setTestiPreview(null);
                      }
                    }} 
                    required 
                    style={{borderRadius: '8px'}} 
                  />
                  {testiPreview && (
                    <div className="mt-2" style={{position: 'relative', display: 'inline-block'}}>
                      <img src={testiPreview} alt="Preview" style={{maxWidth:'200px', maxHeight:'150px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover', display:'block'}} />
                      <button type="button" onClick={()=>{ setTestiPreview(null); setNewTestimonial({...newTestimonial, image:null}); if(testiFileInputRef.current){ testiFileInputRef.current.value=''; } }}
                        style={{position:'absolute', top:'8px', right:'8px', width:'24px', height:'24px', borderRadius:'50%', backgroundColor:'rgba(220,53,69,0.9)', border:'none', color:'white', fontSize:'14px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:'1', padding:'0', boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}}>
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Urutan</label>
                  <input type="number" className="form-control" value={newTestimonial.sort_order} onChange={(e)=> setNewTestimonial({...newTestimonial, sort_order: e.target.value})} placeholder="Opsional" style={{borderRadius: '8px'}} />
                </div>
                <div className="col-md-3">
                  <div className="form-check mt-4">
                    <input className="form-check-input" type="checkbox" checked={newTestimonial.is_active} onChange={(e)=> setNewTestimonial({...newTestimonial, is_active: e.target.checked})} id="testiActive" />
                    <label className="form-check-label fw-bold" htmlFor="testiActive" style={{color: '#6d2316'}}>Aktif</label>
                  </div>
                </div>
                <div className="col-md-2">
                  <button className="btn fw-bold w-100" disabled={uploading} style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px'}}>{uploading ? 'Menyimpan...' : 'Tambah'}</button>
                </div>
              </form>
            </div>
          </div>

          <div className="row">
            {testimonials.length === 0 ? (
              <div className="col-12"><div className="text-center" style={{color:'#6d2316'}}>Belum ada testimoni</div></div>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <img src={getImageUrl(t.image_path)} className="card-img-top" alt={`testi-${t.id}`} style={{maxHeight:'220px', objectFit:'cover', borderRadius:'8px 8px 0 0'}} />
                    <div className="card-body">
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Urutan</label>
                        <input type="number" className="form-control" value={t.sort_order ?? ''} onChange={(e)=> setTestimonials(prev => prev.map(x => x.id===t.id ? {...x, sort_order: e.target.value} : x))} style={{borderRadius:'8px'}} />
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" checked={!!t.is_active} onChange={(e)=> setTestimonials(prev => prev.map(x => x.id===t.id ? {...x, is_active: e.target.checked ? 1 : 0} : x))} id={`testi-active-${t.id}`} />
                        <label className="form-check-label fw-bold" htmlFor={`testi-active-${t.id}`} style={{color:'#6d2316'}}>Aktif</label>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold" style={{color:'#6d2316'}}>Ubah Gambar (Opsional)</label>
                        <input type="file" accept="image/*" className="form-control" id={`testi-file-${t.id}`} onChange={(e)=>{ const file = e.target.files[0] || null; if(file){ const reader=new FileReader(); reader.onloadend=()=>{ setTestimonials(prev=> prev.map(x=> x.id===t.id ? {...x, _newFile:file, _preview: reader.result} : x)); }; reader.readAsDataURL(file);} else { setTestimonials(prev=> prev.map(x=> x.id===t.id ? {...x, _newFile:null, _preview:null} : x)); } }} style={{borderRadius:'8px'}} />
                        {t._preview && (
                          <div className="mt-2">
                            <label className="form-label small text-muted d-block">Preview gambar baru:</label>
                            <img src={t._preview} alt="Preview" style={{maxWidth:'100%', maxHeight:'150px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover', display:'block'}} />
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm fw-bold" onClick={()=> handleUpdateTestimonial(t)} style={{backgroundColor:'#ffc107', color:'#000', border:'none', borderRadius:'8px'}}>Simpan</button>
                        <button className="btn btn-sm fw-bold" onClick={()=> handleDeleteTestimonial(t.id)} style={{backgroundColor:'#dc3545', color:'white', border:'none', borderRadius:'8px'}}>Hapus</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Paket Tab */}
      {activeTab === 'paket' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold" style={{color: '#6d2316'}}>Paket</h3>
          </div>
          <div className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleAddPackage} className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Tipe Paket</label>
                  <input type="text" className="form-control" value={newPackage.tipe} onChange={(e)=> setNewPackage({...newPackage, tipe: e.target.value})} placeholder="cth: Paket Hemat" style={{borderRadius: '8px'}} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Paket</label>
                  <input type="file" accept="image/*" className="form-control" ref={paketFileInputRef} onChange={(e)=>{ const file=e.target.files[0]||null; setNewPackage({...newPackage, image:file}); if(file){ const reader=new FileReader(); reader.onloadend=()=> setPaketPreview(reader.result); reader.readAsDataURL(file);} else { setPaketPreview(null);} }} style={{borderRadius: '8px'}} />
                  {paketPreview && (
                    <div className="mt-2" style={{position:'relative', display:'inline-block'}}>
                      <img src={paketPreview} alt="Preview" style={{maxWidth:'200px', maxHeight:'150px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover', display:'block'}} />
                      <button type="button" onClick={()=>{ setPaketPreview(null); setNewPackage({...newPackage, image:null}); if(paketFileInputRef.current){ paketFileInputRef.current.value=''; } }}
                        style={{position:'absolute', top:'8px', right:'8px', width:'24px', height:'24px', borderRadius:'50%', backgroundColor:'rgba(220,53,69,0.9)', border:'none', color:'white', fontSize:'14px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:'1', padding:'0', boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}}>×</button>
                    </div>
                  )}
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Urutan</label>
                  <input type="number" className="form-control" value={newPackage.sort_order} onChange={(e)=> setNewPackage({...newPackage, sort_order: e.target.value})} placeholder="Opsional" style={{borderRadius: '8px'}} />
                </div>
                <div className="col-md-2">
                  <div className="form-check mt-4">
                    <input className="form-check-input" type="checkbox" checked={newPackage.is_active} onChange={(e)=> setNewPackage({...newPackage, is_active: e.target.checked})} id="paketActive" />
                    <label className="form-check-label fw-bold" htmlFor="paketActive" style={{color: '#6d2316'}}>Aktif</label>
                  </div>
                </div>
                <div className="col-md-2">
                  <button className="btn fw-bold w-100" disabled={uploading} style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px'}}>{uploading ? 'Menyimpan...' : 'Tambah'}</button>
                </div>

                <div className="col-12"><hr /></div>
                <div className="col-md-4">
                  <label className="form-label fw-bold" style={{color:'#6d2316'}}>Link Shopee</label>
                  <input type="text" className="form-control" value={newPackage.link_shopee} onChange={(e)=> setNewPackage({...newPackage, link_shopee: e.target.value})} placeholder="https://..." style={{borderRadius:'8px'}} />
                  <label className="form-label fw-bold mt-2" style={{color:'#6d2316'}}>Subtitle Shopee</label>
                  <input type="text" className="form-control" value={newPackage.subtitle_shopee} onChange={(e)=> setNewPackage({...newPackage, subtitle_shopee: e.target.value})} placeholder="contoh: Banyak voucher & gratis ongkir" style={{borderRadius:'8px'}} />
                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" checked={newPackage.active_shopee} onChange={(e)=> setNewPackage({...newPackage, active_shopee: e.target.checked})} id="activeShopee" />
                    <label className="form-check-label fw-bold" htmlFor="activeShopee" style={{color:'#6d2316'}}>Tampilkan tombol Shopee</label>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold" style={{color:'#6d2316'}}>Link TikTokshop</label>
                  <input type="text" className="form-control" value={newPackage.link_tiktok} onChange={(e)=> setNewPackage({...newPackage, link_tiktok: e.target.value})} placeholder="https://..." style={{borderRadius:'8px'}} />
                  <label className="form-label fw-bold mt-2" style={{color:'#6d2316'}}>Subtitle TikTok</label>
                  <input type="text" className="form-control" value={newPackage.subtitle_tiktok} onChange={(e)=> setNewPackage({...newPackage, subtitle_tiktok: e.target.value})} placeholder="contoh: Live promo tiap hari" style={{borderRadius:'8px'}} />
                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" checked={newPackage.active_tiktok} onChange={(e)=> setNewPackage({...newPackage, active_tiktok: e.target.checked})} id="activeTiktok" />
                    <label className="form-check-label fw-bold" htmlFor="activeTiktok" style={{color:'#6d2316'}}>Tampilkan tombol TikTok</label>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold mt-2" style={{color:'#6d2316'}}>Subtitle WhatsApp</label>
                  <input type="text" className="form-control" value={newPackage.subtitle_wa} onChange={(e)=> setNewPackage({...newPackage, subtitle_wa: e.target.value})} placeholder="contoh: Respon cepat & ramah" style={{borderRadius:'8px'}} />
                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" checked={newPackage.active_wa} onChange={(e)=> setNewPackage({...newPackage, active_wa: e.target.checked})} id="activeWa" />
                    <label className="form-check-label fw-bold" htmlFor="activeWa" style={{color:'#6d2316'}}>Tampilkan tombol WhatsApp</label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="row">
            {packages.length === 0 ? (
              <div className="col-12"><div className="text-center" style={{color:'#6d2316'}}>Belum ada paket</div></div>
            ) : (
              packages.map((p) => (
                <div key={p.id} className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <img src={getImageUrl(p.image_path)} className="card-img-top" alt={`paket-${p.id}`} style={{maxHeight:'220px', objectFit:'cover', borderRadius:'8px 8px 0 0'}} />
                    <div className="card-body">
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Tipe Paket</label>
                        <input type="text" className="form-control" value={p.tipe} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, tipe: e.target.value} : x))} style={{borderRadius:'8px'}} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Urutan</label>
                        <input type="number" className="form-control" value={p.sort_order ?? ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, sort_order: e.target.value} : x))} style={{borderRadius:'8px'}} />
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" checked={!!p.is_active} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, is_active: e.target.checked ? 1 : 0} : x))} id={`paket-active-${p.id}`} />
                        <label className="form-check-label fw-bold" htmlFor={`paket-active-${p.id}`} style={{color:'#6d2316'}}>Aktif</label>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold" style={{color:'#6d2316'}}>Ubah Gambar (Opsional)</label>
                        <input type="file" accept="image/*" className="form-control" id={`paket-file-${p.id}`} onChange={(e)=>{ const file=e.target.files[0]||null; if(file){ const reader=new FileReader(); reader.onloadend=()=>{ setPackages(prev=> prev.map(x=> x.id===p.id ? {...x, _newFile:file, _preview: reader.result} : x)); }; reader.readAsDataURL(file);} else { setPackages(prev=> prev.map(x=> x.id===p.id ? {...x, _newFile:null, _preview:null} : x)); } }} style={{borderRadius:'8px'}} />
                        {p._preview && (
                          <div className="mt-2">
                            <label className="form-label small text-muted d-block">Preview gambar baru:</label>
                            <img src={p._preview} alt="Preview" style={{maxWidth:'100%', maxHeight:'150px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover', display:'block'}} />
                          </div>
                        )}
                      </div>
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Link Shopee</label>
                        <input type="text" className="form-control" value={p.link_shopee || ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, link_shopee: e.target.value} : x))} style={{borderRadius:'8px'}} />
                        <label className="form-label fw-bold mt-2" style={{color:'#6d2316'}}>Subtitle Shopee</label>
                        <input type="text" className="form-control" value={p.subtitle_shopee || ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, subtitle_shopee: e.target.value} : x))} style={{borderRadius:'8px'}} />
                        <div className="form-check mt-2">
                          <input className="form-check-input" type="checkbox" checked={!!p.active_shopee} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, active_shopee: e.target.checked ? 1 : 0} : x))} id={`active-shopee-${p.id}`} />
                          <label className="form-check-label fw-bold" htmlFor={`active-shopee-${p.id}`} style={{color:'#6d2316'}}>Tampilkan tombol Shopee</label>
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Link TikTokshop</label>
                        <input type="text" className="form-control" value={p.link_tiktok || ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, link_tiktok: e.target.value} : x))} style={{borderRadius:'8px'}} />
                        <label className="form-label fw-bold mt-2" style={{color:'#6d2316'}}>Subtitle TikTok</label>
                        <input type="text" className="form-control" value={p.subtitle_tiktok || ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, subtitle_tiktok: e.target.value} : x))} style={{borderRadius:'8px'}} />
                        <div className="form-check mt-2">
                          <input className="form-check-input" type="checkbox" checked={!!p.active_tiktok} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, active_tiktok: e.target.checked ? 1 : 0} : x))} id={`active-tiktok-${p.id}`} />
                          <label className="form-check-label fw-bold" htmlFor={`active-tiktok-${p.id}`} style={{color:'#6d2316'}}>Tampilkan tombol TikTok</label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Subtitle WhatsApp</label>
                        <input type="text" className="form-control" value={p.subtitle_wa || ''} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, subtitle_wa: e.target.value} : x))} style={{borderRadius:'8px'}} />
                        <div className="form-check mt-2">
                          <input className="form-check-input" type="checkbox" checked={!!p.active_wa} onChange={(e)=> setPackages(prev => prev.map(x => x.id===p.id ? {...x, active_wa: e.target.checked ? 1 : 0} : x))} id={`active-wa-${p.id}`} />
                          <label className="form-check-label fw-bold" htmlFor={`active-wa-${p.id}`} style={{color:'#6d2316'}}>Tampilkan tombol WhatsApp</label>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm fw-bold" onClick={()=> handleUpdatePackage(p)} style={{backgroundColor:'#ffc107', color:'#000', border:'none', borderRadius:'8px'}}>Simpan</button>
                        <button className="btn btn-sm fw-bold" onClick={()=> handleDeletePackage(p.id)} style={{backgroundColor:'#dc3545', color:'white', border:'none', borderRadius:'8px'}}>Hapus</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Popup Tab */}
      {activeTab === 'popup' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fw-bold" style={{color: '#6d2316'}}>Pengaturan Pop Up</h3>
          </div>
          <div className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <form onSubmit={handleAddPopup} className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Pop Up</label>
                  <input type="file" accept="image/*" className="form-control" ref={popupFileRef} onChange={(e)=>{ const f=e.target.files[0]||null; setNewPopup({...newPopup, image:f}); if(f){ const r=new FileReader(); r.onloadend=()=> setPopupPreview(r.result); r.readAsDataURL(f);} else { setPopupPreview(null);} }} style={{borderRadius:'8px'}} />
                  {popupPreview && (<div className="mt-2"><img src={popupPreview} alt="Preview" style={{maxWidth:'220px', maxHeight:'160px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover'}} /></div>)}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold" style={{color:'#6d2316'}}>Urutan</label>
                  <input type="number" className="form-control" value={newPopup.sort_order} onChange={(e)=> setNewPopup({...newPopup, sort_order: e.target.value})} placeholder="Opsional" style={{borderRadius:'8px'}} />
                </div>
                <div className="col-md-3">
                  <div className="form-check mt-4">
                    <input className="form-check-input" type="checkbox" checked={newPopup.is_active} onChange={(e)=> setNewPopup({...newPopup, is_active: e.target.checked})} id="popupActive" />
                    <label className="form-check-label fw-bold" htmlFor="popupActive" style={{color:'#6d2316'}}>Aktif</label>
                  </div>
                </div>
                <div className="col-12">
                  <button className="btn fw-bold" disabled={uploading} style={{backgroundColor:'#6d2316', color:'white', border:'none', borderRadius:'8px'}}>{uploading ? 'Menyimpan...' : 'Tambah'}</button>
                </div>
              </form>
            </div>
          </div>

          <div className="row">
            {popups.length === 0 ? (
              <div className="col-12"><div className="text-center" style={{color:'#6d2316'}}>Belum ada gambar popup</div></div>
            ) : (
              popups.map((p) => (
                <div key={p.id} className="col-md-4 mb-3">
                  <div className="card h-100 border-0 shadow-sm">
                    <img src={getImageUrl(p.image_path)} alt={`popup-${p.id}`} className="card-img-top" style={{maxHeight:'220px', objectFit:'cover', borderRadius:'8px 8px 0 0'}} />
                    <div className="card-body">
                      <div className="mb-2">
                        <label className="form-label fw-bold" style={{color:'#6d2316'}}>Urutan</label>
                        <input type="number" className="form-control" value={p.sort_order ?? ''} onChange={(e)=> setPopups(prev => prev.map(x => x.id===p.id ? {...x, sort_order: e.target.value} : x))} style={{borderRadius:'8px'}} />
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" checked={!!p.is_active} onChange={(e)=> setPopups(prev => prev.map(x => x.id===p.id ? {...x, is_active: e.target.checked ? 1 : 0} : x))} id={`popup-active-${p.id}`} />
                        <label className="form-check-label fw-bold" htmlFor={`popup-active-${p.id}`} style={{color:'#6d2316'}}>Aktif</label>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold" style={{color:'#6d2316'}}>Ubah Gambar (Opsional)</label>
                        <input type="file" accept="image/*" className="form-control" id={`popup-file-${p.id}`} onChange={(e)=>{ const f=e.target.files[0]||null; if(f){ const r=new FileReader(); r.onloadend=()=> setPopups(prev=> prev.map(x=> x.id===p.id ? {...x, _newFile:f, _preview:r.result} : x)); r.readAsDataURL(f);} else { setPopups(prev=> prev.map(x=> x.id===p.id ? {...x, _newFile:null, _preview:null} : x)); } }} style={{borderRadius:'8px'}} />
                        {p._preview && (<div className="mt-2"><img src={p._preview} alt="Preview" style={{maxWidth:'100%', maxHeight:'150px', borderRadius:'8px', border:'2px solid #6d2316', padding:'4px', objectFit:'cover'}} /></div>)}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm fw-bold" onClick={()=> handleUpdatePopup(p)} style={{backgroundColor:'#ffc107', color:'#000', border:'none', borderRadius:'8px'}}>Simpan</button>
                        <button className="btn btn-sm fw-bold" onClick={()=> handleDeletePopup(p.id)} style={{backgroundColor:'#dc3545', color:'white', border:'none', borderRadius:'8px'}}>Hapus</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Varian Tab */}
      {activeTab === 'variants' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Mengelola Varian</h3>
          
          {/* Product Selection */}
          <div className="mb-4">
            <label className="form-label fw-bold" style={{color: '#6d2316'}}>Pilih Produk</label>
            <select 
              className="form-control"
              value={selectedVariantProductId || ''}
              onChange={(e) => {
                const productId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedVariantProductId(productId);
                setShowVariantForm(false);
                setEditingVariant(null);
                setVariantFormData({ nama_varian: '', harga: '' });
              }}
              style={{borderRadius: '8px', maxWidth: '400px'}}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.nama_produk}</option>
              ))}
            </select>
          </div>

          {selectedVariantProductId && (
            <>
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header" style={{backgroundColor: '#6d2316', color: 'white', borderRadius: '8px 8px 0 0'}}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Mengelola Varian</h5>
                    {!showVariantForm && (
                      <button
                        className="btn btn-sm fw-bold"
                        onClick={() => {
                          setShowVariantForm(true);
                          setEditingVariant(null);
                          setVariantFormData({ nama_varian: '' });
                        }}
                        style={{backgroundColor: 'white', color: '#6d2316', border: 'none', borderRadius: '8px'}}
                      >
                        + Tambah Varian
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {/* Search - Variants */}
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari varian..."
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      style={{borderRadius: '8px', maxWidth: '400px'}}
                    />
                  </div>
                  {showVariantForm && (
                    <form onSubmit={handleSubmitVariant} className="mb-4">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-8">
                          <label className="form-label fw-bold" style={{color: '#6d2316'}}>Nama Varian</label>
                          <input
                            type="text"
                            className="form-control"
                            value={variantFormData.nama_varian}
                            onChange={(e) => setVariantFormData(prev => ({ ...prev, nama_varian: e.target.value }))}
                            placeholder="Masukkan nama varian"
                            required
                            style={{borderRadius: '8px'}}
                          />
                          <div className="mt-2 d-flex align-items-center" style={{gap:'8px'}}>
                            <span className="text-muted" style={{minWidth:'48px'}}>Harga</span>
                            <input
                              type="text"
                              className="form-control"
                              value={variantFormData.harga}
                              onChange={(e) => setVariantFormData(prev => ({ ...prev, harga: formatRupiahFromString(e.target.value) }))}
                              placeholder="Rp 0"
                              inputMode="numeric"
                              style={{borderRadius: '8px'}}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn fw-bold" style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px', flex: 1}}>
                              {editingVariant ? 'Update' : 'Simpan'}
                            </button>
                            <button
                              type="button"
                              className="btn fw-bold"
                              onClick={() => {
                                setShowVariantForm(false);
                                setEditingVariant(null);
                                setVariantFormData({ nama_varian: '', harga: '' });
                              }}
                              style={{backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', flex: 1}}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}

                  {variants.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">Belum ada varian untuk produk ini.</p>
                    </div>
                  ) : (
                    (() => {
                      const keyword = (variantSearch || '').toLowerCase().trim();
                      const filtered = (variants || []).filter(v => (v?.nama_varian || '').toLowerCase().includes(keyword));
                      const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
                      const page = Math.min(variantPage, totalPages);
                      const startIdx = (page - 1) * ITEMS_PER_PAGE;
                      const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
                      return (
                        <>
                          <div className="row" style={{minHeight: '360px'}}>
                            {pageItems.map(variant => (
                        <div key={variant.id} className="col-md-4 mb-3">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <h6 className="card-title fw-bold" style={{color: '#6d2316'}}>{variant.nama_varian}</h6>
                              <div className="text-muted mb-2" style={{fontSize:'0.9rem'}}>Harga: Rp {Intl.NumberFormat('id-ID').format(variant.harga || 0)}</div>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm fw-bold"
                                  onClick={() => {
                                    setEditingVariant(variant);
                                    setVariantFormData({ nama_varian: variant.nama_varian, harga: variant.harga == null ? '' : formatRupiahFromNumber(variant.harga) });
                                    setShowVariantForm(true);
                                  }}
                                  style={{backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '8px'}}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm fw-bold"
                                  onClick={() => handleDeleteVariant(variant.id, variant.nama_varian)}
                                  style={{backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px'}}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                            ))}
                          </div>
                          {/* Pagination - Variants */}
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">Menampilkan {pageItems.length} dari {filtered.length} varian</small>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setVariantPage(page - 1)}>Prev</button>
                              {[...Array(totalPages)].map((_, i) => (
                                <button key={i} className={`btn btn-sm ${page === i+1 ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setVariantPage(i+1)}>{i+1}</button>
                              ))}
                              <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setVariantPage(page + 1)}>Next</button>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

            </>
          )}

          {!selectedVariantProductId && (
            <div className="text-center mt-5" style={{color: '#6d2316'}}>
              <p>Silakan pilih produk terlebih dahulu untuk mengelola varian.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Produk Tab */}
      {activeTab === 'details' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Mengelola Detail Produk</h3>
          {/* Product Selection */}
          <div className="mb-4">
            <label className="form-label fw-bold" style={{color: '#6d2316'}}>Pilih Produk</label>
            <select 
              className="form-control"
              value={selectedDetailProductId || ''}
              onChange={(e) => {
                const productId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedDetailProductId(productId);
                setShowDetailForm(false);
                setEditingDetail(null);
                setDetailFormData({ keterangan: '', gambar: null });
                setDetailPreview(null);
                if (detailImageInputRef.current) {
                  detailImageInputRef.current.value = '';
                }
              }}
              style={{borderRadius: '8px', maxWidth: '400px'}}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.nama_produk}</option>
              ))}
            </select>
          </div>

          {selectedDetailProductId && (
            <>
              <div className="card border-0 shadow-sm">
                <div className="card-header" style={{backgroundColor: '#6d2316', color: 'white', borderRadius: '8px 8px 0 0'}}>
                  <div className="d-flex justify-content-between align-items-center" style={{flexWrap: 'nowrap', gap: '12px'}}>
                    <h5 className="mb-0 fw-bold">Mengelola Detail Produk</h5>
                    {!showDetailForm && (
                      <button
                        className="btn btn-sm fw-bold"
                        onClick={() => {
                          setShowDetailForm(true);
                          setEditingDetail(null);
                          setDetailFormData({ keterangan: '', gambar: null });
                          setDetailPreview(null);
                          if (detailImageInputRef.current) {
                            detailImageInputRef.current.value = '';
                          }
                        }}
                        style={{backgroundColor: 'white', color: '#6d2316', border: 'none', borderRadius: '8px', whiteSpace: 'nowrap'}}
                      >
                        + Tambah Detail Produk
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {/* Search - Details */}
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari detail produk..."
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      style={{borderRadius: '8px', maxWidth: '400px'}}
                    />
                  </div>
                  {showDetailForm && (
                    <form onSubmit={handleSubmitDetail} className="mb-4">
                      <div className="mb-3">
                        <label className="form-label fw-bold" style={{color: '#6d2316'}}>Gambar Detail</label>
                        <input
                          ref={detailImageInputRef}
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(e) => {
                            const file = e.target.files[0] || null;
                            setDetailFormData({...detailFormData, gambar: file});
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setDetailPreview(reader.result);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setDetailPreview(null);
                            }
                          }}
                          required={!editingDetail}
                          style={{borderRadius: '8px'}}
                        />
                        {detailPreview && (
                          <div className="mt-2" style={{position: 'relative', display: 'inline-block'}}>
                            <img
                              src={detailPreview}
                              alt="Preview"
                              style={{
                                maxWidth: '200px',
                                maxHeight: '150px',
                                borderRadius: '8px',
                                border: '2px solid #6d2316',
                                padding: '4px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setDetailPreview(null);
                                setDetailFormData({...detailFormData, gambar: null});
                                if (detailImageInputRef.current) {
                                  detailImageInputRef.current.value = '';
                                }
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(220, 53, 69, 0.9)',
                                border: 'none',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1',
                                padding: '0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                                e.target.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                                e.target.style.transform = 'scale(1)';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {editingDetail && !detailPreview && editingDetail.gambar && (
                          <div className="mt-2">
                            <label className="form-label small text-muted">Gambar saat ini:</label>
                            <img
                              src={getImageUrl(editingDetail.gambar)}
                              alt="Current"
                              style={{
                                maxWidth: '200px',
                                maxHeight: '150px',
                                borderRadius: '8px',
                                border: '2px solid #6d2316',
                                padding: '4px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold" style={{color: '#6d2316'}}>Keterangan</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={detailFormData.keterangan}
                          onChange={(e) => setDetailFormData({...detailFormData, keterangan: e.target.value})}
                          style={{borderRadius: '8px'}}
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn fw-bold" style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px'}}>
                          {editingDetail ? 'Update' : 'Simpan'}
                        </button>
                        <button
                          type="button"
                          className="btn fw-bold"
                          onClick={() => {
                            setShowDetailForm(false);
                            setEditingDetail(null);
                            setDetailFormData({ keterangan: '', gambar: null });
                            setDetailPreview(null);
                            if (detailImageInputRef.current) {
                              detailImageInputRef.current.value = '';
                            }
                          }}
                          style={{backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px'}}
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Details List */}
                  {details.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-muted mb-0">Belum ada detail produk untuk produk ini.</p>
                    </div>
                  ) : (
                    (() => {
                      const keyword = (detailSearch || '').toLowerCase().trim();
                      const filtered = (details || []).filter(d => (d?.keterangan || '').toLowerCase().includes(keyword));
                      const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
                      const page = Math.min(detailPage, totalPages);
                      const startIdx = (page - 1) * ITEMS_PER_PAGE;
                      const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
                      return (
                        <>
                          <div className="row" style={{minHeight: '780px'}}>
                            {pageItems.map((detail) => (
                        <div key={detail.id} className="col-md-6 mb-3">
                          <div className="card border-0 shadow-sm h-100">
                            <img
                              src={getImageUrl(detail.gambar)}
                              alt="Detail"
                              className="card-img-top"
                              style={{objectFit: 'cover', height: '160px'}}
                            />
                            <div className="card-body d-flex flex-column">
                              <p className="card-text" style={{flex: 1}}>{detail.keterangan || 'Tidak ada keterangan'}</p>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm fw-bold"
                                  onClick={() => {
                                    setEditingDetail(detail);
                                    setShowDetailForm(true);
                                    setDetailFormData({ keterangan: detail.keterangan || '' });
                                    setDetailPreview(null);
                                    if (detailImageInputRef.current) {
                                      detailImageInputRef.current.value = '';
                                    }
                                  }}
                                  style={{backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '8px'}}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm fw-bold"
                                  onClick={() => handleDeleteDetail(detail.id)}
                                  style={{backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px'}}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                            ))}
                          </div>
                          {/* Pagination - Details */}
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">Menampilkan {pageItems.length} dari {filtered.length} detail</small>
                            <div className="btn-group">
                              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setDetailPage(page - 1)}>Prev</button>
                              {[...Array(totalPages)].map((_, i) => (
                                <button key={i} className={`btn btn-sm ${page === i+1 ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setDetailPage(i+1)}>{i+1}</button>
                              ))}
                              <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setDetailPage(page + 1)}>Next</button>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            </>
          )}

          {!selectedDetailProductId && (
            <div className="text-center mt-5" style={{color: '#6d2316'}}>
              <p>Silakan pilih produk terlebih dahulu untuk mengelola detail produk.</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Pengaturan CTA Beranda</h3>
          <div className="row g-3">
            {[
              { key: 'hero_title_prefix', label: 'Hero Title - Prefix (mis. "Untung ada")' },
              { key: 'hero_title_brand', label: 'Hero Title - Brand Highlight (mis. "ENAKHO")' },
              { key: 'hero_title_suffix', label: 'Hero Title - Suffix (mis. "Frozen Food")' },
              { key: 'hero_subtitle', label: 'Hero Subtitle' },
              { key: 'cta_whatsapp', label: 'WhatsApp Subtitle' },
              { key: 'cta_shopee', label: 'Shopee Subtitle' },
              { key: 'cta_tiktok', label: 'TikTok Subtitle' },
              { key: 'cta_reseller', label: 'Reseller Subtitle' },
              { key: 'cta_shopee_link', label: 'Shopee Link (https://...)' },
              { key: 'cta_tiktok_link', label: 'TikTok Shop Link (https://...)' }
            ].map(field => (
              <div className="col-md-6" key={field.key}>
                <label className="form-label fw-bold" style={{color: '#6d2316'}}>{field.label}</label>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={settings[field.key] ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="Bisa dikosongkan untuk menyembunyikan"
                    style={{borderRadius: '8px'}}
                  />
                  <button 
                    className="btn fw-bold" 
                    onClick={async ()=>{ await saveSetting(field.key, settings[field.key] ?? ''); showToast('Tersimpan!', 'success'); }}
                    style={{backgroundColor: '#6d2316', color: 'white', border: 'none', borderRadius: '8px', whiteSpace: 'nowrap'}}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted mt-3" style={{fontSize: '12px'}}>Kosongkan teks/link lalu simpan untuk menyembunyikan subjudul atau menonaktifkan tombol.</p>
        </div>
      )}

      {/* WhatsApp & Format Pesan Tab */}
      {activeTab === 'whatsapp' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Pengaturan WhatsApp & Format Pesan</h3>
          
          {/* WhatsApp Numbers Section */}
          <div className="mb-5">
            <h4 className="fw-bold mb-3" style={{color: '#6d2316', fontSize: '18px'}}>Nomor WhatsApp Admin</h4>
            <p className="text-muted mb-3" style={{fontSize: '14px'}}>Kelola nomor WhatsApp untuk setiap tombol. Pilih tombol mana yang akan menggunakan nomor ini saat menambah nomor baru. Setiap tombol akan memilih nomor secara random dari nomor aktif yang telah dipilih untuk tombol tersebut.</p>
            
            {/* Add New WhatsApp Number */}
            <div className="card mb-4" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
              <div className="card-body">
                <h5 className="card-title fw-bold" style={{color: '#6d2316', fontSize: '16px', marginBottom: '15px'}}>Tambah Nomor WhatsApp Baru</h5>
                <form onSubmit={handleAddWhatsappNumber}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{color: '#6d2316'}}>Nomor WhatsApp</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: 6285745599571 atau +6285745599571"
                        value={newWhatsappNumber.phone_number}
                        onChange={(e) => setNewWhatsappNumber({...newWhatsappNumber, phone_number: e.target.value})}
                        required
                      />
                      <small className="form-text text-muted">Masukkan nomor tanpa atau dengan tanda +</small>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold" style={{color: '#6d2316'}}>Status</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={newWhatsappNumber.is_active}
                          onChange={(e) => setNewWhatsappNumber({...newWhatsappNumber, is_active: e.target.checked})}
                        />
                        <label className="form-check-label" style={{fontSize: '14px'}}>
                          {newWhatsappNumber.is_active ? 'Aktif' : 'Nonaktif'}
                        </label>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold" style={{color: '#6d2316'}}>Untuk Tombol</label>
                      <div className="mt-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={newWhatsappNumber.button_type.includes('order')}
                            onChange={(e) => {
                              const buttonTypes = e.target.checked
                                ? [...newWhatsappNumber.button_type, 'order']
                                : newWhatsappNumber.button_type.filter(t => t !== 'order');
                              setNewWhatsappNumber({...newWhatsappNumber, button_type: buttonTypes});
                            }}
                          />
                          <label className="form-check-label" style={{fontSize: '14px'}}>Pesan Sekarang</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={newWhatsappNumber.button_type.includes('reseller')}
                            onChange={(e) => {
                              const buttonTypes = e.target.checked
                                ? [...newWhatsappNumber.button_type, 'reseller']
                                : newWhatsappNumber.button_type.filter(t => t !== 'reseller');
                              setNewWhatsappNumber({...newWhatsappNumber, button_type: buttonTypes});
                            }}
                          />
                          <label className="form-check-label" style={{fontSize: '14px'}}>DAFTAR SEKARANG</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={newWhatsappNumber.button_type.includes('contact')}
                            onChange={(e) => {
                              const buttonTypes = e.target.checked
                                ? [...newWhatsappNumber.button_type, 'contact']
                                : newWhatsappNumber.button_type.filter(t => t !== 'contact');
                              setNewWhatsappNumber({...newWhatsappNumber, button_type: buttonTypes});
                            }}
                          />
                          <label className="form-check-label" style={{fontSize: '14px'}}>Hubungi Kami</label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={newWhatsappNumber.button_type.includes('package')}
                            onChange={(e) => {
                              const buttonTypes = e.target.checked
                                ? [...newWhatsappNumber.button_type, 'package']
                                : newWhatsappNumber.button_type.filter(t => t !== 'package');
                              setNewWhatsappNumber({...newWhatsappNumber, button_type: buttonTypes});
                            }}
                          />
                          <label className="form-check-label" style={{fontSize: '14px'}}>Paket (Pesan via WhatsApp)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" className="btn" style={{backgroundColor: '#6d2316', color: 'white', fontWeight: 'bold'}}>
                      Tambah Nomor
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List WhatsApp Numbers */}
            <div className="table-responsive">
              <table className="table table-striped">
                <thead style={{backgroundColor: '#6d2316', color: 'white'}}>
                  <tr>
                    <th>No</th>
                    <th>Nomor WhatsApp</th>
                    <th>Untuk Tombol</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {whatsappNumbers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">Belum ada nomor WhatsApp</td>
                    </tr>
                  ) : (
                    whatsappNumbers.map((number, idx) => (
                      <tr key={number.id}>
                        <td>{idx + 1}</td>
                        <td>
                          {editingWhatsappNumber?.id === number.id ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editingWhatsappNumber.phone_number}
                              onChange={(e) => setEditingWhatsappNumber({...editingWhatsappNumber, phone_number: e.target.value})}
                              style={{width: '200px', display: 'inline-block'}}
                            />
                          ) : (
                            <strong>{number.phone_number}</strong>
                          )}
                        </td>
                        <td>
                          {editingWhatsappNumber?.id === number.id ? (
                            <div style={{fontSize: '13px'}}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={editingWhatsappNumber.button_type?.includes('order') || false}
                                  onChange={(e) => {
                                    const currentTypes = editingWhatsappNumber.button_type || [];
                                    const buttonTypes = e.target.checked
                                      ? [...currentTypes.filter(t => t !== 'order'), 'order']
                                      : currentTypes.filter(t => t !== 'order');
                                    setEditingWhatsappNumber({...editingWhatsappNumber, button_type: buttonTypes});
                                  }}
                                />
                                <label className="form-check-label">Pesan Sekarang</label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={editingWhatsappNumber.button_type?.includes('reseller') || false}
                                  onChange={(e) => {
                                    const currentTypes = editingWhatsappNumber.button_type || [];
                                    const buttonTypes = e.target.checked
                                      ? [...currentTypes.filter(t => t !== 'reseller'), 'reseller']
                                      : currentTypes.filter(t => t !== 'reseller');
                                    setEditingWhatsappNumber({...editingWhatsappNumber, button_type: buttonTypes});
                                  }}
                                />
                                <label className="form-check-label">DAFTAR SEKARANG</label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={editingWhatsappNumber.button_type?.includes('contact') || false}
                                  onChange={(e) => {
                                    const currentTypes = editingWhatsappNumber.button_type || [];
                                    const buttonTypes = e.target.checked
                                      ? [...currentTypes.filter(t => t !== 'contact'), 'contact']
                                      : currentTypes.filter(t => t !== 'contact');
                                    setEditingWhatsappNumber({...editingWhatsappNumber, button_type: buttonTypes});
                                  }}
                                />
                                <label className="form-check-label">Hubungi Kami</label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={editingWhatsappNumber.button_type?.includes('package') || false}
                                  onChange={(e) => {
                                    const currentTypes = editingWhatsappNumber.button_type || [];
                                    const buttonTypes = e.target.checked
                                      ? [...currentTypes.filter(t => t !== 'package'), 'package']
                                      : currentTypes.filter(t => t !== 'package');
                                    setEditingWhatsappNumber({...editingWhatsappNumber, button_type: buttonTypes});
                                  }}
                                />
                                <label className="form-check-label">Paket (Pesan via WhatsApp)</label>
                              </div>
                            </div>
                          ) : (
                            <div style={{fontSize: '12px'}}>
                              {(number.button_type || 'order,reseller,contact').split(',').map(btn => {
                                const labels = {
                                  order: 'Pesan Sekarang',
                                  reseller: 'DAFTAR SEKARANG',
                                  contact: 'Hubungi Kami',
                                  package: 'Paket'
                                };
                                return (
                                  <span key={btn.trim()} className="badge bg-info me-1 mb-1">
                                    {labels[btn.trim()] || btn.trim()}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingWhatsappNumber?.id === number.id ? (
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={editingWhatsappNumber.is_active}
                                onChange={(e) => setEditingWhatsappNumber({...editingWhatsappNumber, is_active: e.target.checked})}
                              />
                            </div>
                          ) : (
                            <span className={`badge ${number.is_active ? 'bg-success' : 'bg-secondary'}`}>
                              {number.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          )}
                        </td>
                        <td>{new Date(number.created_at).toLocaleDateString('id-ID')}</td>
                        <td>
                          {editingWhatsappNumber?.id === number.id ? (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleUpdateWhatsappNumber(number.id, {
                                  phone_number: editingWhatsappNumber.phone_number,
                                  button_type: editingWhatsappNumber.button_type,
                                  is_active: editingWhatsappNumber.is_active
                                })}
                              >
                                Simpan
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingWhatsappNumber(null)}
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => setEditingWhatsappNumber({
                                  ...number, 
                                  button_type: number.button_type ? number.button_type.split(',').map(t => t.trim()) : ['order', 'reseller', 'contact']
                                })}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteWhatsappNumber(number.id)}
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Message Templates Section */}
          <div>
            <h4 className="fw-bold mb-3" style={{color: '#6d2316', fontSize: '18px'}}>Format Pesan</h4>
            <p className="text-muted mb-3" style={{fontSize: '14px'}}>Pilih tombol di bawah ini untuk mengubah format pesan. Gunakan placeholder seperti {'{{nama}}'}, {'{{wa}}'}, {'{{kota}}'}, {'{{alamat}}'}, {'{{pertanyaan}}'}, {'{{keranjang}}'}, {'{{total_item}}'}, {'{{total_harga}}'}, {'{{nama_paket}}'} untuk mengisi data secara otomatis.</p>
            
            {messageTemplates.map((template) => {
              const templateLabels = {
                order: 'Format Pesan - Pesan Sekarang',
                reseller: 'Format Pesan - DAFTAR SEKARANG',
                contact: 'Format Pesan - Hubungi Kami',
                package: 'Format Pesan - Paket (Pesan via WhatsApp)'
              };
              
              const buttonIcons = {
                order: '🛒',
                reseller: '👥',
                contact: '💬',
                package: '📦'
              };

              return (
                <div key={template.id} className="card mb-4" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
                  <div className="card-body">
                    <h5 className="card-title fw-bold" style={{color: '#6d2316', fontSize: '16px', marginBottom: '15px'}}>
                      {buttonIcons[template.template_type] || '📝'} {templateLabels[template.template_type] || template.template_type}
                    </h5>
                    {editingTemplate?.type === template.template_type ? (
                      <>
                        <textarea
                          className="form-control mb-3"
                          rows="12"
                          value={editingTemplate.format}
                          onChange={(e) => setEditingTemplate({...editingTemplate, format: e.target.value})}
                          style={{fontFamily: 'monospace', fontSize: '13px'}}
                        />
                        <div>
                          <button
                            className="btn btn-success me-2"
                            onClick={() => handleUpdateTemplate(template.template_type, editingTemplate.format)}
                          >
                            Simpan Format
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingTemplate(null)}
                          >
                            Batal
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <pre style={{
                          backgroundColor: '#f8f9fa',
                          padding: '15px',
                          borderRadius: '5px',
                          border: '1px solid #dee2e6',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>{template.template_format}</pre>
                        <div className="mt-3">
                          <button
                            className="btn"
                            style={{backgroundColor: '#6d2316', color: 'white', fontWeight: 'bold'}}
                            onClick={() => setEditingTemplate({type: template.template_type, format: template.template_format})}
                          >
                            Edit Format
                          </button>
                        </div>
                      </>
                    )}
                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>Placeholder yang tersedia:</strong> {'{{nama}}'} {'{{wa}}'} {'{{kota}}'} {'{{alamat}}'} {'{{pertanyaan}}'} {'{{keranjang}}'} {'{{total_item}}'} {'{{total_harga}}'} {'{{nama_paket}}'}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Pembeli Tab */}
      {activeTab === 'buyers' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Data Pembeli</h3>
          <p className="text-muted mb-4" style={{fontSize: '14px'}}>Daftar data pembeli yang telah melakukan pemesanan melalui tombol "Pesan Sekarang".</p>
          
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead style={{backgroundColor: '#6d2316', color: 'white'}}>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Kota / Kecamatan</th>
                  <th>Alamat</th>
                  <th>Keranjang</th>
                  <th>Total Item</th>
                  <th>Total Harga</th>
                  <th>Tanggal Pesan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {buyers.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">Belum ada data pembeli</td>
                  </tr>
                ) : (
                  buyers.map((buyer, idx) => (
                    <tr key={buyer.id}>
                      <td>{idx + 1}</td>
                      <td style={{fontWeight: '600'}}>{buyer.nama}</td>
                      <td>
                        <a href={`https://wa.me/${buyer.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{color: '#25D366', textDecoration: 'none'}}>
                          {buyer.whatsapp}
                        </a>
                      </td>
                      <td>{buyer.kota}</td>
                      <td style={{maxWidth: '200px', wordWrap: 'break-word'}}>{buyer.alamat}</td>
                      <td style={{maxWidth: '300px', wordWrap: 'break-word', fontSize: '13px'}}>
                        <pre style={{whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit'}}>{buyer.keranjang}</pre>
                      </td>
                      <td>{buyer.total_item || 0}</td>
                      <td style={{fontWeight: '600', color: '#6d2316'}}>
                        Rp {Intl.NumberFormat('id-ID').format(buyer.total_harga || 0)}
                      </td>
                      <td>
                        {buyer.created_at ? new Date(buyer.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteBuyer(buyer.id)}
                          style={{borderRadius: '6px'}}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Reseller Tab */}
      {activeTab === 'resellers' && (
        <div style={{backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h3 className="fw-bold mb-4" style={{color: '#6d2316'}}>Data Reseller</h3>
          <p className="text-muted mb-4" style={{fontSize: '14px'}}>Daftar data reseller yang telah melakukan pendaftaran melalui tombol "DAFTAR SEKARANG".</p>
          
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead style={{backgroundColor: '#6d2316', color: 'white'}}>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Kota / Kecamatan</th>
                  <th>Alamat</th>
                  <th>Tanggal Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {resellers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">Belum ada data reseller</td>
                  </tr>
                ) : (
                  resellers.map((reseller, idx) => (
                    <tr key={reseller.id}>
                      <td>{idx + 1}</td>
                      <td style={{fontWeight: '600'}}>{reseller.nama}</td>
                      <td>
                        <a href={`https://wa.me/${reseller.whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{color: '#25D366', textDecoration: 'none'}}>
                          {reseller.whatsapp}
                        </a>
                      </td>
                      <td>{reseller.kota}</td>
                      <td style={{maxWidth: '300px', wordWrap: 'break-word'}}>{reseller.alamat}</td>
                      <td>
                        {reseller.created_at ? new Date(reseller.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteReseller(reseller.id)}
                          style={{borderRadius: '6px'}}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={
          deleteModal.type === 'product' ? confirmDeleteProduct :
          deleteModal.type === 'carousel' ? confirmDeleteCarousel :
          deleteModal.type === 'variant' ? confirmDeleteVariant :
          deleteModal.type === 'detail' ? confirmDeleteDetail :
          deleteModal.type === 'testi' ? confirmDeleteTesti :
          deleteModal.type === 'popup' ? (()=> confirmDeletePopup()) :
          deleteModal.type === 'whatsapp_number' ? confirmDeleteWhatsappNumber :
          deleteModal.type === 'buyer' ? confirmDeleteBuyer :
          deleteModal.type === 'reseller' ? confirmDeleteReseller :
          confirmDeletePaket
        }
        title={
          deleteModal.type === 'product' ? 'Hapus Produk' :
          deleteModal.type === 'carousel' ? 'Hapus Slider' :
          deleteModal.type === 'variant' ? 'Hapus Varian' :
          deleteModal.type === 'detail' ? 'Hapus Detail Produk' :
          deleteModal.type === 'testi' ? 'Hapus Testimoni' :
          deleteModal.type === 'popup' ? 'Hapus Pop Up' :
          deleteModal.type === 'whatsapp_number' ? 'Hapus Nomor WhatsApp' :
          deleteModal.type === 'buyer' ? 'Hapus Data Pembeli' :
          deleteModal.type === 'reseller' ? 'Hapus Data Reseller' :
          'Hapus Paket'
        }
        message={deleteModal.message}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="delete"
      />
    </div>
  );
};

export default AdminPanel;