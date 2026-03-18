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

// Import User type from AuthContext
import { User } from './context/AuthContext';

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

// Pre-validate token before React renders
const initializeApp = async (): Promise<{ token: string | null; user: User | null }> => {
  const token = localStorage.getItem('token');
  let initialUser = null;
  
  if (token) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        initialUser = await response.json();
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  }
  
  return { token, user: initialUser };
};

// Initialize then render
initializeApp().then(({ token, user }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App initialToken={token} initialUser={user} />
    </React.StrictMode>
  );
});