import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

// Font imports
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Set initial direction based on saved language
const savedLang = localStorage.getItem('language');
if (savedLang === 'ar') {
  document.dir = 'rtl';
  document.documentElement.classList.add('rtl');
  document.documentElement.classList.remove('ltr');
} else {
  document.dir = 'ltr';
  document.documentElement.classList.add('ltr');
  document.documentElement.classList.remove('rtl');
}

// Set initial theme
const savedTheme = localStorage.getItem('themeMode');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.setAttribute('data-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);