import React, { useEffect, useState } from 'react';
import { Product } from '../types'; // ← Only this import, no local interface!
import {
  Container, Typography, CircularProgress, Box, ToggleButtonGroup, ToggleButton,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Slider, Grid, Paper, Divider, Pagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi } from '../services/api';
import ProductGrid from '../components/products/ProductGrid';
import CapsuleSlider from '../components/products/CapsuleSlider';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Products: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const itemsPerPage = 9;
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  const categories = [
    'All', 'Men', 'Women', 'Accessories', 'Shirts', 'T-Shirts',
    'Pants', 'Jeans', 'Jackets', 'Coats', 'Dresses', 'Skirts', 'Bags', 'Shoes', 'Hats'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const fetchProducts = async () => {
    try {
      const response = await productApi.get('/products');
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await productApi.delete(`/products/${productToDelete._id}`);
      toast.success(`"${productToDelete.name}" deleted successfully`);
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleEdit = (product: Product) => {
    // Navigate to edit page with product ID
    window.location.href = `/create-product?id=${product._id}`;
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    filtered = filtered.filter(product => product.price >= priceRange[0] && product.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: filtered.sort((a, b) => 
        (b.created_at ? new Date(b.created_at).getTime() : 0) - 
        (a.created_at ? new Date(a.created_at).getTime() : 0)
      ); break;
    }
    setFilteredProducts(filtered);
    setPage(1);
  };

  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div ref={elementRef} initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 4 }}>
          {t('products.title')}
        </Typography>
      </motion.div>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth placeholder={t('products.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth><InputLabel>{t('products.category')}</InputLabel>
              <Select value={selectedCategory} label={t('products.category')} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth><InputLabel>{t('products.sortBy')}</InputLabel>
              <Select value={sortBy} label={t('products.sortBy')} onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="newest">{t('products.newest')}</MenuItem>
                <MenuItem value="price-low">{t('products.priceLow')}</MenuItem>
                <MenuItem value="price-high">{t('products.priceHigh')}</MenuItem>
                <MenuItem value="name-asc">{t('products.nameAsc')}</MenuItem>
                <MenuItem value="name-desc">{t('products.nameDesc')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button fullWidth variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
              {t('products.priceFilter')}
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} fullWidth>
              <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
              <ToggleButton value="slider"><ViewCarouselIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ px: 2 }}>
                <Typography gutterBottom>{t('products.priceRange')}: ${priceRange[0]} - ${priceRange[1]}</Typography>
                <Slider value={priceRange} onChange={(_, newValue) => setPriceRange(newValue as number[])} valueLabelDisplay="auto" min={0} max={500} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>

      {(searchTerm || selectedCategory !== 'All' || priceRange[0] > 0 || priceRange[1] < 500) && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">{filteredProducts.length} {t('products.productsFound')}</Typography>
          <Button variant="text" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setPriceRange([0, 500]); setSortBy('newest'); }}>
            {t('products.clearFilters')}
          </Button>
        </Box>
      )}

      {filteredProducts.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="text.secondary" gutterBottom>{t('products.noProducts')}</Typography>
          <Button variant="contained" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setPriceRange([0, 500]); setSortBy('newest'); }}>
            {t('products.clearFilters')}
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProductGrid 
              products={paginatedProducts} 
              isAdmin={user?.role === 'admin'} 
              onDelete={handleDeleteClick}
              onEdit={handleEdit}
            />
          ) : (
            <CapsuleSlider products={paginatedProducts} />
          )}
          {pageCount > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
              <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" size="large" />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Products;