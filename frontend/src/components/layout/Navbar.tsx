import React, { useState, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Menu, MenuItem, Avatar, Drawer, List,
  ListItem, ListItemText, ListItemIcon, Badge, Divider, Container
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
  { code: 'ar', name: 'العربية', flag: '🇹🇳', dir: 'rtl' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
];

const Navbar: React.FC = () => {
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

  // Enhanced responsive text helper with more granular breakpoints
  const getResponsiveText = (fullText: string, shortText: string, mediumText?: string) => {
    if (mediumText) {
      return (
        <>
          <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>
            {fullText}
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline', lg: 'none' } }}>
            {mediumText}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
            {shortText}
          </Box>
        </>
      );
    }
    
    return (
      <>
        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
          {fullText}
        </Box>
        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
          {shortText}
        </Box>
      </>
    );
  };

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
              {t('nav.appointments')}
            </Typography>
            <ListItem 
              component={Link} 
              to="/book-appointment" 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>
                <BookOnlineIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.bookAppointment')} sx={{ color: 'text.primary' }} />
            </ListItem>
            <ListItem 
              component={Link} 
              to="/appointments" 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.myAppointments')} sx={{ color: 'text.primary' }} />
            </ListItem>
          </>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', display: 'block' }}>
              {t('nav.admin')}
            </Typography>
            <ListItem 
              component={Link} 
              to="/admin/appointments" 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.adminDashboard')} sx={{ color: 'text.primary' }} />
            </ListItem>
            <ListItem 
              component={Link} 
              to="/create-product" 
              sx={{ 
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ color: 'text.primary', minWidth: 40 }}>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.createProduct')} sx={{ color: 'text.primary' }} />
            </ListItem>
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
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 2, lg: 3 } }}>
          <Toolbar disableGutters sx={{ 
            minHeight: { xs: 56, sm: 60, md: 64, lg: 70 },
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}>
            {/* Left section - Mobile menu and logo */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flex: '0 1 auto',
              minWidth: { xs: 'auto', sm: 140, md: 160 },
            }}>
              <IconButton
                color="inherit"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ 
                  display: { lg: 'none' }, 
                  mr: 0.5,
                  p: { xs: 0.5, sm: 0.75 },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>

              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold',
                  letterSpacing: { xs: 1, sm: 1.5, md: 2 },
                  fontSize: { 
                    xs: '0.85rem', 
                    sm: '1rem', 
                    md: '1.1rem', 
                    lg: '1.25rem' 
                  },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 100, sm: 150, md: 180, lg: 'none' },
                }}
              >
                {t('nav.brand')}
              </Typography>
            </Box>

            {/* Center section - Desktop menu with multiple breakpoints */}
            <Box sx={{ 
              display: { xs: 'none', lg: 'flex' }, 
              alignItems: 'center', 
              gap: { lg: 0.5, xl: 1 },
              flex: '0 1 auto',
              mx: 1,
            }}>
              {menuItems.map(item => (
                <Button 
                  key={item.text} 
                  component={Link} 
                  to={item.path} 
                  color="inherit"
                  sx={{ 
                    whiteSpace: 'nowrap',
                    fontSize: { lg: '0.85rem', xl: '0.9rem' },
                    px: { lg: 0.75, xl: 1 },
                    minWidth: 'auto',
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
                    sx={{ 
                      fontSize: { lg: '0.85rem', xl: '0.9rem' },
                      px: { lg: 0.75, xl: 1 },
                      minWidth: 'auto',
                    }}
                  >
                    {getResponsiveText(t('nav.bookAppointment'), t('nav.book'), t('nav.book'))}
                  </Button>
                  <Button 
                    component={Link} 
                    to="/appointments" 
                    color="inherit"
                    sx={{ 
                      fontSize: { lg: '0.85rem', xl: '0.9rem' },
                      px: { lg: 0.75, xl: 1 },
                      minWidth: 'auto',
                    }}
                  >
                    {getResponsiveText(t('nav.myAppointments'), t('nav.appts'), t('nav.myAppts'))}
                  </Button>
                </>
              )}
              
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  <Button 
                    component={Link} 
                    to="/create-product" 
                    color="inherit"
                    sx={{ 
                      fontSize: { lg: '0.85rem', xl: '0.9rem' },
                      px: { lg: 0.75, xl: 1 },
                      minWidth: 'auto',
                    }}
                  >
                    {getResponsiveText(t('nav.createProduct'), t('nav.create'), t('nav.create'))}
                  </Button>
                  <Button 
                    component={Link} 
                    to="/admin/appointments" 
                    color="inherit"
                    sx={{ 
                      fontSize: { lg: '0.85rem', xl: '0.9rem' },
                      px: { lg: 0.75, xl: 1 },
                      minWidth: 'auto',
                    }}
                  >
                    {getResponsiveText(t('nav.adminDashboard'), t('nav.admin'), t('nav.admin'))}
                  </Button>
                </>
              )}
            </Box>

            {/* Tablet/Mobile Menu - Shown on medium screens */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex', lg: 'none' }, 
              alignItems: 'center', 
              gap: 0.5,
              flex: '0 1 auto',
              mx: 1,
            }}>
              {menuItems.map(item => (
                <Button 
                  key={item.text} 
                  component={Link} 
                  to={item.path} 
                  color="inherit"
                  sx={{ 
                    whiteSpace: 'nowrap',
                    fontSize: '0.8rem',
                    px: 0.5,
                    minWidth: 'auto',
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
                    sx={{ fontSize: '0.8rem', px: 0.5, minWidth: 'auto' }}
                  >
                    {t('nav.book')}
                  </Button>
                  <Button 
                    component={Link} 
                    to="/appointments" 
                    color="inherit"
                    sx={{ fontSize: '0.8rem', px: 0.5, minWidth: 'auto' }}
                  >
                    {t('nav.appts')}
                  </Button>
                </>
              )}
              
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  <Button 
                    component={Link} 
                    to="/create-product" 
                    color="inherit"
                    sx={{ fontSize: '0.8rem', px: 0.5, minWidth: 'auto' }}
                  >
                    {t('nav.create')}
                  </Button>
                  <Button 
                    component={Link} 
                    to="/admin/appointments" 
                    color="inherit"
                    sx={{ fontSize: '0.8rem', px: 0.5, minWidth: 'auto' }}
                  >
                    {t('nav.admin')}
                  </Button>
                </>
              )}
            </Box>

            {/* Right section - Actions */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.25, sm: 0.5, md: 0.75, lg: 1 },
              flex: '0 1 auto',
              justifyContent: 'flex-end',
              minWidth: { xs: 'auto', sm: 100, md: 120 },
            }}>
              {/* Language Button */}
              <IconButton 
                ref={langMenuAnchorRef}
                onClick={handleLangMenuOpen} 
                color="inherit"
                size="small"
                sx={{ p: { xs: 0.5, sm: 0.75 } }}
              >
                <LanguageIcon fontSize="small" />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 0.25, 
                    display: { xs: 'none', sm: 'inline' },
                    fontSize: { sm: '0.75rem', md: '0.8rem' },
                  }}
                >
                  {currentLang.flag}
                </Typography>
              </IconButton>
              
              {/* Language Menu */}
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
              >
                {languages.map(lang => (
                  <MenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    selected={i18n.language === lang.code}
                    sx={{ minWidth: 100 }}
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
                    sx={{ p: { xs: 0.5, sm: 0.75 }, mr: 0.25 }}
                  >
                    <Badge 
                      badgeContent={cartCount} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          height: { xs: 16, sm: 18 },
                          minWidth: { xs: 16, sm: 18 },
                        }
                      }}
                    >
                      <ShoppingCartIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                  
                  <IconButton 
                    onClick={handleUserMenuOpen} 
                    color="inherit"
                    sx={{ p: 0.25 }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: { xs: 28, sm: 32, md: 34 },
                        height: { xs: 28, sm: 32, md: 34 },
                        fontSize: { xs: '0.8rem', sm: '0.9rem', md: '0.95rem' },
                      }}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Avatar>
                  </IconButton>
                  
                  {/* User Menu */}
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
                  >
                    <MenuItem disabled>
                      <Typography variant="body2">
                        {t('nav.hello')}, {user?.firstName}
                      </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
                      {t('nav.profile')}
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      {t('nav.logout')}
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  <Button 
                    component={Link} 
                    to="/login" 
                    color="inherit" 
                    size="small"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                      px: { xs: 0.5, sm: 0.75, md: 1 },
                      py: { xs: 0.25, sm: 0.35 },
                      minWidth: 'auto',
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
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                      px: { xs: 0.5, sm: 0.75, md: 1 },
                      py: { xs: 0.25, sm: 0.35 },
                      minWidth: 'auto',
                      borderColor: 'text.primary',
                    }}
                  >
                    {t('nav.register')}
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor={isRtl ? 'right' : 'left'}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
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