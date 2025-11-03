import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress benign Chrome ResizeObserver errors that can appear during rapid layout changes
// We stop them early in capture phase and also silence React error overlay in dev
const shouldIgnoreROError = (message) => typeof message === 'string' && (
  message.includes('ResizeObserver loop completed with undelivered notifications') ||
  message.includes('ResizeObserver loop limit exceeded')
);

const onGlobalErrorCapture = (event) => {
  const message = event?.message || event?.reason?.message || '';
  if (shouldIgnoreROError(message)) {
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    return false;
  }
};
window.addEventListener('error', onGlobalErrorCapture, true);
window.addEventListener('unhandledrejection', onGlobalErrorCapture, true);

// Patch React error overlay hook (Create React App) in development
if (process.env.NODE_ENV !== 'production') {
  const overlay = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__;
  if (overlay) {
    overlay.onUnhandledError = () => {};
    overlay.onError = () => {};
  }
}

// Silence console.error for this specific message
const originalConsoleError = console.error;
console.error = function(...args) {
  const msg = (args && args[0] && args[0].toString && args[0].toString()) || '';
  if (shouldIgnoreROError(msg)) return;
  return originalConsoleError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
