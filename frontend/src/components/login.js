import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (response.data.success) {
        onLogin(response.data.user);
      }
    } catch (error) {
      setError('Login gagal. Periksa username dan password.');
    }
  };

  return (
    <div className="food-theme-bg dimsum-pattern" style={{minHeight: '100vh', paddingTop: '80px', paddingBottom: '80px'}}>
      <div className="container">
        <div className="row justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 160px)'}}>
          <div className="col-md-5">
            <div className="text-center mb-4">
              <img src="/images/logo_enakho.jpg" alt="ENAKHO" style={{height: '80px'}} className="mb-3 hero-logo" />
              <h2 className="fw-bold text-with-shadow" style={{color: 'white'}}>
                Admin Login
              </h2>
            </div>
            <div className="card shadow-lg border-0" style={{borderRadius: '15px'}}>
              <div className="card-body p-4">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold" style={{color: '#6d2316'}}>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                      style={{borderRadius: '8px'}}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold" style={{color: '#6d2316'}}>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      style={{borderRadius: '8px'}}
                    />
                  </div>
                  <button type="submit" className="btn btn-login-custom w-100 fw-bold" style={{borderRadius: '8px', padding: '12px'}}>
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;