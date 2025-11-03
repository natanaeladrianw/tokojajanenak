import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel as BsCarousel } from 'bootstrap';
import { apiClient, getImageUrl } from '../config/api';

const LandingPage = ({ products, loading, carouselImages = [] }) => {
  const navigate = useNavigate();
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [ctaTexts, setCtaTexts] = useState({
    cta_whatsapp: 'Dapatkan Potongan Harga Khusus',
    cta_shopee: 'Bisa COD & Gratis Ongkir!',
    cta_tiktok: 'Bisa COD & Gratis Ongkir!',
    cta_reseller: 'Dapatkan Harga Khusus Reseller',
    cta_shopee_link: '',
    cta_tiktok_link: '',
    hero_title_prefix: 'Untung ada',
    hero_title_brand: 'ENAKHO',
    hero_title_suffix: 'Frozen Food',
    hero_subtitle: 'Masak jadi makin praktis dan simpel. Anak dan Pak Suami pasti suka!'
  });
  const [backgroundColor, setBackgroundColor] = useState('#6D2316');

  // Testimonials images (from backend) + lightbox state
  const [testimonials, setTestimonials] = useState([]);
  const [packages, setPackages] = useState([]);
  const [popupImages, setPopupImages] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTestiModalOpen, setIsTestiModalOpen] = useState(false);
  const [activeTestiIndex, setActiveTestiIndex] = useState(0);
  const [testiDragStartX, setTestiDragStartX] = useState(null);
  const [isTestiDragging, setIsTestiDragging] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(true);
  // WhatsApp templates for package button
  const [packageTemplate, setPackageTemplate] = useState('');
  // Alert state for custom popup
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Enable swipe/drag for hero carousel (touch + mouse)
  useEffect(() => {
    // Only set up when images ready and element exists
    if (!carouselImages || carouselImages.length === 0) return;
    const el = document.getElementById('heroCarousel');
    if (!el) return;
    // Ensure Bootstrap instance exists
    const instance = BsCarousel.getOrCreateInstance(el, { touch: true });

    let startX = null;
    let isPointerDown = false;
    const threshold = 20; // px - lebih sensitif

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

    // Prevent image native drag ghost
    const imgs = el.querySelectorAll('img');
    imgs.forEach((img) => img.setAttribute('draggable', 'false'));

    return () => {
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
    };
  }, [carouselImages]);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/testimonials');
        setTestimonials(res.data || []);
      } catch (e) {
        setTestimonials([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/paket');
        setPackages(res.data || []);
      } catch (e) {
        setPackages([]);
      }
    })();
  }, []);

  // Fetch template for package button
  useEffect(() => {
    const fetchPackageWhatsappData = async () => {
      try {
        // Fetch template
        const templatesRes = await apiClient.get('/api/whatsapp/templates');
        const templates = templatesRes.data;
        const packageTpl = templates.find(t => t.template_type === 'package');
        if (packageTpl) setPackageTemplate(packageTpl.template_format);
      } catch (e) {
        console.error('Error fetching package WhatsApp data:', e);
        // No fallback - data must come from database
      }
    };
    fetchPackageWhatsappData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/popup');
        const imgs = res.data || [];
        setPopupImages(imgs);
        setShowPopup(imgs.length > 0);
      } catch (e) {
        setPopupImages([]);
      }
    })();
  }, []);

  // Auto-advance for popup (custom slider)
  useEffect(() => {
    if (!showPopup) return;
    if (!popupImages || popupImages.length <= 1) return;
    const id = setInterval(() => {
      setPopupIndex((prev) => (prev + 1) % popupImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [showPopup, popupImages]);

  // Handlers for swipe/drag gesture on popup image
  const beginDrag = (x) => {
    setDragStartX(x);
    setIsDragging(true);
  };
  const moveDrag = (x) => {
    if (!isDragging || dragStartX === null) return;
    const dx = x - dragStartX;
    const threshold = 20; // px - lebih sensitif
    if (dx > threshold) {
      setPopupIndex((prev) => (prev - 1 + popupImages.length) % popupImages.length);
      setIsDragging(false);
    } else if (dx < -threshold) {
      setPopupIndex((prev) => (prev + 1) % popupImages.length);
      setIsDragging(false);
    }
  };
  const endDrag = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  const openTestiModal = (index) => {
    setActiveTestiIndex(index);
    setIsTestiModalOpen(true);
  };
  const closeTestiModal = () => setIsTestiModalOpen(false);
  const nextTesti = () => {
    if (testimonials.length === 0) return;
    setActiveTestiIndex((prev) => (prev + 1) % testimonials.length);
  };
  const prevTesti = () => {
    if (testimonials.length === 0) return;
    setActiveTestiIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Swipe handlers for testi modal
  const beginTestiDrag = (x) => {
    setTestiDragStartX(x);
    setIsTestiDragging(true);
  };
  const moveTestiDrag = (x) => {
    if (!isTestiDragging || testiDragStartX === null) return;
    const dx = x - testiDragStartX;
    const threshold = 20; // px - lebih sensitif
    if (dx > threshold) {
      prevTesti();
      setIsTestiDragging(false);
    } else if (dx < -threshold) {
      nextTesti();
      setIsTestiDragging(false);
    }
  };
  const endTestiDrag = () => {
    setIsTestiDragging(false);
    setTestiDragStartX(null);
  };

  useEffect(() => {
    if (!isTestiModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeTestiModal();
      if (e.key === 'ArrowRight') nextTesti();
      if (e.key === 'ArrowLeft') prevTesti();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestiModalOpen, testimonials.length]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/settings', {
          params: { keys: 'cta_whatsapp,cta_shopee,cta_tiktok,cta_reseller,cta_shopee_link,cta_tiktok_link,hero_title_prefix,hero_title_brand,hero_title_suffix,hero_subtitle,background_color' }
        });
        const map = {};
        (res.data || []).forEach(row => { map[row.key] = row.value ?? ''; });
        setCtaTexts(prev => ({ ...prev, ...map }));
        // Background color always set to #6D2316 (no gradient)
        setBackgroundColor('#6D2316');
      } catch (e) {
        // ignore, use defaults
      }
    })();
  }, []);

  const openInNewTab = (url) => {
    if (!url) return;
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      window.open(normalized, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // ignore
    }
  };

  // Handler for package WhatsApp button - using database only
  const handlePackageOrder = async (packageName) => {
    // Validate template exists
    if (!packageTemplate || packageTemplate.trim() === '') {
      setAlertMessage('Format pesan belum dikonfigurasi. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    // Build message from template
    let message = packageTemplate;
    message = message.replace(/\{\{nama_paket\}\}/g, packageName || '');

    if (!message || message.trim() === '') {
      setAlertMessage('Gagal membuat pesan. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    // Fetch package numbers from database - MUST use database only, no hardcode
    try {
      const packageNumbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=package');
      const packageNumbers = packageNumbersRes.data.map(n => n.phone_number);
      if (packageNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * packageNumbers.length);
        const adminWaNumber = packageNumbers[randomIndex];
        const text = encodeURIComponent(message);
        
        // Track Lead event for Facebook Pixel
        if (window.fbq) {
          window.fbq('track', 'Lead');
        }
        
        const url = `https://wa.me/${adminWaNumber}?text=${text}`;
        window.open(url, '_blank', 'noopener');
        return;
      } else {
        setAlertMessage('Tidak ada nomor WhatsApp yang dikonfigurasi untuk tombol Pesan via WhatsApp (Paket). Silakan hubungi administrator.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
        return;
      }
    } catch (e) {
      console.error('Error fetching package numbers:', e);
      setAlertMessage('Gagal memuat nomor WhatsApp. Silakan coba lagi atau hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }
  };

  const scrollToPaket = () => {
    try {
      const el = document.getElementById('paketSection');
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {
      // ignore
    }
  };

  // Toggle CTA visibility based on PAKET section viewport presence
  useEffect(() => {
    const updateCtaVisibility = () => {
      const el = document.getElementById('paketSection');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0; // any intersection
      setShowFloatingCta(!inView);
    };
    updateCtaVisibility();
    window.addEventListener('scroll', updateCtaVisibility, { passive: true });
    window.addEventListener('resize', updateCtaVisibility);
    return () => {
      window.removeEventListener('scroll', updateCtaVisibility);
      window.removeEventListener('resize', updateCtaVisibility);
    };
  }, []);

  // Inject/update keyframes for floating CTA animation
  useEffect(() => {
    const styleId = 'cta-float-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    // Faster and larger motion
    style.textContent = `@keyframes enakhoFloat { 0% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-12px); } 100% { transform: translateX(-50%) translateY(0); } }`;
  }, []);

  const toggleDropdown = useCallback((productId, e) => {
    // Prevent event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Only toggle if productId is valid
    if (!productId && productId !== 0) {
      console.warn('Invalid productId:', productId);
      return;
    }
    
    const newId = Number(productId);
    if (isNaN(newId)) {
      console.warn('Invalid productId (NaN):', productId);
      return;
    }
    
    // Toggle: if ID exists in array, remove it; otherwise add it
    setOpenDropdowns(prevOpenIds => {
      const isOpen = prevOpenIds.includes(newId);
      if (isOpen) {
        // Remove from array
        return prevOpenIds.filter(id => id !== newId);
      } else {
        // Add to array
        return [...prevOpenIds, newId];
      }
    });
  }, []);

  // Function to fetch product details
  const fetchProductDetails = async (productId) => {
    try {
      const response = await apiClient.get(`/api/detail/${productId}`);
      setProductDetails(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setProductDetails([]);
    }
  };

  // Function to handle detail product button click
  const handleDetailProductClick = async (product) => {
    setSelectedProduct(product);
    await fetchProductDetails(product.id);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="food-theme-bg dimsum-pattern" style={{backgroundColor: backgroundColor}}>
      {/* Floating CTA to Paket */}
      {showFloatingCta && (
      <button
        onClick={scrollToPaket}
        aria-label="Cek Paket Sekarang!"
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
        CEK PAKET ENAKHO SEKARANG !!
      </button>
      )}
      {/* Hero Section */}
      <section className="hero-section-enhanced py-5" style={{backgroundColor: backgroundColor}}>
        <div className="container">
          {/* Top bar: logo left, social icons right */}
          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '10px' }}>
            <img src="/images/logo_enakho.jpg" alt="ENAKHO" style={{height: '60px'}} className="hero-logo" />
            <div className="d-flex" style={{ gap: '8px' }}>
              {/* Instagram */}
              <div
                onClick={() => openInNewTab('https://www.instagram.com/tokojajanenak?igsh=b3o3ZjBweW85YjNt')}
                title="Instagram Enakho"
                role="button"
                tabIndex={0}
                onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openInNewTab('https://www.instagram.com/tokojajanenak?igsh=b3o3ZjBweW85YjNt'); }}
                style={{ width:'36px', height:'36px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.15)', cursor:'pointer'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Instagram">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="#C13584" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4.5" stroke="#C13584" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.25" fill="#C13584"/>
                </svg>
              </div>
              {/* TikTok */}
              <div
                onClick={() => openInNewTab('https://www.tiktok.com/@tokojajanenak?_t=ZS-90xeLmeb1Qg&_r=1')}
                title="TikTok Enakho"
                role="button"
                tabIndex={0}
                onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openInNewTab('https://www.tiktok.com/@tokojajanenak?_t=ZS-90xeLmeb1Qg&_r=1'); }}
                style={{ width:'36px', height:'36px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.15)', cursor:'pointer'}}>
                <img src="/images/logo_tiktok.png" alt="TikTok" style={{ width:'22px', height:'22px', objectFit:'contain' }} />
              </div>
              {/* Shopee */}
              <div
                onClick={() => openInNewTab('http://shopee.co.id/tokojajanenak')}
                title="Shopee Enakho"
                role="button"
                tabIndex={0}
                onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') openInNewTab('http://shopee.co.id/tokojajanenak'); }}
                style={{ width:'36px', height:'36px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.15)', cursor:'pointer'}}>
                <img src="/images/logo_shopee.png" alt="Shopee" style={{ width:'22px', height:'22px', objectFit:'contain' }} />
              </div>
            </div>
          </div>
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-4 fw-bold text-with-shadow" style={{color: 'white'}}>
                {ctaTexts.hero_title_prefix} <span style={{color: 'white'}}>{ctaTexts.hero_title_brand}</span> {ctaTexts.hero_title_suffix}
              </h1>
              {ctaTexts.hero_subtitle && (
                <p className="lead text-with-shadow" style={{color: 'white'}}>
                  {ctaTexts.hero_subtitle}
                </p>
              )}
              <div className="d-flex flex-column gap-3 mt-3" style={{marginBottom: '40px'}}>
                {/* Row 1: WhatsApp and Shopee */}
                <div className="d-flex flex-column flex-md-row gap-3" style={{alignItems: 'stretch'}}>
                  {/* WhatsApp Button */}
                  <button 
                    className="btn d-flex align-items-center fw-bold"
                    style={{
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '12px 20px',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: '1 1 0',
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: '70px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#20BA5A';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#25D366';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)';
                    }}
                  onClick={() => navigate('/pesan')}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{marginRight: '12px', flexShrink: 0}}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <div className="d-flex flex-column" style={{textAlign: 'left'}}>
                      <span style={{fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Pesan Via Whatsapp</span>
                      <span style={{fontSize: '12px', fontWeight: 'normal', opacity: '0.95', marginTop: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{ctaTexts.cta_whatsapp}</span>
                    </div>
                  </button>

                  {/* Shopee Button */}
                  <button 
                    className="btn d-flex align-items-center fw-bold"
                    style={{
                      backgroundColor: '#FF7F27',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '12px 20px',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(255, 127, 39, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: '1 1 0',
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: '70px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#FF6B00';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(255, 127, 39, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FF7F27';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(255, 127, 39, 0.4)';
                    }}
                  onClick={() => openInNewTab(ctaTexts.cta_shopee_link)}
                  disabled={!ctaTexts.cta_shopee_link}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      marginRight: '12px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      borderRadius: '6px'
                    }}>
                      <img 
                        src="/images/logo_shopee.png" 
                        alt="Shopee" 
                        style={{
                          width: '36px',
                          height: '36px',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div className="d-flex flex-column" style={{textAlign: 'left'}}>
                      <span style={{fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Pesan via Shopee</span>
                      <span style={{fontSize: '12px', fontWeight: 'normal', color: '#FFF4E6', marginTop: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{ctaTexts.cta_shopee}</span>
                    </div>
                  </button>
                </div>

                {/* Row 2: TikTok Button and Daftar Reseller */}
                <div className="d-flex flex-column flex-md-row gap-3" style={{alignItems: 'stretch'}}>
                  <button 
                    className="btn d-flex align-items-center fw-bold"
                    style={{
                      backgroundColor: '#333333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '12px 20px',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(51, 51, 51, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: '1 1 0',
                      minHeight: '70px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1a1a1a';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(51, 51, 51, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#333333';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(51, 51, 51, 0.4)';
                    }}
                    onClick={() => openInNewTab(ctaTexts.cta_tiktok_link)}
                    disabled={!ctaTexts.cta_tiktok_link}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      marginRight: '12px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#000000',
                      borderRadius: '6px',
                      padding: '4px'
                    }}>
                      <img 
                        src="/images/logo_tiktok.png" 
                        alt="TikTok" 
                        style={{
                          width: '28px',
                          height: '28px',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div className="d-flex flex-column" style={{textAlign: 'left'}}>
                      <span style={{fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>Pesan via Tiktokshop</span>
                      <span style={{fontSize: '12px', fontWeight: 'normal', color: '#CCCCCC', marginTop: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{ctaTexts.cta_tiktok}</span>
                    </div>
                  </button>

                  {/* Daftar Reseller Button */}
                  <button 
                    className="btn d-flex align-items-center fw-bold"
                    style={{
                      backgroundColor: '#FFC107',
                      color: '#000',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '12px 20px',
                      fontSize: '16px',
                      boxShadow: '0 4px 15px rgba(255, 193, 7, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: '1 1 0',
                      minHeight: '70px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#FFB300';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FFC107';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.4)';
                    }}
                    onClick={() => navigate('/reseller')}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      marginRight: '12px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      borderRadius: '6px'
                    }}>
                      <img 
                        src="/images/logo_tangan.png" 
                        alt="Handshake" 
                        style={{
                          width: '36px',
                          height: '36px',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <div className="d-flex flex-column" style={{textAlign: 'left'}}>
                      <span style={{fontSize: '15px', fontWeight: 'bold', lineHeight: '1.2', color: '#000'}}>Daftar Reseller</span>
                      <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666', marginTop: '2px'}}>{ctaTexts.cta_reseller}</span>
                    </div>
                  </button>
              </div>
            </div>
              {/* Flash sale removed as requested */}
            </div>
            <div className="col-md-6">
              {(carouselImages && carouselImages.length > 0) ? (
                <div>
                  <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-touch="true" data-bs-interval="5000">
                  <div className="carousel-indicators" style={{bottom:'12px'}}>
                    {(carouselImages.slice(0,5)).map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        data-bs-target="#heroCarousel"
                        data-bs-slide-to={idx}
                        className={idx === 0 ? 'active' : ''}
                        aria-current={idx === 0 ? 'true' : undefined}
                        aria-label={`Slide ${idx+1}`}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          margin: '0 6px',
                          backgroundColor: '#fff'
                        }}
                      />
                    ))}
                  </div>
                  <div className="carousel-inner rounded shadow">
                    {(carouselImages.slice(0,5)).map((item, idx) => (
                      <div key={item.id} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                        <img 
                          src={getImageUrl(item.image_path)} 
                          className="d-block w-100" 
                          alt={`slide-${item.id}`} 
                          style={{maxHeight: '320px', objectFit: 'cover'}} 
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="320"%3E%3Crect fill="%23f0f0f0" width="800" height="320"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Arrows removed; swipe gesture enabled */}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded shadow text-center">
                  <h5 className="text-muted mb-0">Belum ada gambar slider untuk ditampilkan</h5>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Products Section */}
      <section className="hero-section-enhanced py-5" style={{backgroundColor: backgroundColor}}>
        <div className="container">
          <h2 className="text-center mb-5 fw-bold text-with-shadow" style={{color: 'white'}}>
            PRODUK KAMI
          </h2>
          
          <div className="row">
            {(products || []).map((product, index) => {
              // Ensure product has valid ID
              const productId = product?.id;
              if (!productId && productId !== 0) {
                console.warn('Product without valid ID:', product);
                return null;
              }
              
              // Use both id and index for unique key
              const uniqueKey = `product-${productId}-${index}`;
              
              // Check if this product's dropdown is open
              const thisProductId = Number(productId);
              const isOpen = openDropdowns.includes(thisProductId);
              
              return (
              <div key={uniqueKey} className="col-md-4 mb-4">
                <div 
                  className={`card product-card-enhanced ${isOpen ? 'dropdown-open' : 'dropdown-closed'}`} 
                  style={{
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div 
                    className="card-header text-center py-3" 
                    style={{
                      cursor: 'pointer', 
                      backgroundColor: 'white',
                      color: '#6D2316',
                      borderBottomLeftRadius: !isOpen ? 'calc(0.375rem - 1px)' : '0',
                      borderBottomRightRadius: !isOpen ? 'calc(0.375rem - 1px)' : '0'
                    }}
                    onClick={(e) => toggleDropdown(productId, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown(productId, e);
                      }
                    }}
                  >
                    <h5 className="mb-0 d-flex justify-content-between align-items-center" style={{color: '#6D2316'}}>
                      <span>{product.nama_produk}</span>
                      <span 
                        className="dropdown-icon" 
                        style={{
                          fontSize: '0.8em',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: '#6D2316'
                        }}
                      >
                        ▼
                      </span>
                    </h5>
                  </div>
                  <div 
                    className={`dropdown-content ${isOpen ? 'dropdown-open' : 'dropdown-closed'}`}
                    key={`content-${productId}`}
                  >
                      <div className="card-body text-center p-0" style={{backgroundColor: '#f8f9fa', overflow: 'hidden'}}>
                        {product.gambar_produk ? (
                          <img 
                            src={getImageUrl(product.gambar_produk)} 
                            alt={product.nama_produk}
                            className="w-100"
                            style={{width: '100%', height: 'auto', display: 'block'}}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23f0f0f0" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="p-4" style={{minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa'}}>
                            <span className="text-muted">Tidak ada gambar</span>
                    </div>
                        )}
                  </div>
                  <div className="card-footer bg-transparent border-0">
                      <div className="d-grid">
                        <button 
                          className="btn btn-sm" 
                          onClick={() => handleDetailProductClick(product)}
                          style={{
                            backgroundColor: '#6d2316',
                            color: 'white',
                            border: '2px solid #6d2316',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            padding: '8px 16px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(109, 35, 22, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#8B2F3A';
                            e.target.style.borderColor = '#8B2F3A';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(109, 35, 22, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#6d2316';
                            e.target.style.borderColor = '#6d2316';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(109, 35, 22, 0.2)';
                          }}
                        >
                          Detail Produk
                        </button>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {(!products || products.length === 0) && (
            <div className="text-center mt-4 py-5" style={{color: '#6d2316'}}>
              <h5>Belum ada produk tersedia</h5>
              <p>Silakan hubungi admin untuk informasi produk</p>
        </div>
          )}
        </div>
      </section>

      {/* Testimoni Section */}
      <section className="hero-section-enhanced py-5" style={{backgroundColor: backgroundColor}}>
        <div className="container">
          <h2 className="text-center mb-5 fw-bold text-with-shadow" style={{color: 'white'}}>
            TESTIMONI
          </h2>
          <div className="row">
            {testimonials.length === 0 ? (
              <div className="text-center text-muted">Belum ada testimoni</div>
            ) : (
              <>
                {testimonials.slice(0, 6).map((t, idx) => {
                  // Check if this is the 6th image (index 5) and there are more than 6 testimonials
                  const isLastImageWithMore = idx === 5 && testimonials.length > 6;
                  return (
                    <div className="col-6 col-md-4 mb-3 mb-md-4" key={t.id}>
                      <div className="card border-0 shadow-sm h-100" style={{cursor: 'pointer', position: 'relative', overflow: 'hidden'}} onClick={() => openTestiModal(idx)}>
                        <img 
                          src={getImageUrl(t.image_path)} 
                          alt={`testimoni-${t.id}`} 
                          className="card-img-top"
                          style={{
                            objectFit:'cover', 
                            height:'220px',
                            width: '100%'
                          }}
                          onError={(e)=>{ e.target.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23f0f0f0" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E'; }}
                        />
                        {isLastImageWithMore && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              color: 'white',
                              fontSize: 'clamp(20px, 5vw, 32px)',
                              fontWeight: 'bold',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                            }}>
                              +{testimonials.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimoni Lightbox Modal */}
      {isTestiModalOpen && testimonials[activeTestiIndex] && (
        <div 
          className="modal-backdrop"
          onClick={closeTestiModal}
          style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            backgroundColor:'rgba(0,0,0,0.85)', zIndex:1050,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}
        >
          <button 
            onClick={(e)=>{ e.stopPropagation(); prevTesti(); }}
            style={{position:'absolute', left:'20px', color:'white', background:'transparent', border:'none', fontSize:'36px', cursor:'pointer', userSelect:'none'}}
            aria-label="Sebelumnya"
          >
            ‹
          </button>
          <div
            style={{display:'flex', alignItems:'center', justifyContent:'center'}}
            onMouseDown={(e)=>{ e.preventDefault(); beginTestiDrag(e.clientX); }}
            onMouseMove={(e)=>{ moveTestiDrag(e.clientX); }}
            onMouseUp={endTestiDrag}
            onMouseLeave={endTestiDrag}
            onTouchStart={(e)=>{ const t=e.touches[0]; beginTestiDrag(t.clientX); }}
            onTouchMove={(e)=>{ const t=e.touches[0]; moveTestiDrag(t.clientX); }}
            onTouchEnd={endTestiDrag}
            onClick={(e)=> e.stopPropagation()}
          >
            <img 
              src={getImageUrl(testimonials[activeTestiIndex].image_path)}
              alt={`testi-full-${testimonials[activeTestiIndex].id}`}
              style={{maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:'8px'}}
              draggable={false}
            />
          </div>
          <button 
            onClick={(e)=>{ e.stopPropagation(); nextTesti(); }}
            style={{position:'absolute', right:'20px', color:'white', background:'transparent', border:'none', fontSize:'36px', cursor:'pointer', userSelect:'none'}}
            aria-label="Berikutnya"
          >
            ›
          </button>
          <button 
            onClick={(e)=>{ e.stopPropagation(); closeTestiModal(); }}
            style={{position:'absolute', top:'16px', right:'20px', color:'white', background:'transparent', border:'none', fontSize:'28px', cursor:'pointer'}}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      )}

      {/* Popup Modal (on load) */}
      {showPopup && popupImages && popupImages.length > 0 && (
        <div 
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}
          style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.75)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center'}}
        >
          <div className="modal-dialog" onClick={(e)=> e.stopPropagation()} style={{background:'transparent', border:'none', boxShadow:'none', width:'90%', maxWidth:'720px'}}>
            {/* Custom simple slider */}
            <div style={{textAlign:'center'}}>
              <div 
                style={{position:'relative', display:'inline-block'}}
                onMouseDown={(e)=>{ e.preventDefault(); beginDrag(e.clientX); }}
                onMouseMove={(e)=>{ moveDrag(e.clientX); }}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(e)=>{ const t=e.touches[0]; beginDrag(t.clientX); }}
                onTouchMove={(e)=>{ const t=e.touches[0]; moveDrag(t.clientX); }}
                onTouchEnd={endDrag}
              >
                <img src={getImageUrl(popupImages[popupIndex].image_path)} alt={`popup-${popupIndex}`} style={{userSelect:'none', maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', background:'transparent', borderRadius:'12px', display:'block'}} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paket Section */}
      <section id="paketSection" className="hero-section-enhanced py-5" style={{backgroundColor: backgroundColor}}>
        <div className="container">
          <h2 className="text-center mb-5 fw-bold text-with-shadow" style={{color: 'white'}}>
            PAKET
          </h2>
          <div className="row">
            {packages.length === 0 ? (
              <div className="text-center text-muted">Belum ada paket</div>
            ) : (
              packages.map((p) => (
                <div className="col-md-4 mb-4" key={p.id}>
                  <div className="card border-0 shadow-sm h-100" style={{borderRadius: '12px', overflow: 'hidden', backgroundColor: 'transparent'}}>
                    {/* Header tipe paket - tiru tampilan header dropdown PRODUK KAMI (tanpa dropdown) */}
                    <div
                      style={{
                        background: 'white',
                        color: '#6D2316',
                        borderRadius: '12px 12px 0 0',
                        padding: '10px 16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{fontSize: '18px', color: '#6D2316'}}>{p.tipe}</span>
                    </div>
                    <img
                      src={getImageUrl(p.image_path)}
                      alt={p.tipe}
                      className="card-img-top"
                      style={{objectFit:'cover', height:'220px', borderRadius: '0'}}
                      onError={(e)=>{ e.target.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23f0f0f0" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E'; }}
                    />
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex flex-column gap-3">
                        {(p.active_wa ? p.active_wa : 0) === 1 && (
                        <button
                          className="fw-bold"
                          onClick={() => handlePackageOrder(p.tipe)}
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 35%), #25D366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '9999px',
                            fontSize: '20px',
                            minHeight: '62px',
                            padding: '14px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            width: '100%',
                            maxWidth: '520px',
                            margin: '0 auto',
                            fontWeight: 'bold',
                            boxShadow: '0 8px 22px rgba(37,211,102,0.28)'
                          }}
                          onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#20BA5A'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 24px rgba(37,211,102,0.35)'; }}
                          onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(37,211,102,0.20)'; }}
                        >
                          <span style={{display:'flex', alignItems:'center', marginRight:'10px'}}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" style={{display:'block'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          </span>
                          <div style={{flex:1, textAlign:'left', lineHeight:'1.2'}}>
                            <div>Pesan via Whatsapp</div>
                            {p.subtitle_wa && (<div style={{fontSize:'14px', opacity:0.95, fontWeight:'normal', color:'rgba(255,255,255,0.95)'}}>{p.subtitle_wa}</div>)}
                          </div>
                        </button>
                        )}
                        {(p.active_shopee ? p.active_shopee : 0) === 1 && (
                        <button
                          className="fw-bold"
                          disabled={!p.link_shopee}
                          onClick={()=>openInNewTab(p.link_shopee)}
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 35%), #FF7F27',
                            color: 'white',
                            border: 'none',
                            borderRadius: '9999px',
                            fontSize: '20px',
                            minHeight: '62px',
                            padding: '14px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            width: '100%',
                            maxWidth: '520px',
                            margin: '0 auto',
                            fontWeight: 'bold',
                            boxShadow: '0 8px 22px rgba(255,127,39,0.28)'
                          }}
                          onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#FF6B00'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 24px rgba(255,127,39,0.35)'; }}
                          onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = '#FF7F27'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(255,127,39,0.20)'; }}
                        >
                          <img src="/images/logo_shopee.png" alt="Shopee" style={{width:'32px', height:'32px', objectFit:'contain', marginRight:'10px'}} />
                          <div style={{flex:1, textAlign:'left', lineHeight:'1.2'}}>
                            <div>Pesan via Shopee</div>
                            {p.subtitle_shopee && (<div style={{fontSize:'14px', opacity:0.95, fontWeight:'normal', color:'rgba(255,255,255,0.95)'}}>{p.subtitle_shopee}</div>)}
                          </div>
                        </button>
                        )}
                        {(p.active_tiktok ? p.active_tiktok : 0) === 1 && (
                        <button
                          className="fw-bold"
                          disabled={!p.link_tiktok}
                          onClick={()=>openInNewTab(p.link_tiktok)}
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 35%), #333333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '9999px',
                            fontSize: '20px',
                            minHeight: '62px',
                            padding: '14px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            width: '100%',
                            maxWidth: '520px',
                            margin: '0 auto',
                            fontWeight: 'bold',
                            boxShadow: '0 8px 22px rgba(0,0,0,0.28)'
                          }}
                          onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 24px rgba(0,0,0,0.35)'; }}
                          onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.20)'; }}
                        >
                          <img src="/images/logo_tiktok.png" alt="Tiktok" style={{width:'28px', height:'28px', objectFit:'contain', marginRight:'10px'}} />
                          <div style={{flex:1, textAlign:'left', lineHeight:'1.2'}}>
                            <div>Pesan via Tiktokshop</div>
                            {p.subtitle_tiktok && (<div style={{fontSize:'14px', opacity:0.95, fontWeight:'normal', color:'rgba(255,255,255,0.95)'}}>{p.subtitle_tiktok}</div>)}
                          </div>
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Detail Produk Modal */}
      {showDetailModal && (
        <div 
          className="modal-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1040,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="modal-dialog" 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              maxHeight: '90vh'
            }}>
              <div 
                className="modal-header" 
                style={{
                  backgroundColor: 'white',
                  color: '#6D2316',
                  padding: '15px 20px',
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}
              >
                <h5 className="modal-title fw-bold mb-0" style={{color: '#6D2316'}}>
                  Detail Produk - {selectedProduct?.nama_produk}
                </h5>
              </div>
              <div 
                className="modal-body" 
                style={{
                  padding: '20px',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0
                }}
              >
                {productDetails.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">Belum ada detail produk untuk produk ini.</p>
                  </div>
                ) : (
              <div className="row">
                    {productDetails.map((detail, index) => (
                      <div key={detail.id || index} className="col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100">
                          <img
                            src={getImageUrl(detail.gambar)}
                            alt={`Detail ${index + 1}`}
                            className="card-img-top"
                            style={{
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: '8px 8px 0 0'
                            }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f0f0f0" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="card-body">
                            {detail.keterangan && (
                              <p className="card-text">{detail.keterangan}</p>
                            )}
                    </div>
                  </div>
                </div>
                    ))}
                    </div>
                )}
                  </div>
              <div 
                className="modal-footer" 
                style={{
                  padding: '15px 20px',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  flexShrink: 0,
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: 'white',
                  zIndex: 1
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                >
                  Tutup
                </button>
                </div>
              </div>
            </div>
          </div>
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

export default LandingPage;