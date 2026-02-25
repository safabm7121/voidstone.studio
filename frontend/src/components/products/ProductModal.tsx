import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { Product } from '../../types';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  product?: Product | null;
  loading?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  onClose,
  onSave,
  product,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    designer: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        designer: product.designer || ''
      });
      setTags(product.tags || []);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock_quantity: '0',
        designer: ''
      });
      setTags([]);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = () => {
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      tags
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="name"
              label="Product Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="price"
              label="Price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="stock_quantity"
              label="Stock"
              type="number"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
              inputProps={{ min: '0' }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="designer"
              label="Designer"
              value={formData.designer}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter to add tags"
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map(tag => (
                <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} size="small" />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : (product ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;