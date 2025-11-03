import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6d2316';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const titleColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6d2316';

  return (
    <div 
      className="toast-notification"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        zIndex: 9999,
        minWidth: '350px',
        maxWidth: '500px',
        animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: `4px solid ${bgColor}`
      }}
    >
      <div className="d-flex align-items-center">
        <div 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: bgColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            marginRight: '15px',
            flexShrink: 0
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '600', 
            color: titleColor,
            marginBottom: '4px',
            fontSize: '16px'
          }}>
            {type === 'success' ? 'Berhasil!' : type === 'error' ? 'Error!' : 'Info'}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {message}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#999',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '15px',
            lineHeight: '1',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#333'}
          onMouseLeave={(e) => e.target.style.color = '#999'}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {/* Backdrop */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => toasts.forEach(toast => removeToast(toast.id))}
        />
      )}
      
      {/* Toast Messages */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration || 3000}
        />
      ))}
    </>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
};

