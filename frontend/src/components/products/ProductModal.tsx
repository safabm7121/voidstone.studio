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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    designer: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Category state
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const mainCategories = ['Men', 'Women', 'Art'];

  const subCategoriesByGender: Record<string, string[]> = {
    Men: ['Accessories', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Coats', 'Dresses', 'Skirts', 'Bags', 'Shoes', 'Hats'],
    Women: ['Accessories', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Coats', 'Dresses', 'Skirts', 'Bags', 'Shoes', 'Hats']
  };

  // Helper to split category string into main and sub
  const splitCategory = (cat: string) => {
    if (!cat) return { main: '', sub: '' };
    const parts = cat.split(' ');
    if (parts.length >= 2) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: cat, sub: '' };
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        designer: product.designer || ''
      });
      setTags(product.tags || []);

      // Split category into main/sub
      const { main, sub } = splitCategory(product.category || '');
      setMainCategory(main);
      setSubCategory(sub);
    } else {
      // Reset for new product
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '0',
        designer: ''
      });
      setTags([]);
      setMainCategory('');
      setSubCategory('');
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
    // Build full category string
    let category = mainCategory;
    if (mainCategory !== 'Art' && subCategory) {
      category = `${mainCategory} ${subCategory}`;
    }

    onSave({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      category,
      tags
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{product ? t('products.edit') : t('products.create')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="name"
              label={t('products.name')}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="description"
              label={t('products.description')}
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
              label={t('products.price')}
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
              label={t('products.stock')}
              type="number"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
              inputProps={{ min: '0' }}
            />
          </Grid>

          {/* Main Category Dropdown */}
          <Grid item xs={6}>
            <FormControl fullWidth required>
              <InputLabel>{t('products.category')}</InputLabel>
              <Select
                value={mainCategory}
                label={t('products.category')}
                onChange={(e) => {
                  setMainCategory(e.target.value);
                  setSubCategory(''); // reset sub when main changes
                }}
              >
                {mainCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`products.categories.${cat.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subcategory Dropdown (only for Men/Women) */}
          {(mainCategory === 'Men' || mainCategory === 'Women') && (
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('products.subcategory')}</InputLabel>
                <Select
                  value={subCategory}
                  label={t('products.subcategory')}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  {subCategoriesByGender[mainCategory].map((sub) => {
                    const translationKey = sub === 'T-Shirts' ? 'tShirts' : sub.toLowerCase();
                    return (
                      <MenuItem key={sub} value={sub}>
                        {t(`products.categories.${translationKey}`)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={6}>
            <TextField
              fullWidth
              name="designer"
              label={t('products.designer')}
              value={formData.designer}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('products.tags')}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={t('products.tagPlaceholder')}
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
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : (product ? t('common.update') : t('common.create'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;