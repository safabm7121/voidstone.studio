import React, { useState, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Menu, MenuItem, Avatar, Drawer, List,
  ListItem, ListItemText, ListItemIcon, Badge, Divider, useTheme
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LanguageIcon from '@mui/icons-material/Language';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  
  // Refs for menu anchoring
  const userMenuAnchorRef = useRef<HTMLDivElement>(null);
  const langMenuAnchorRef = useRef<HTMLButtonElement>(null);
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleUserMenuOpen = () => {
    setUserMenuOpen(true);
  };

  const handleUserMenuClose = () => {
    setUserMenuOpen(false);
  };

  const handleLangMenuOpen = () => {
    setLangMenuOpen(true);
  };

  const handleLangMenuClose = () => {
    setLangMenuOpen(false);
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    handleLangMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const menuItems = [
    { text: t('nav.home'), icon: <HomeIcon />, path: '/', public: true },
    { text: t('nav.products'), icon: <ShoppingBagIcon />, path: '/products', public: true },
    { text: t('nav.about'), icon: <InfoIcon />, path: '/about', public: true },
    { text: t('nav.contact'), icon: <ContactMailIcon />, path: '/contact', public: true },
  ];

  const appointmentItems = [
    { text: 'Book Appointment', icon: <BookOnlineIcon />, path: '/book-appointment', roles: ['client', 'designer', 'admin'] },
    { text: 'My Appointments', icon: <CalendarTodayIcon />, path: '/appointments', roles: ['client', 'designer', 'admin'] },
  ];

  const adminItems = [
    { text: 'Admin Dashboard', icon: <AdminPanelSettingsIcon />, path: '/admin/appointments', roles: ['admin'] },
    { text: t('nav.createProduct'), icon: <AddIcon />, path: '/create-product', roles: ['admin', 'manager', 'designer'] },
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isRtl = i18n.language === 'ar';

  const drawer = (
    <Box
      onClick={() => setMobileOpen(false)}
      sx={{
        width: { xs: '85vw', sm: 280 },
        maxWidth: 280,
        textAlign: isRtl ? 'right' : 'left',
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}>
        VOIDSTONE
      </Typography>
      <List>
        {menuItems.map(item => (
          <ListItem 
            key={item.text} 
            component={Link} 
            to={item.path} 
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: 'text.primary' }} />
          </ListItem>
        ))}
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', display: 'block' }}>
              Appointments
            </Typography>
            {appointmentItems.map(item => (
              <ListItem 
                key={item.text} 
                component={Link} 
                to={item.path} 
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ color: 'text.primary' }} />
              </ListItem>
            ))}
          </>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', display: 'block' }}>
              Admin
            </Typography>
            {adminItems.map(item => (
              <ListItem 
                key={item.text} 
                component={Link} 
                to={item.path} 
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ color: 'text.primary' }} />
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          width: '100%',
          left: 0,
          right: 0,
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          px: { xs: 1, sm: 2, md: 3 }
        }}>
          {/* Left section - Mobile menu and logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: isRtl ? '0 1 auto' : '1 1 auto',
          }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ 
                display: { sm: 'none' }, 
                mr: isRtl ? 0 : 2,
                ml: isRtl ? 2 : 0,
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                letterSpacing: 2,
                fontSize: { xs: '0.9rem', sm: '1.25rem' },
                whiteSpace: 'nowrap',
              }}
            >
              VOIDSTONE STUDIO
            </Typography>
          </Box>

          {/* Center section - Desktop menu */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1,
            flex: '0 1 auto',
          }}>
            {menuItems.map(item => (
              <Button 
                key={item.text} 
                component={Link} 
                to={item.path} 
                color="inherit"
                sx={{ 
                  whiteSpace: 'nowrap',
                  fontSize: '0.9rem',
                }}
              >
                {item.text}
              </Button>
            ))}
            {isAuthenticated && (
              <>
                <Button 
                  component={Link} 
                  to="/book-appointment" 
                  color="inherit" 
                  startIcon={<BookOnlineIcon />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Book
                </Button>
                <Button 
                  component={Link} 
                  to="/appointments" 
                  color="inherit" 
                  startIcon={<CalendarTodayIcon />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  My Appointments
                </Button>
              </>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Button 
                  component={Link} 
                  to="/create-product" 
                  color="inherit" 
                  startIcon={<AddIcon />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Create Product
                </Button>
                <Button 
                  component={Link} 
                  to="/admin/appointments" 
                  color="inherit" 
                  startIcon={<AdminPanelSettingsIcon />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Admin
                </Button>
              </>
            )}
          </Box>

          {/* Right section - Actions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            flex: isRtl ? '1 1 auto' : '0 1 auto',
            justifyContent: 'flex-end',
          }}>
            {/* Language Button with Ref */}
            <IconButton 
              ref={langMenuAnchorRef}
              onClick={handleLangMenuOpen} 
              color="inherit"
              size="small"
              sx={{ 
                p: { xs: 0.5, sm: 1 },
              }}
            >
              <LanguageIcon fontSize="small" />
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 0.5, 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.875rem',
                }}
              >
                {currentLang.flag}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'block', sm: 'none' },
                  fontSize: '0.875rem',
                }}
              >
                {currentLang.flag}
              </Typography>
            </IconButton>
            
            {/* Language Menu - Anchored directly to the button */}
            <Menu
              anchorEl={langMenuAnchorRef.current}
              open={langMenuOpen}
              onClose={handleLangMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: isRtl ? 'right' : 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: isRtl ? 'right' : 'left',
              }}
              PaperProps={{
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  boxShadow: theme.shadows[3],
                  '& .MuiMenuItem-root': {
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    },
                  },
                },
              }}
            >
              {languages.map(lang => (
                <MenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  selected={i18n.language === lang.code}
                  sx={{ 
                    direction: lang.dir, 
                    textAlign: lang.code === 'ar' ? 'right' : 'left',
                    minWidth: 120,
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
              <Box ref={userMenuAnchorRef} sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  component={Link} 
                  to="/cart" 
                  color="inherit"
                  size="small"
                  sx={{ mr: { xs: 0.5, sm: 1 } }}
                >
                  <Badge 
                    badgeContent={cartCount} 
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      }
                    }}
                  >
                    <ShoppingCartIcon fontSize="small" />
                  </Badge>
                </IconButton>
                <IconButton 
                  onClick={handleUserMenuOpen} 
                  color="inherit"
                  sx={{
                    p: 0.5,
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                </IconButton>
                
                {/* User Menu - Anchored to the container div */}
                <Menu
                  anchorEl={userMenuAnchorRef.current}
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: isRtl ? 'left' : 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: isRtl ? 'left' : 'right',
                  }}
                  PaperProps={{
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: theme.shadows[3],
                      '& .MuiMenuItem-root': {
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      },
                    },
                  }}
                >
                  <MenuItem disabled sx={{ opacity: 0.7 }}>
                    <Typography variant="body2" color="text.primary">
                      {t('nav.hello')}, {user?.firstName}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>Profile</MenuItem>
                  <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button 
                  component={Link} 
                  to="/login" 
                  color="inherit" 
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 1.5 },
                  }}
                >
                  {t('nav.login')}
                </Button>
                <Button 
                  component={Link} 
                  to="/register" 
                  color="inherit" 
                  variant="outlined" 
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    px: { xs: 1, sm: 1.5 },
                    borderColor: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  {t('nav.register')}
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor={isRtl ? 'right' : 'left'}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '85vw', sm: 280 },
            maxWidth: 280,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;