// Register.tsx
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

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.registerFailed'));
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm" className="auth-page">
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" align="center" gutterBottom>
          {t('auth.register')}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField 
            fullWidth 
            id="firstName"
            name="firstName" 
            label={t('auth.firstName')} 
            value={formData.firstName} 
            onChange={handleChange} 
            margin="normal" 
            required 
            autoComplete="given-name"
            autoFocus
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField 
            fullWidth 
            id="lastName"
            name="lastName" 
            label={t('auth.lastName')} 
            value={formData.lastName} 
            onChange={handleChange} 
            margin="normal" 
            required 
            autoComplete="family-name"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField 
            fullWidth 
            id="email"
            name="email" 
            label={t('auth.email')} 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            margin="normal" 
            required 
            autoComplete="email"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField 
            fullWidth 
            id="password"
            name="password" 
            label={t('auth.password')} 
            type={showPassword ? 'text' : 'password'}
            value={formData.password} 
            onChange={handleChange} 
            margin="normal" 
            required 
            autoComplete="new-password"
            helperText={t('auth.passwordRequirements')}
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

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            size="large" 
            sx={{ mt: 3, mb: 2 }}
          >
            {t('auth.register')}
          </Button>
          
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Link 
              component={RouterLink} 
              to="/login" 
              variant="body2"
              sx={{
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {t('auth.hasAccount')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;