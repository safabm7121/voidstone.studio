// Login.tsx
import React, { useState } from 'react';
import { 
  Container, Paper, TextField, Button, Typography, 
  Box, Alert, Link, IconButton, InputAdornment 
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.loginFailed'));
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm" className="auth-page">
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" align="center" gutterBottom>
          {t('auth.login')}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField 
            fullWidth 
            id="email"
            name="email"
            label={t('auth.email')} 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            margin="normal"
            autoComplete="email"
            autoFocus
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField 
            fullWidth 
            id="password"
            name="password"
            label={t('auth.password')} 
            type={showPassword ? 'text' : 'password'}
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            margin="normal"
            autoComplete="current-password"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    onClick={handleTogglePassword}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box textAlign="right" sx={{ mt: 1, mb: 2 }}>
            <Link 
              component={RouterLink} 
              to="/forgot-password" 
              variant="body2"
              sx={{ 
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {t('auth.forgotPassword')}
            </Link>
          </Box>

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            size="large"
            sx={{ mt: 2, mb: 2 }}
          >
            {t('auth.login')}
          </Button>
          
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Link 
              component={RouterLink} 
              to="/register" 
              variant="body2"
              sx={{
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {t('auth.noAccount')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;