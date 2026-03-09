import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
const Footer: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>VOIDSTONE STUDIO</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('footer.description')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>{t('footer.quickLinks')}</Typography>
            <Link href="/products" color="inherit" display="block">{t('nav.products')}</Link>
            <Link href="/about" color="inherit" display="block">{t('nav.about')}</Link>
            <Link href="/contact" color="inherit" display="block">{t('nav.contact')}</Link>
          </Grid>
          <Grid item xs={12} sm={4}>
          
                <Box display="flex" alignItems="center" mb={2}>
                  <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography>voidstonestudio@gmail.com</Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography>+21620077223</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <LocationOnIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography>Tunis, Tunisia</Typography>
                </Box>              
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Voidstone Studio. {t('footer.rights')}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;