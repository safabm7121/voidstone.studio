import React, { useState } from 'react';
import {
  Container, Paper, Typography, TextField, Button, Grid, Chip, Box, Alert, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateProduct: React.FC = () => {
  const { t } = useTranslation();
  const { token, user } = useAuth(); // Added user for debugging
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', designer: '', stock_quantity: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Debug: Check authentication state
    console.log('🔍 Authentication Debug:');
    console.log('Token from useAuth:', token);
    console.log('User from useAuth:', user);
    console.log('LocalStorage token:', localStorage.getItem('token'));
    
    // Validate inputs
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    // Prepare product data
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      designer: formData.designer || 'Voidstone Studio',
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      images: images,
      tags: tags
    };
    
    console.log('📦 Product data being sent:', productData);
    
    try {
      // Use the token from context, not localStorage directly
      const response = await productApi.post('/products', productData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Product created successfully:', response.data);
      navigate('/products');
      
    } catch (err: any) {
      console.error('❌ Error creating product:', err);
      
      // Detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        
        if (err.response.status === 403) {
          setError('You do not have permission to create products. Please check your role.');
        } else if (err.response.status === 401) {
          setError('Your session has expired. Please login again.');
        } else {
          setError(err.response.data?.error || t('createProduct.error'));
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('No response from server. Please check if product-service is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', err.message);
        setError('Failed to create product: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>{t('createProduct.title')}</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                name="name" 
                label={t('createProduct.name')} 
                value={formData.name} 
                onChange={handleChange} 
                required 
                error={!formData.name && error.includes('fill')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                name="description" 
                label={t('createProduct.description')} 
                multiline rows={4} 
                value={formData.description} 
                onChange={handleChange} 
                required 
                error={!formData.description && error.includes('fill')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                name="price" 
                label={t('createProduct.price')} 
                type="number" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                inputProps={{ step: '0.01', min: '0' }} 
                error={!formData.price && error.includes('fill')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                name="stock_quantity" 
                label={t('createProduct.stock')} 
                type="number" 
                value={formData.stock_quantity} 
                onChange={handleChange} 
                required 
                inputProps={{ min: '0' }} 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                name="category" 
                label={t('createProduct.category')} 
                value={formData.category} 
                onChange={handleChange} 
                required 
                error={!formData.category && error.includes('fill')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                name="designer" 
                label={t('createProduct.designer')} 
                value={formData.designer} 
                onChange={handleChange} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>{t('createProduct.images')}</Typography>
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                {t('createProduct.upload')}
                <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
              </Button>
              
              <Grid container spacing={2}>
                {images.map((img, idx) => (
                  <Grid item key={idx} xs={6} sm={4} md={3}>
                    <Box sx={{ position: 'relative' }}>
                      <Box 
                        component="img" 
                        src={img} 
                        alt={`Product ${idx}`} 
                        sx={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.8)' }} 
                        onClick={() => removeImage(idx)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>{t('createProduct.tags')}</Typography>
              <TextField 
                fullWidth 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                onKeyDown={handleAddTag} 
                placeholder={t('createProduct.tagPlaceholder')} 
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map(tag => <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} />)}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/products')}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                >
                  {loading ? t('common.creating') : t('createProduct.create')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProduct;