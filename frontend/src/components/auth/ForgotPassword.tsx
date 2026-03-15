import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api'; // ✅ Import authApi instead of axios

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    // Log the actual URL being used
    console.log('🔍 BaseURL:', authApi.defaults.baseURL);
    console.log('🔍 Full URL:', `${authApi.defaults.baseURL}/api/auth/forgot-password`);

    // Try direct fetch to bypass any axios issues
    const response = await fetch('https://p01--voidstone-auth--mpfdn46pqp5y.code.run/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    console.log('🔍 Response:', data);

    if (!response.ok) throw new Error(data.error || 'Failed');

    setSuccess(t('auth.resetCodeSent'));
    localStorage.setItem('resetPasswordEmail', email);
    setTimeout(() => navigate('/reset-password'), 3000);
  } catch (err: any) {
    console.error('🔍 Error:', err);
    setError(err.message || t('auth.forgotPasswordFailed'));
  } finally {
    setLoading(false);
  }
};
  return (
    <Container maxWidth="sm" className="auth-page" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {t('auth.forgotPassword')}
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.forgotPasswordInstructions')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('auth.sendResetCode')}
          </Button>

          <Box textAlign="center" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2" sx={{ mx: 1 }}>
              {t('auth.backToLogin')}
            </Link>
            <Link component={RouterLink} to="/register" variant="body2" sx={{ mx: 1 }}>
              {t('auth.noAccount')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;