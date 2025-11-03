import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';

const Reseller = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', wa: '', city: '', address: '' });
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionSuggestions, setRegionSuggestions] = useState([]);
  const [showRegionSuggest, setShowRegionSuggest] = useState(false);
  const nominatimTimerRef = useRef(null);
  // Nomor admin WhatsApp yang dipilih secara random sekali per sesi/halaman
  const [selectedAdminWaNumber, setSelectedAdminWaNumber] = useState(null);
  // State untuk template dari API
  const [resellerTemplate, setResellerTemplate] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Fetch WhatsApp numbers and templates from API
  useEffect(() => {
    const fetchWhatsappData = async () => {
      try {
        // Fetch active WhatsApp numbers for "reseller" button (DAFTAR SEKARANG)
        const numbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=reseller');
        const activeNumbers = numbersRes.data.map(n => n.phone_number);
        
        // Select random number once
        if (activeNumbers.length > 0 && selectedAdminWaNumber === null) {
          const randomIndex = Math.floor(Math.random() * activeNumbers.length);
          setSelectedAdminWaNumber(activeNumbers[randomIndex]);
        }
        
        // Fetch templates
        const templatesRes = await apiClient.get('/api/whatsapp/templates');
        const templates = templatesRes.data;
        const resellerTpl = templates.find(t => t.template_type === 'reseller');
        if (resellerTpl) setResellerTemplate(resellerTpl.template_format);
      } catch (e) {
        console.error('Error fetching WhatsApp data:', e);
        // No fallback - data must come from database
      }
    };
    fetchWhatsappData();
  }, [selectedAdminWaNumber]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;
      const input = document.getElementById('reseller-city');
      if (input && input.contains(target)) return;
      setShowRegionSuggest(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const buildNominatimLabel = (item) => {
    const a = item.address || {};
    const ordered = [
      a.state || a.region || a.state_district,
      a.county, a.city, a.town, a.municipality, a.city_district,
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
    const q = (form.city || '').trim().toLowerCase();
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
        setRegionSuggestions([]);
        setShowRegionSuggest(true);
      } finally {
        setRegionLoading(false);
      }
    }, 300);
  }, [form.city]);

  const buildResellerMessage = () => {
    // MUST use template from database only - no hardcode fallback
    if (!resellerTemplate || resellerTemplate.trim() === '') {
      console.error('Reseller template not found in database');
      return '';
    }
    
    let message = resellerTemplate;
    
    // Replace placeholders
    message = message.replace(/\{\{nama\}\}/g, form.name || '');
    message = message.replace(/\{\{wa\}\}/g, form.wa || '');
    message = message.replace(/\{\{kota\}\}/g, form.city || '');
    message = message.replace(/\{\{alamat\}\}/g, form.address || '');
    
    return message;
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!form.name || !form.name.trim()) {
      setAlertMessage('Harap lengkapi semua data formulir');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!form.wa || !form.wa.trim()) {
      setAlertMessage('Harap lengkapi semua data formulir');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!form.city || !form.city.trim()) {
      setAlertMessage('Harap lengkapi semua data formulir');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!form.address || !form.address.trim()) {
      setAlertMessage('Harap lengkapi semua data formulir');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Validate template exists
    if (!resellerTemplate || resellerTemplate.trim() === '') {
      setAlertMessage('Format pesan belum dikonfigurasi. Silakan hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    // All validations passed, proceed with reseller registration
    // Fetch reseller numbers from database - MUST use database only, no hardcode
    try {
      const resellerNumbersRes = await apiClient.get('/api/whatsapp/numbers/active?button_type=reseller');
      const resellerNumbers = resellerNumbersRes.data.map(n => n.phone_number);
      if (resellerNumbers.length > 0) {
        // Use the already selected number if it's in the reseller list, otherwise pick random
        let adminWaNumber = selectedAdminWaNumber;
        if (!adminWaNumber || !resellerNumbers.includes(adminWaNumber)) {
          const randomIndex = Math.floor(Math.random() * resellerNumbers.length);
          adminWaNumber = resellerNumbers[randomIndex];
        }
        const text = encodeURIComponent(buildResellerMessage());
        if (!text || text.trim() === '') {
          setAlertMessage('Gagal membuat pesan. Silakan hubungi administrator.');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
          return;
        }
        // Save reseller data to database
        try {
          await apiClient.post('/api/resellers', {
            nama: form.name.trim(),
            whatsapp: form.wa.trim(),
            kota: form.city.trim(),
            alamat: form.address.trim()
          });
          console.log('✅ Reseller data saved to database');
        } catch (saveError) {
          console.error('Error saving reseller data:', saveError);
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
        setAlertMessage('Tidak ada nomor WhatsApp yang dikonfigurasi untuk tombol DAFTAR SEKARANG. Silakan hubungi administrator.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
        return;
      }
    } catch (e) {
      console.error('Error fetching reseller numbers:', e);
      setAlertMessage('Gagal memuat nomor WhatsApp. Silakan coba lagi atau hubungi administrator.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }
  };

  return (
    <div className="food-theme-bg dimsum-pattern" style={{minHeight: '100vh'}}>
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
        <div className="card border-0 shadow-sm" style={{borderRadius:'14px', overflow:'hidden'}}>
          <div className="p-3" style={{backgroundColor:'white', color:'#6D2316', fontWeight:'bold', border:'2px solid #6D2316', borderTopLeftRadius:'14px', borderTopRightRadius:'14px', textAlign:'center'}}>
            Daftar Reseller
          </div>
          <div className="p-4" style={{backgroundColor:'#fff', borderLeft:'2px solid #6D2316', borderRight:'2px solid #6D2316', borderBottom:'2px solid #6D2316', borderBottomLeftRadius:'14px', borderBottomRightRadius:'14px'}}>
            <div className="d-flex justify-content-center mb-3">
              <img 
                src="/images/logo_reseller.png" 
                alt="Reseller" 
                style={{width:'240px', height:'auto', borderRadius:'0', objectFit:'contain', boxShadow:'none'}}
              />
            </div>
            <p className="mb-0">Silahkan lengkapi formulir di bawah ini, kemudian klik tombol “DAFTAR SEKARANG”. Tim kami akan mengirimkan informasi syarat dan ketentuan untuk menjadi Reseller melalui WhatsApp. Pastikan nomor WhatsApp yang Anda isi aktif dan benar, ya!</p>
          </div>
        </div>

        {/* Formulir Daftar Reseller */}
        <div className="card border-0 shadow-sm mt-3" style={{borderRadius:'14px', overflow:'hidden'}}>
          <div className="p-3" style={{backgroundColor:'white', color:'#6D2316', fontWeight:'bold', border:'2px solid #6D2316', borderTopLeftRadius:'14px', borderTopRightRadius:'14px', textAlign:'center'}}>
            Formulir Daftar Reseller
          </div>
          <div className="p-4" style={{backgroundColor:'#fff', borderLeft:'2px solid #6D2316', borderRight:'2px solid #6D2316', borderBottom:'2px solid #6D2316', borderBottomLeftRadius:'14px', borderBottomRightRadius:'14px'}}>
            <form onSubmit={(e)=>e.preventDefault()}>
              <div className="mb-3">
                <label className="form-label" htmlFor="reseller-name" style={{fontWeight:600, color:'#6d2316'}}>Nama</label>
                <input id="reseller-name" type="text" className="form-control" placeholder="Masukkan Nama" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reseller-wa" style={{fontWeight:600, color:'#6d2316'}}>No. Whatsapp</label>
                <input id="reseller-wa" type="tel" className="form-control" placeholder="Contoh: 62812xxxxxxx" value={form.wa} onChange={(e)=>setForm({...form, wa: e.target.value})} />
              </div>
              <div className="mb-3 position-relative">
                <label className="form-label" htmlFor="reseller-city" style={{fontWeight:600, color:'#6d2316'}}>Masukkan Kota / Kecamatan</label>
                <input
                  id="reseller-city"
                  type="text"
                  className="form-control"
                  placeholder="Kota / Kecamatan"
                  value={form.city}
                  onChange={(e)=>setForm({...form, city: e.target.value})}
                  onFocus={()=>{ if ((form.city||'').length>=3) setShowRegionSuggest(true); }}
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
                        onClick={() => { setForm({...form, city: s.value}); setShowRegionSuggest(false); }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="reseller-address" style={{fontWeight:600, color:'#6d2316'}}>Alamat Lengkap</label>
                <textarea id="reseller-address" className="form-control" rows="3" placeholder="Tulis alamat lengkap pengiriman" value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})}></textarea>
              </div>
              <div className="d-grid">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn btn-lg"
                  style={{
                    backgroundColor:'#6d2316', color:'#fff', border:'none', borderRadius:'9999px',
                    padding:'12px 18px', fontWeight:'bold', boxShadow:'0 8px 22px rgba(109,35,22,0.28)'
                  }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor = '#8b2e1d'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor = '#6d2316'; }}
                >
                  DAFTAR SEKARANG
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
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

export default Reseller;


