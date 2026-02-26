import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.registerFailed'));
    }
  };

  return (
    <Container maxWidth="sm" className="auth-page" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>{t('auth.register')}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth name="firstName" label={t('auth.firstName')} value={formData.firstName} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="lastName" label={t('auth.lastName')} value={formData.lastName} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="email" label={t('auth.email')} type="email" value={formData.email} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="password" label={t('auth.password')} type="password" value={formData.password} onChange={handleChange} margin="normal" required helperText={t('auth.passwordRequirements')} />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2 }}>{t('auth.register')}</Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">{t('auth.hasAccount')}</Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;