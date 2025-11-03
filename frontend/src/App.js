import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

// Components
import Login from './components/login';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import Pesan from './components/Pesan';
import Reseller from './components/Reseller';

function MainApp() {
  // Initialize user from localStorage immediately
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [products, setProducts] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in and verify with backend
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Optional: Verify token with backend if needed
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setCheckingAuth(false);
    fetchProducts();
    fetchCarousel();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarousel = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/carousel');
      setCarouselImages(response.data);
    } catch (error) {
      console.error('Error fetching carousel:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="App">
      {/* Navigation - only when logged in */}
      {user ? (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{backgroundColor: '#6d2316'}}>
          <div className="container">
            <span className="navbar-brand fw-bold">ENAKHO FROZEN FOOD</span>

            {/* Mobile: Offcanvas toggler */}
            <button
              className="navbar-toggler d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileMenu"
              aria-controls="mobileMenu"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Desktop: inline buttons */}
            <div className="d-none d-lg-flex ms-auto gap-2">
              <button 
                className="btn navbar-header-btn-outline btn-sm"
                onClick={() => navigate('/')}
              >
                View Landing Page
              </button>
              <button 
                className="btn navbar-header-btn-outline btn-sm"
                onClick={() => navigate('/admin')}
              >
                Admin Panel
              </button>
              <button 
                className="btn navbar-header-btn-white btn-sm"
                onClick={handleLogout}
              >
                Logout ({user.username || user.user || ''})
              </button>
            </div>
          </div>
        </nav>
      ) : null}

      {/* Offcanvas mobile menu (only when logged in) */}
      {user ? (
        <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="mobileMenu" aria-labelledby="mobileMenuLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mobileMenuLabel">Menu</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <div className="d-flex flex-column gap-2">
              <button 
                className="btn mobile-menu-btn-outline btn-sm"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate('/')}
              >
                View Landing Page
              </button>
              <button 
                className="btn mobile-menu-btn-outline btn-sm"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate('/admin')}
              >
                Admin Panel
              </button>
              <button 
                className="btn mobile-menu-btn-primary btn-sm"
                data-bs-dismiss="offcanvas"
                onClick={handleLogout}
              >
                Logout ({user.username || user.user || ''})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Content via routes */}
      {!checkingAuth && (
        <Routes>
          <Route path="/" element={<LandingPage products={products} loading={loading} carouselImages={carouselImages} />} />
          <Route path="/pesan" element={<Pesan />} />
          <Route path="/reseller" element={<Reseller />} />
          <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/admin" element={user ? (
            <AdminPanel products={products} onUpdate={() => { fetchProducts(); fetchCarousel(); }} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      {checkingAuth && (
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;