import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Menu, MenuItem, Avatar, Drawer, List,
  ListItem, ListItemText, ListItemIcon, Badge
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  
  const handleLangMenu = (event: React.MouseEvent<HTMLElement>) => setLangAnchorEl(event.currentTarget);
  const handleLangClose = () => setLangAnchorEl(null);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    document.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    handleLangClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const menuItems = [
    { text: t('nav.home'), icon: <HomeIcon />, path: '/', public: true },
    { text: t('nav.products'), icon: <ShoppingBagIcon />, path: '/products', public: true },
    { text: t('nav.about'), icon: <InfoIcon />, path: '/about', public: true },
    { text: t('nav.contact'), icon: <ContactMailIcon />, path: '/contact', public: true },
  ];

  const adminItems = [
    { text: t('nav.createProduct'), icon: <DashboardIcon />, path: '/create-product', roles: ['admin', 'manager', 'designer'] },
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  const drawer = (
    <Box onClick={() => setMobileOpen(false)} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold' }}>
        VOIDSTONE
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {isAuthenticated && user?.role === 'admin' && adminItems.map((item) => (
          <ListItem key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold', letterSpacing: 2 }}>
            VOIDSTONE STUDIO
          </Typography>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {menuItems.map((item) => (
              <Button key={item.text} component={Link} to={item.path} color="inherit">
                {item.text}
              </Button>
            ))}
            {isAuthenticated && user?.role === 'admin' && adminItems.map((item) => (
              <Button key={item.text} component={Link} to={item.path} color="inherit">
                {item.text}
              </Button>
            ))}
          </Box>
          
          {/* Language Switcher */}
          <IconButton
            onClick={handleLangMenu}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <LanguageIcon />
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              {currentLang.flag}
            </Typography>
          </IconButton>
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLangClose}
          >
            {languages.map((lang) => (
              <MenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                selected={i18n.language === lang.code}
                sx={{
                  direction: lang.dir,
                  textAlign: lang.code === 'ar' ? 'right' : 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Menu>
          
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Cart Icon */}
              <IconButton
                component={Link}
                to="/cart"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={cartCount} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              {/* User Menu */}
              <IconButton onClick={handleMenu} color="inherit">
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem disabled>{t('nav.hello')}, {user?.firstName}</MenuItem>
                <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button component={Link} to="/login" color="inherit">{t('nav.login')}</Button>
              <Button component={Link} to="/register" color="inherit" variant="outlined">{t('nav.register')}</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' } }}>
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;