import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <Container maxWidth="sm" className="auth-page" >
      <Paper elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          {t('auth.login')}
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField 
            fullWidth 
            label={t('auth.email')} 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          <TextField 
            fullWidth 
            label={t('auth.password')} 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <Box textAlign="right">
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
          >
            {t('auth.login')}
          </Button>
          
          <Box textAlign="center">
            <Link component={RouterLink} to="/register" variant="body2">
              {t('auth.noAccount')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;