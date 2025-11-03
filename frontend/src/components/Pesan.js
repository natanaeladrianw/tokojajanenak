import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Carousel as BsCarousel } from 'bootstrap';
import { apiClient, getImageUrl } from '../config/api';
import { useNavigate } from 'react-router-dom';

const Pesan = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const carouselElRef = useRef(null);
  const carouselInstanceRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantCountsByProduct, setVariantCountsByProduct] = useState({});
  const [variantsByProduct, setVariantsByProduct] = useState({}); // { [productId]: [{id,nama_varian,harga,...}] }
  const [buyer, setBuyer] = useState({
    name: '',
    whatsapp: '',
    city: '',
    address: ''
  });
  // Autocomplete region (OSM Nominatim)
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionSuggestions, setRegionSuggestions] = useState([]);
  const [showRegionSuggest, setShowRegionSuggest] = useState(false);
  const nominatimTimerRef = useRef(null);
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);
  const dataPembeliRef = useRef(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  // Nomor admin WhatsApp yang dipilih secara random sekali per sesi/halaman
  const [selectedAdminWaNumber, setSelectedAdminWaNumber] = useState(null);
  // State untuk template dari API
  const [orderTemplate, setOrderTemplate] = useState('');
  const [contactTemplate, setContactTemplate] = useState('');
  // State untuk modal hubungi kami
  const [showContactModal, setShowContactModal] = useState(false);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/api/products');
        setProducts(res.data || []);
      } catch (e) {
        console.error('Gagal memuat produk:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch WhatsApp numbers and templates from API
  useEffect(() => {
    const fetchWhatsappData = async () => {
      try {
        // Fetch active WhatsApp numbers for "order" button (Pesan Sekarang)
        const numbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=order');
        const activeNumbers = numbersRes.data.map(n => n.phone_number);
        
        // Select random number once
        if (activeNumbers.length > 0 && selectedAdminWaNumber === null) {
          const randomIndex = Math.floor(Math.random() * activeNumbers.length);
          setSelectedAdminWaNumber(activeNumbers[randomIndex]);
        }
        
        // Fetch templates
        const templatesRes = await apiClient.get('/api/whatsapp/templates');
        const templates = templatesRes.data;
        const orderTpl = templates.find(t => t.template_type === 'order');
        const contactTpl = templates.find(t => t.template_type === 'contact');
        if (orderTpl) setOrderTemplate(orderTpl.template_format);
        if (contactTpl) setContactTemplate(contactTpl.template_format);
      } catch (e) {
        console.error('Error fetching WhatsApp data:', e);
        // No fallback - data must come from database
      }
    };
    fetchWhatsappData();
  }, [selectedAdminWaNumber]);

  const imageUrls = useMemo(() => {
    return (products || [])
      .map((p) => (p && p.gambar_produk ? getImageUrl(p.gambar_produk) : null))
      .filter(Boolean);
  }, [products]);

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;
    const el = carouselElRef.current;
    if (!el) return;

    const instance = BsCarousel.getOrCreateInstance(el, {
      interval: 3000,
      ride: 'carousel',
      touch: true,
      pause: false,
      wrap: true
    });
    carouselInstanceRef.current = instance;

    // We intentionally do not sync radio state with automatic slide changes.

    let startX = null;
    let isPointerDown = false;
    const threshold = 20;
    const getClientX = (e) => {
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
      return e.clientX;
    };
    const onDown = (e) => {
      startX = getClientX(e);
      isPointerDown = true;
    };
    const onUp = (e) => {
      if (!isPointerDown || startX === null) return;
      const dx = getClientX(e) - startX;
      if (dx > threshold) instance.prev();
      else if (dx < -threshold) instance.next();
      isPointerDown = false;
      startX = null;
    };
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchend', onUp);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);

    const imgs = el.querySelectorAll('img');
    imgs.forEach((img) => img.setAttribute('draggable', 'false'));

    return () => {
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
      // no-op
    };
  }, [imageUrls]);

  // Ensure counter map exists for the active product
  useEffect(() => {
    const product = products[activeIndex];
    if (!product) return;
    setVariantCountsByProduct((prev) => {
      if (prev[product.id]) return prev;
      const initialCounts = {};
      if (Array.isArray(product.varian)) {
        product.varian.forEach((v) => { initialCounts[v] = 0; });
      }
      return { ...prev, [product.id]: initialCounts };
    });
  }, [products, activeIndex]);

  // Fetch variant details (including harga) for the active product
  useEffect(() => {
    const product = products[activeIndex];
    if (!product || !product.id) return;
    if (variantsByProduct[product.id]) return; // already fetched
    (async () => {
      try {
        const res = await apiClient.get(`/api/varian/${product.id}`);
        setVariantsByProduct(prev => ({ ...prev, [product.id]: res.data || [] }));
      } catch (e) {
        // fail silently in UI, keep working without price
        console.error('Gagal memuat varian detail:', e);
      }
    })();
  }, [products, activeIndex, variantsByProduct]);

  const getVariantPrice = (productId, variantName) => {
    const list = variantsByProduct[productId] || [];
    const found = list.find(v => (v?.nama_varian || '').trim() === (variantName || '').trim());
    return found?.harga ?? 0;
  };

  const adjustVariantCount = (productId, variantName, delta) => {
    setVariantCountsByProduct((prev) => {
      const currentProduct = prev[productId] || {};
      const currentVal = currentProduct[variantName] || 0;
      const nextVal = Math.max(0, currentVal + delta);
      return {
        ...prev,
        [productId]: { ...currentProduct, [variantName]: nextVal }
      };
    });
  };

  const buildCartData = () => {
    // Build cart items for display and database
    let cartItems = [];
    let totalItems = 0;
    let totalPrice = 0;
    
    products.forEach((p) => {
      const counts = variantCountsByProduct[p.id] || {};
      const picked = Object.entries(counts).filter(([, q]) => q > 0);
      if (picked.length > 0) {
        picked.forEach(([name, q]) => {
          const price = getVariantPrice(p.id, name);
          const subtotal = (price || 0) * q;
          totalItems += q;
          totalPrice += subtotal;
          cartItems.push(`- ${p.nama_produk} - ${name}: ${q} x Rp ${Intl.NumberFormat('id-ID').format(price || 0)}`);
        });
      }
    });
    
    if (cartItems.length === 0) {
      cartItems.push('- Belum ada item di keranjang');
    }
    
    return {
      cartText: cartItems.join('\n'),
      totalItems,
      totalPrice
    };
  };

  const buildOrderSummary = () => {
    const { cartText, totalItems, totalPrice } = buildCartData();
    
    const totalItemText = cartText !== '- Belum ada item di keranjang' && totalItems > 0 ? `Total Item: ${totalItems}` : '';
    const totalHargaText = cartText !== '- Belum ada item di keranjang' && totalPrice > 0 ? `Total Harga: Rp ${Intl.NumberFormat('id-ID').format(totalPrice)}` : '';
    
    // MUST use template from database only - no hardcode fallback
    if (!orderTemplate || orderTemplate.trim() === '') {
      console.error('Order template not found in database');
      return '';
    }
    
    let message = orderTemplate;
    
    // Replace placeholders
    message = message.replace(/\{\{nama\}\}/g, buyer.name || '');
    message = message.replace(/\{\{wa\}\}/g, buyer.whatsapp || '');
    message = message.replace(/\{\{kota\}\}/g, buyer.city || '');
    message = message.replace(/\{\{alamat\}\}/g, buyer.address || '');
    message = message.replace(/\{\{keranjang\}\}/g, cartText);
    message = message.replace(/\{\{total_item\}\}/g, totalItemText);
    message = message.replace(/\{\{total_harga\}\}/g, totalHargaText);
    
    return message;
  };

  const handleOrder = async () => {
    // Validate buyer data
    if (!buyer.name || !buyer.name.trim()) {
      setAlertMessage('Harap lengkapi data pembeli dan pilih varian');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!buyer.whatsapp || !buyer.whatsapp.trim()) {
      setAlertMessage('Harap lengkapi data pembeli dan pilih varian');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!buyer.city || !buyer.city.trim()) {
      setAlertMessage('Harap lengkapi data pembeli dan pilih varian');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!buyer.address || !buyer.address.trim()) {
      setAlertMessage('Harap lengkapi data pembeli dan pilih varian');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Validate cart has items
    const hasItems = Object.values(variantCountsByProduct).some(
      (counts) => Object.values(counts || {}).some((qty) => qty > 0)
    );
    if (!hasItems) {
      setAlertMessage('Harap lengkapi data pembeli dan pilih varian');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Validate template exists
    if (!orderTemplate || orderTemplate.trim() === '') {
      setAlertMessage('Format pesan belum dikonfigurasi. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    // All validations passed, proceed with order
    // Fetch order numbers from database - MUST use database only, no hardcode
    try {
      const orderNumbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=order');
      const orderNumbers = orderNumbersRes.data.map(n => n.phone_number);
      if (orderNumbers.length > 0) {
        // Use the already selected number if it's in the order list, otherwise pick random
        let adminWaNumber = selectedAdminWaNumber;
        if (!adminWaNumber || !orderNumbers.includes(adminWaNumber)) {
          const randomIndex = Math.floor(Math.random() * orderNumbers.length);
          adminWaNumber = orderNumbers[randomIndex];
        }
        const text = encodeURIComponent(buildOrderSummary());
        if (!text || text.trim() === '') {
          setAlertMessage('Gagal membuat pesan. Silakan hubungi administrator.');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
          return;
        }
        // Save buyer data to database
        try {
          const { cartText, totalItems, totalPrice } = buildCartData();
          await apiClient.post('/api/buyers', {
            nama: buyer.name.trim(),
            whatsapp: buyer.whatsapp.trim(),
            kota: buyer.city.trim(),
            alamat: buyer.address.trim(),
            keranjang: cartText,
            total_item: totalItems,
            total_harga: totalPrice
          });
          console.log('✅ Buyer data saved to database');
        } catch (saveError) {
          console.error('Error saving buyer data:', saveError);
          // Continue anyway - don't block WhatsApp opening
        }

        // Track Lead event for Facebook Pixel
        if (window.fbq) {
          window.fbq('track', 'Lead');
        }
        
        const url = `https://wa.me/${adminWaNumber}?text=${text}`;
        window.open(url, '_blank', 'noopener');
        return;
      } else {
        setAlertMessage('Tidak ada nomor WhatsApp yang dikonfigurasi untuk tombol Pesan Sekarang. Silakan hubungi administrator.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
        return;
      }
    } catch (e) {
      console.error('Error fetching order numbers:', e);
      setAlertMessage('Gagal memuat nomor WhatsApp. Silakan coba lagi atau hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }
  };

  const buildContactMessage = () => {
    // MUST use template from database only - no hardcode fallback
    if (!contactTemplate || contactTemplate.trim() === '') {
      console.error('Contact template not found in database');
      return '';
    }
    
    let message = contactTemplate;
    
    // Replace placeholders
    message = message.replace(/\{\{pertanyaan\}\}/g, question.trim() || '(isi dengan pertanyaan anda)');
    
    return message;
  };

  const handleContactUs = () => {
    // Buka modal untuk input pertanyaan
    setShowContactModal(true);
  };

  const handleSendQuestion = async () => {
    if (!question || !question.trim()) {
      setAlertMessage('Harap isi pertanyaan Anda');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Validate template exists
    if (!contactTemplate || contactTemplate.trim() === '') {
      setAlertMessage('Format pesan belum dikonfigurasi. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      setShowContactModal(false);
      return;
    }

    // All validations passed, proceed with contact
    const text = encodeURIComponent(buildContactMessage());
    if (!text || text.trim() === '') {
      setAlertMessage('Gagal membuat pesan. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      setShowContactModal(false);
      return;
    }

    // Fetch contact numbers separately for "contact" button - MUST use database only
    try {
      const contactNumbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=contact');
      const contactNumbers = contactNumbersRes.data.map(n => n.phone_number);
      if (contactNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * contactNumbers.length);
        const adminWaNumber = contactNumbers[randomIndex];
        
        // Track Lead event for Facebook Pixel
        if (window.fbq) {
          window.fbq('track', 'Lead');
        }
        
        const url = `https://wa.me/${adminWaNumber}?text=${text}`;
        window.open(url, '_blank', 'noopener');
        setQuestion('');
        setShowContactModal(false);
        return;
      } else {
        // No contact numbers found in database
        setAlertMessage('Tidak ada nomor WhatsApp yang dikonfigurasi untuk tombol Hubungi Kami. Silakan hubungi administrator.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
        setShowContactModal(false);
        return;
      }
    } catch (e) {
      console.error('Error fetching contact numbers:', e);
      setAlertMessage('Gagal memuat nomor WhatsApp. Silakan coba lagi atau hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      setShowContactModal(false);
      return;
    }
  };

  const formatRp = (n) => 'Rp ' + Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n || 0);

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;
      const input = document.getElementById('buyer-city');
      if (input && input.contains(target)) return;
      setShowRegionSuggest(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Build readable label from Nominatim result
  const buildNominatimLabel = (item) => {
    const a = item.address || {};
    // Compose in a stable, richest-first order and drop duplicates
    const ordered = [
      a.state || a.region || a.state_district,
      // Prefer kabupaten/kota layer
      a.county, a.city, a.town, a.municipality, a.city_district,
      // Kecamatan/desa/kelurahan
      a.district, a.subdistrict, a.village, a.suburb, a.hamlet, a.neighbourhood
    ].filter(Boolean);
    const seen = new Set();
    const parts = [];
    for (const part of ordered) {
      const key = (part || '').toLowerCase();
      if (!seen.has(key)) { seen.add(key); parts.push(part); }
    }
    const label = parts.join(', ');
    return label || item.display_name;
  };

  // Suggest on typing 3+ chars
  useEffect(() => {
    const q = (buyer.city || '').trim().toLowerCase();
    if (q.length < 3) {
      setRegionSuggestions([]);
      setShowRegionSuggest(false);
      return;
    }
    if (nominatimTimerRef.current) clearTimeout(nominatimTimerRef.current);
    nominatimTimerRef.current = setTimeout(async () => {
      try {
        setRegionLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&limit=10&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'id', 'User-Agent': 'enakho-app-demo' } });
        const data = await res.json();
        const mappedRaw = (data || []).map((it) => ({ label: buildNominatimLabel(it), value: buildNominatimLabel(it), type: it.type }));
        // Deduplicate by label and prioritize city/regency > district > village
        const priority = { city: 3, town: 3, municipality: 3, county: 3, district: 2, subdistrict: 2, village: 1, suburb: 1, hamlet: 1, neighbourhood: 1 };
        const dedup = {};
        mappedRaw.forEach((m) => {
          const p = priority[m.type] || 0;
          if (!dedup[m.label] || p > dedup[m.label].p) dedup[m.label] = { ...m, p };
        });
        const mapped = Object.values(dedup).slice(0, 10).map(({label})=>({label, value: label}));
        setRegionSuggestions(mapped);
        setShowRegionSuggest(true);
      } catch (e) {
        console.error('Nominatim error:', e);
        setRegionSuggestions([]);
        setShowRegionSuggest(true);
      } finally {
        setRegionLoading(false);
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer.city]);

  // Inject floating animation keyframes
  useEffect(() => {
    const styleId = 'pesan-float-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `@keyframes enakhoFloat { 0% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-12px); } 100% { transform: translateX(-50%) translateY(0); } }`;
  }, []);

  // Hide floating button when Data Pembeli section is in view
  useEffect(() => {
    const checkVisibility = () => {
      const element = dataPembeliRef.current;
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Hide if section top is within viewport (even partially visible)
      // Using threshold - hide when section top is less than 80% of viewport
      const threshold = windowHeight * 0.8;
      const shouldHide = rect.top < threshold;
      setShowFloatingBtn(!shouldHide);
    };

    // Initial check after a short delay to ensure DOM is ready
    setTimeout(checkVisibility, 100);

    // Check on scroll and resize
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, []);

  const scrollToDataPembeli = () => {
    const element = document.getElementById('dataPembeliSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="food-theme-bg dimsum-pattern" style={{minHeight: '100vh'}}>
      {/* Floating CTA */}
      {showFloatingBtn && (
        <button
          onClick={scrollToDataPembeli}
          aria-label="Pesan Sekarang"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '16px',
            zIndex: 900,
            backgroundColor: 'white',
            color: '#6D2316',
            border: 'none',
            borderRadius: '9999px',
            padding: '8px 14px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 8px 22px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transform: 'translateX(-50%)',
            animation: 'enakhoFloat 1.2s ease-in-out infinite',
            animationPlayState: 'running'
          }}
          onMouseEnter={(e)=>{ e.currentTarget.style.animationPlayState='paused'; e.currentTarget.style.boxShadow='0 12px 26px rgba(0,0,0,0.3)'; }}
          onMouseLeave={(e)=>{ e.currentTarget.style.animationPlayState='running'; e.currentTarget.style.boxShadow='0 8px 22px rgba(0,0,0,0.2)'; }}
        >
          PESAN SEKARANG
        </button>
      )}
      <div className="container py-4" style={{paddingTop: '0.75rem'}}>
        <div className="position-relative d-flex align-items-center justify-content-center mb-2">
          <button
            type="button"
            className="btn p-0"
            onClick={() => {
              if (window.history.length <= 2) {
                navigate('/', { replace: true });
              } else {
                navigate(-1);
              }
            }}
            aria-label="Kembali"
            style={{
              position: 'absolute',
              left: 0,
              width: '40px',
              height: '40px',
              border: 'none',
              backgroundColor: 'white',
              borderRadius: '50%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = 'white'; }}
          >
            <img src="/images/logo_panah_kiri.png" alt="Kembali" style={{width: '22px', height: '22px', filter: 'invert(17%) sepia(83%) saturate(2085%) hue-rotate(340deg) brightness(91%) contrast(89%)'}} />
          </button>
          <img 
            src="/images/logo_enakho_full.jpg" 
            alt="ENAKHO" 
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '3px solid white'
            }}
          />
        </div>
        <div className="d-flex justify-content-center mb-3">
          <div
            style={{
              backgroundColor: 'white',
              color: '#6D2316',
              borderRadius: '9999px',
              padding: '12px 32px',
              fontWeight: 'bold',
              fontSize: '16px',
              letterSpacing: '0.6px',
              marginTop: '14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
            }}
          >
            PRODUK KAMI
          </div>
        </div>
        {loading ? (
          <div className="text-center text-muted py-5">Memuat gambar produk...</div>
        ) : imageUrls.length === 0 ? (
          <div className="text-center text-muted py-5">Belum ada gambar produk</div>
        ) : (
          <div>
          <div 
            id="pesanCarousel" 
            className="carousel slide card shadow-lg border-0"
            data-bs-ride="carousel"
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(254,246,236,0.9))',
              boxShadow: '0 12px 28px rgba(109,35,22,0.12)'
            }}
            ref={carouselElRef}
          >
            <div className="carousel-inner">
              {imageUrls.map((url, idx) => (
                <div className={`carousel-item ${idx === 0 ? 'active' : ''}`} key={url}>
                  <div 
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: '80vh',
                      background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(254,246,236,0.95) 60%, rgba(254,246,236,0.7) 100%)'
                    }}
                  >
                    <img
                      src={url}
                      alt={`produk-${idx}`}
                      style={{maxHeight: '75vh', maxWidth: '88vw', objectFit: 'contain', display: 'block'}}
                      onError={(e)=>{ e.currentTarget.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500"%3E%3Crect fill="%23f0f0f0" width="800" height="500"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E'; }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Info COD & Instant Delivery */}
          <div className="d-flex gap-3 mt-3" style={{width: '100%'}}>
            <div 
              className="d-flex flex-column align-items-center justify-content-center px-3 pb-3"
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                flex: '1 1 0',
                paddingTop: '0px'
              }}
            >
              <img src="/images/logo_cod.png" alt="COD" style={{width: '120px', height: '120px', marginBottom: '-20px', marginTop: '-12px', objectFit: 'contain'}} />
              <span style={{fontWeight: 600, color: '#6d2316', fontSize: '14px', textAlign: 'center', marginTop: '0px', lineHeight: '1'}}>Bisa COD</span>
            </div>
            <div 
              className="d-flex flex-column align-items-center justify-content-center px-3 pb-3"
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                flex: '1 1 0',
                paddingTop: '0px'
              }}
            >
              <img src="/images/logo_pengiriman.png" alt="Pengiriman" style={{width: '120px', height: '120px', marginBottom: '-20px', marginTop: '-12px', objectFit: 'contain'}} />
              <span style={{fontWeight: 600, color: '#6d2316', fontSize: '14px', textAlign: 'center', marginTop: '0px', lineHeight: '1'}}>Pengiriman INSTAN by Kurir</span>
            </div>
          </div>
          
          {/* Hubungi Kami Button */}
          <div className="d-flex justify-content-center mt-3">
            <button
              type="button"
              className="btn d-flex align-items-center"
              onClick={handleContactUs}
              style={{
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                padding: '10px 24px',
                fontWeight: 'bold',
                fontSize: '15px',
                boxShadow: '0 4px 20px rgba(37,211,102,0.5), 0 0 20px rgba(37,211,102,0.3)'
              }}
              onMouseEnter={(e)=>{ 
                e.currentTarget.style.backgroundColor = '#20BA5A';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(37,211,102,0.6), 0 0 30px rgba(37,211,102,0.4)';
              }}
              onMouseLeave={(e)=>{ 
                e.currentTarget.style.backgroundColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.5), 0 0 20px rgba(37,211,102,0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{marginRight: '10px', flexShrink: 0}}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Hubungi Kami Jika Ada Pertanyaan Lainnya
            </button>
          </div>
          
          {/* Radio selector below carousel - wrapped in card */}
          <div className="card border-0 shadow-sm mt-3" style={{borderRadius: '14px', overflow: 'hidden'}}>
            <div
              className="p-3"
              style={{
                backgroundColor: 'white',
                color: '#6D2316',
                fontWeight: 'bold',
                border: '2px solid #6D2316',
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px',
                textAlign: 'center'
              }}
            >
              Produk
            </div>
            <div className="p-3 d-flex flex-wrap justify-content-center gap-2" style={{borderLeft: '2px solid #6D2316', borderRight: '2px solid #6D2316', borderBottom: '2px solid #6D2316', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px'}}>
              {products.map((p, idx) => (
                <label
                  key={p.id}
                  className="d-flex align-items-center"
                  style={{
                    backgroundColor: activeIndex === idx ? '#6d2316' : '#ffffff',
                    color: activeIndex === idx ? '#ffffff' : '#6d2316',
                    border: '2px solid #6d2316',
                    borderRadius: '9999px',
                    padding: '8px 14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    setActiveIndex(idx);
                    if (carouselInstanceRef.current) {
                      carouselInstanceRef.current.to(idx);
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="produkSelector"
                    checked={activeIndex === idx}
                    onChange={() => {}}
                    style={{display: 'none'}}
                  />
                  {p.nama_produk}
                </label>
              ))}
            </div>
          </div>

          {/* Varian Section */}
          <div className="card border-0 shadow-sm mt-4" style={{borderRadius: '14px', overflow: 'hidden'}}>
            <div
              className="p-3"
              style={{
                backgroundColor: 'white',
                color: '#6D2316',
                fontWeight: 'bold',
                border: '2px solid #6D2316',
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px',
                textAlign: 'center'
              }}
            >
              {`Varian dari Produk ${products[activeIndex]?.nama_produk || ''}`}
            </div>
            <div className="p-0" style={{borderLeft: '2px solid #6D2316', borderRight: '2px solid #6D2316', borderBottom: '2px solid #6D2316', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px'}}>
              {Array.isArray(products[activeIndex]?.varian) && products[activeIndex].varian.length > 0 ? (
                <div className="list-group list-group-flush">
                  {products[activeIndex].varian.map((v, i) => {
                    const pid = products[activeIndex].id;
                    const count = (variantCountsByProduct[pid] && variantCountsByProduct[pid][v]) || 0;
                    return (
                      <div
                        key={`${pid}-var-${i}`}
                        className="list-group-item d-flex align-items-center justify-content-between"
                        style={{ padding: '12px 16px' }}
                      >
                        <div>
                          <div style={{fontWeight: 600, color: '#6d2316'}}>{v}</div>
                          <div className="text-muted" style={{fontSize:'0.9rem'}}>
                            {`Harga: Rp ${Intl.NumberFormat('id-ID').format(getVariantPrice(pid, v))}`}
                          </div>
                        </div>
                        <div className="btn-group" role="group" aria-label={`qty-${v}`}>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => adjustVariantCount(pid, v, -1)}
                            style={{ width: '40px' }}
                          >
                            -
                          </button>
                          <div
                            className="d-flex align-items-center justify-content-center"
                            style={{
                              width: '48px',
                              borderTop: '1px solid #dee2e6',
                              borderBottom: '1px solid #dee2e6'
                            }}
                          >
                            {count}
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => adjustVariantCount(pid, v, +1)}
                            style={{ width: '40px' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted p-3">Belum ada varian untuk produk ini.</div>
              )}
            </div>
          </div>

          {/* Buyer Information Section */}
          <div id="dataPembeliSection" ref={dataPembeliRef} className="card border-0 shadow-sm mt-4" style={{borderRadius: '14px', overflow: 'hidden'}}>
            <div
              className="p-3"
              style={{
                backgroundColor: 'white',
                color: '#6D2316',
                fontWeight: 'bold',
                border: '2px solid #6D2316',
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px',
                textAlign: 'center'
              }}
            >
              Data Pembeli
            </div>
            <div className="p-3" style={{borderLeft: '2px solid #6D2316', borderRight: '2px solid #6D2316', borderBottom: '2px solid #6D2316', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px'}}>
              <div className="mb-3">
                <label className="form-label" htmlFor="buyer-name" style={{fontWeight: 600, color: '#6d2316'}}>Nama</label>
                <input
                  id="buyer-name"
                  type="text"
                  className="form-control"
                  value={buyer.name}
                  onChange={(e)=>setBuyer({...buyer, name: e.target.value})}
                  placeholder="Masukkan Nama"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="buyer-wa" style={{fontWeight: 600, color: '#6d2316'}}>No. Whatsapp</label>
                <input
                  id="buyer-wa"
                  type="tel"
                  className="form-control"
                  value={buyer.whatsapp}
                  onChange={(e)=>setBuyer({...buyer, whatsapp: e.target.value})}
                  placeholder="Contoh: 62812xxxxxxx"
                  required
                />
              </div>
              <div className="mb-3 position-relative">
                <label className="form-label" htmlFor="buyer-city" style={{fontWeight: 600, color: '#6d2316'}}>Masukkan Kota / Kecamatan</label>
                <input
                  id="buyer-city"
                  type="text"
                  className="form-control"
                  value={buyer.city}
                  onChange={(e)=>setBuyer({...buyer, city: e.target.value})}
                  placeholder="Kota / Kecamatan"
                  onFocus={()=>{ if ((buyer.city||'').length>=3) setShowRegionSuggest(true); }}
                  required
                />
                {showRegionSuggest && (
                  <div className="list-group" style={{position:'absolute', top:'100%', left:0, right:0, zIndex: 1000, maxHeight:'220px', overflowY:'auto'}}>
                    {regionLoading && (
                      <div className="list-group-item text-muted">Memuat data wilayah...</div>
                    )}
                    {!regionLoading && regionSuggestions.length === 0 && (
                      <div className="list-group-item text-muted">Tidak ada hasil</div>
                    )}
                    {regionSuggestions.map((s, idx) => (
                      <button
                        key={`sug-${idx}`}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => { setBuyer({...buyer, city: s.value}); setShowRegionSuggest(false); }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-2">
                <label className="form-label" htmlFor="buyer-address" style={{fontWeight: 600, color: '#6d2316'}}>Alamat Lengkap</label>
                <textarea
                  id="buyer-address"
                  className="form-control"
                  rows="3"
                  value={buyer.address}
                  onChange={(e)=>setBuyer({...buyer, address: e.target.value})}
                  placeholder="Tulis alamat lengkap pengiriman"
                  required
                />
              </div>
              {/* Embedded Cart inside Buyer card */}
              <hr />
              <div className="mb-2" style={{fontWeight: 700, color: '#6d2316'}}>Keranjang</div>
              <div className="p-0">
                {(() => {
                  const items = [];
                  products.forEach((p) => {
                    const counts = variantCountsByProduct[p.id] || {};
                    Object.entries(counts).forEach(([name, q]) => {
                      if (q > 0) items.push({ product: p, name, qty: q });
                    });
                  });
                  if (items.length === 0) {
                    return <div className="text-muted">Keranjang kosong. Pilih varian untuk menambah.</div>;
                  }
                  const withPrices = items.map((it) => {
                    const unit = getVariantPrice(it.product.id, it.name) || 0;
                    const subtotal = unit * it.qty;
                    return { ...it, unit, subtotal };
                  });
                  const totalQty = withPrices.reduce((sum, it) => sum + it.qty, 0);
                  const totalPrice = withPrices.reduce((sum, it) => sum + it.subtotal, 0);
                  return (
                    <>
                      <div className="list-group list-group-flush">
                        {withPrices.map((it, idx) => (
                          <div key={`cart-inline-${idx}`} className="list-group-item d-flex align-items-center justify-content-between" style={{padding: '12px 0'}}>
                            <div>
                              <div style={{fontWeight: 700, color: '#6d2316'}}>{it.product.nama_produk}</div>
                              <div className="text-muted" style={{fontSize: '0.9rem'}}>{it.name}</div>
                              <div className="text-muted" style={{fontSize: '0.9rem'}}>
                                {`${formatRp(it.unit)} x ${it.qty} = `}
                                <span style={{fontWeight: 600, color: '#6d2316'}}>{formatRp(it.subtotal)}</span>
                              </div>
                            </div>
                            <div className="btn-group" role="group">
                              <button type="button" className="btn btn-outline-secondary" style={{width:'40px'}} onClick={()=>adjustVariantCount(it.product.id, it.name, -1)}>-</button>
                              <div className="d-flex align-items-center justify-content-center" style={{width:'48px', borderTop:'1px solid #dee2e6', borderBottom:'1px solid #dee2e6'}}>{it.qty}</div>
                              <button type="button" className="btn btn-outline-secondary" style={{width:'40px'}} onClick={()=>adjustVariantCount(it.product.id, it.name, +1)}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center pt-2">
                        <div style={{fontWeight:700, color:'#6d2316'}}>Total Item</div>
                        <div style={{fontWeight:700}}>{totalQty}</div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div style={{fontWeight:700, color:'#6d2316'}}>Total Harga</div>
                        <div style={{fontWeight:700}}>{formatRp(totalPrice)}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="d-grid mt-3">
                <button
                  type="button"
                  className="btn btn-lg"
                  onClick={handleOrder}
                  style={{
                    backgroundColor: '#6d2316',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    borderRadius: '9999px',
                    padding: '12px 18px',
                    boxShadow: '0 8px 22px rgba(109,35,22,0.28)'
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#8b2e1d'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = '#6d2316'; }}
                >
                  Pesan Sekarang
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
      
      {/* Modal Hubungi Kami */}
      {showContactModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9999
            }}
            onClick={() => {
              setShowContactModal(false);
              setQuestion('');
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              backgroundColor: '#fff',
              padding: '24px 30px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{marginBottom: '20px', textAlign: 'center'}}>
              <h5 style={{fontWeight: 'bold', color: '#6d2316', marginBottom: '10px'}}>Hubungi Kami</h5>
              <p style={{color: '#666', fontSize: '14px', margin: 0}}>Silakan tulis pertanyaan Anda di bawah ini</p>
            </div>
            <div style={{marginBottom: '20px'}}>
              <label className="form-label" style={{fontWeight: 600, color: '#6d2316', marginBottom: '8px', display: 'block'}}>
                Pertanyaan
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Tulis pertanyaan Anda di sini..."
                style={{
                  borderRadius: '8px',
                  border: '2px solid #dee2e6',
                  padding: '10px'
                }}
              />
            </div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                type="button"
                onClick={() => {
                  setShowContactModal(false);
                  setQuestion('');
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendQuestion}
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 20px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Kirim
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Alert Popup */}
      {showAlert && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9999
            }}
            onClick={() => setShowAlert(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              backgroundColor: '#fff',
              padding: '20px 30px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              textAlign: 'center'
            }}
          >
          <div style={{marginBottom: '15px'}}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#dc3545" style={{marginBottom: '10px'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div style={{fontSize: '16px', fontWeight: 600, color: '#6d2316', marginBottom: '10px'}}>
            {alertMessage}
          </div>
          <button
            type="button"
            onClick={() => setShowAlert(false)}
            style={{
              backgroundColor: '#6d2316',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            OK
          </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Pesan;


