import React, { useState } from 'react';
import { Container, Typography, Paper, TextField, Button, Box, Grid, Alert, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Send email using your auth-service
      await axios.post('http://localhost:3001/api/contact/send', {
        name: formData.name,
        email: formData.email,
        message: formData.message
      });
      
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h4" gutterBottom>{t('contact.getInTouch')}</Typography>
              <Typography variant="body1" paragraph>
                {t('contact.message')}
              </Typography>
              <Box sx={{ mt: 4 }}>
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
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>{t('contact.sendMessage')}</Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {submitted && <Alert severity="success" sx={{ mb: 2 }}>{t('contact.success')}</Alert>}
              
              <Box component="form" onSubmit={handleSubmit}>
                <TextField 
                  fullWidth 
                  name="name" 
                  label={t('contact.name')} 
                  value={formData.name} 
                  onChange={handleChange} 
                  margin="normal" 
                  required 
                  disabled={loading}
                />
                <TextField 
                  fullWidth 
                  name="email" 
                  label={t('contact.email')} 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  margin="normal" 
                  required 
                  disabled={loading}
                />
                <TextField 
                  fullWidth 
                  name="message" 
                  label={t('contact.message')} 
                  multiline 
                  rows={4} 
                  value={formData.message} 
                  onChange={handleChange} 
                  margin="normal" 
                  required 
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : t('contact.send')}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Container>
  );
};

export default Contact;