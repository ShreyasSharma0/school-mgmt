import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            background: '#fff',
            color: '#1a1a2e',
            border: '1px solid rgba(207,236,243,0.8)',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(249,178,215,0.2)',
          },
          success: { iconTheme: { primary: '#8edba0', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e87ab8', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
