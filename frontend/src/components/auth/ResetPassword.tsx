import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get email from localStorage or URL parameters
    const savedEmail = localStorage.getItem('resetPasswordEmail');
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const codeParam = params.get('code');

    setFormData(prev => ({
      ...prev,
      email: emailParam || savedEmail || '',
      code: codeParam || ''
    }));
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = () => {
    if (formData.newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError(t('auth.passwordRequirements'));
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:3001/api/auth/reset-password', {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });

      setSuccess(t('auth.passwordResetSuccess'));
      
      // Clear stored email
      localStorage.removeItem('resetPasswordEmail');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className="auth-page" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {t('auth.resetPassword')}
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.resetPasswordInstructions')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            name="email"
            label={t('auth.email')}
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading || !!formData.email}
          />

          <TextField
            fullWidth
            name="code"
            label={t('auth.verificationCode')}
            value={formData.code}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            inputProps={{ 
              maxLength: 8, 
              style: { textTransform: 'uppercase' } 
            }}
            helperText={t('auth.codeInstructions')}
          />

          <TextField
            fullWidth
            name="newPassword"
            label={t('auth.newPassword')}
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            helperText={t('auth.passwordRequirements')}
          />

          <TextField
            fullWidth
            name="confirmPassword"
            label={t('auth.confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('auth.resetPassword')}
          </Button>

          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">
              {t('auth.backToLogin')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;