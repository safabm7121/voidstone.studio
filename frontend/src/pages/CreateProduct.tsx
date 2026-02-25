import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, TextField, Button, Grid, Chip, Box, Alert, IconButton
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDropzone } from 'react-dropzone';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CreateProduct: React.FC = () => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;
  
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    price: '', 
    category: '', 
    designer: '', 
    stock_quantity: ''
  });

  // Load product if in edit mode
  useEffect(() => {
    if (productId) {
      loadProductForEdit(productId);
    }
  }, [productId]);

  const loadProductForEdit = async (id: string) => {
    setLoadingProduct(true);
    setError('');
    try {
      const response = await productApi.get(`/products/${id}`);
      const product = response.data.product;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        designer: product.designer || '',
        stock_quantity: product.stock_quantity?.toString() || '0'
      });
      
      setImages(product.images || []);
      setTags(product.tags || []);
      
      toast.info(`Editing "${product.name}"`);
    } catch (error: any) {
      console.error('Error loading product:', error);
      setError(error.response?.data?.error || 'Failed to load product for editing');
      toast.error('Failed to load product');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Drag & Drop setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('🔍 Authentication Debug:');
    console.log('Token from useAuth:', token);
    console.log('User from useAuth:', user);
    console.log('LocalStorage token:', localStorage.getItem('token'));
    console.log('Is admin?', user?.role === 'admin');
    console.log('Is edit mode?', isEditMode);
    console.log('Product ID:', productId);
    
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
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
      let response;
      
      if (isEditMode) {
        response = await productApi.put(`/products/${productId}`, productData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Product updated successfully!');
        console.log('✅ Product updated:', response.data);
      } else {
        response = await productApi.post('/products', productData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Product created successfully!');
        console.log('✅ Product created:', response.data);
      }
      
      navigate('/products');
      
    } catch (err: any) {
      console.error(`❌ Error ${isEditMode ? 'updating' : 'creating'} product:`, err);
      
      if (err.response) {
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
        console.error('Error request:', err.request);
        setError('No response from server. Please check if product-service is running.');
      } else {
        console.error('Error message:', err.message);
        setError('Failed to create product: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading product...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Product' : t('createProduct.title')}
        </Typography>
        
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>{t('createProduct.images')}</Typography>
              
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : '#ccc',
                  borderRadius: 2,
                  p: 3,
                  mb: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <input {...getInputProps()} disabled={loading} />
                <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography>
                  {isDragActive ? 'Drop images here...' : t('createProduct.upload')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (JPG, PNG, WebP up to 5MB each)
                </Typography>
              </Box>
              
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
                        disabled={loading}
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
                disabled={loading}
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map(tag => <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} disabled={loading} />)}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/products')} disabled={loading}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                >
                  {loading ? (isEditMode ? 'Updating...' : t('common.creating')) : (isEditMode ? 'Update Product' : t('createProduct.create'))}
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