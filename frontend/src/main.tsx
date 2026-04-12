import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

export type ViewMode = 'dashboard' | 'transactions' | 'analytics';
export type ThemeMode = 'dark' | 'light';
export type DateRange = '7d' | '30d' | '90d' | 'all';