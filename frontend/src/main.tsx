import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n' // Add this line
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles/animation.css'

const savedLang = localStorage.getItem('language');
if (savedLang === 'ar') {
  document.dir = 'rtl';
} else {
  document.dir = 'ltr';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)