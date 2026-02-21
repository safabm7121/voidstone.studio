import React, { useState, useEffect } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerification');
    if (pendingEmail) setEmail(pendingEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyEmail(email, code);
      setSuccess(t('auth.verificationSuccess'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.verificationFailed'));
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>{t('auth.verifyEmail')}</Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.verificationInstructions')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required disabled={!!localStorage.getItem('pendingVerification')} />
          <TextField fullWidth label={t('auth.verificationCode')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} margin="normal" required helperText={t('auth.codeInstructions')} inputProps={{ maxLength: 8, style: { textTransform: 'uppercase' } }} />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2 }}>{t('auth.verify')}</Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">{t('auth.backToLogin')}</Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyEmail;