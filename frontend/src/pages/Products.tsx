import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import {
  Container, Typography, Box, ToggleButtonGroup, ToggleButton,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Slider, Grid, Paper, Divider, Pagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, DialogContentText,
  Skeleton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi } from '../services/api';
import ProductGrid from '../components/products/ProductGrid';
import CapsuleSlider from '../components/products/CapsuleSlider';
import ProductModal from '../components/products/ProductModal';
import ProductSkeleton from '../components/products/ProductSkeleton';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/helpers';

const CACHE_KEY = 'products_cache';
const CACHE_TIME_KEY = 'products_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Products: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Initialize with cached data if available
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cached && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
    return [];
  });
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [mainCategory, setMainCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const itemsPerPage = 9;
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  const mainCategories = ['All', 'Men', 'Women', 'Art'];

  const subCategoriesByGender: Record<string, string[]> = {
    Men: ['Accessories', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Coats', 'Dresses', 'Skirts', 'Bags', 'Shoes', 'Hats'],
    Women: ['Accessories', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Coats', 'Dresses', 'Skirts', 'Bags', 'Shoes', 'Hats']
  };

  useEffect(() => {
    // Show cached products immediately, then fetch fresh data
    if (products.length > 0) {
      setFilteredProducts(products);
      setLoading(false);
      setInitialLoad(false);
    }
    
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      filterAndSortProducts();
    }
  }, [products, searchTerm, mainCategory, subCategory, priceRange, sortBy]);

  const fetchProducts = async (forceRefresh = false) => {
    try {
      // Check cache unless force refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        
        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age < CACHE_DURATION) {
            const cachedProducts = JSON.parse(cached);
            setProducts(cachedProducts);
            setFilteredProducts(cachedProducts);
            setLoading(false);
            setInitialLoad(false);
            return;
          }
        }
      }
      
      // Show loading only if no cached data
      if (products.length === 0) {
        setLoading(true);
      }
      
      const response = await productApi.get('/products');
      const productsData = response.data.products;
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(productsData));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleRefresh = () => {
    fetchProducts(true);
    toast.info('Refreshing products...');
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
      
      // Clear cache and refresh
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
      fetchProducts(true);
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
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await productApi.put(`/products/${editingProduct._id}`, productData);
        toast.success('Product updated successfully!');
      } else {
        await productApi.post('/products', productData);
        toast.success('Product created successfully!');
      }
      
      // Clear cache and refresh
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
      setModalOpen(false);
      setEditingProduct(null);
      fetchProducts(true);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleViewHistory = (product: Product) => {
    navigate(`/products/history/${product._id}`);
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
    
    if (mainCategory !== 'All') {
      if (mainCategory === 'Art') {
        filtered = filtered.filter(product => product.category === 'Art');
      } else if (subCategory) {
        const fullCategory = `${mainCategory} ${subCategory}`;
        filtered = filtered.filter(product => product.category === fullCategory);
      } else {
        filtered = filtered.filter(product =>
          product.category.startsWith(mainCategory + ' ')
        );
      }
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

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Show skeletons on initial load
  if (initialLoad && loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" height={60} sx={{ mb: 4 }} />
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
            <Grid item xs={6} md={2}>
              <Skeleton variant="rectangular" height={56} />
            </Grid>
          </Grid>
        </Paper>
        <Grid container spacing={4}>
          {[...Array(6)].map((_, i) => (
            <Grid item key={i} xs={12} sm={6} md={4}>
              <ProductSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div ref={elementRef} initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ fontWeight: 600 }}>
            {t('products.title')}
          </Typography>
          <Button variant="outlined" onClick={handleRefresh} size="small">
            Refresh
          </Button>
        </Box>
      </motion.div>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              placeholder={t('products.search')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} 
            />
          </Grid>
         
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('products.category')}</InputLabel>
              <Select 
                value={mainCategory} 
                label={t('products.category')} 
                onChange={(e) => {
                  setMainCategory(e.target.value);
                  setSubCategory('');
                }}
              >
                {mainCategories.map((cat) => {
                  if (cat === 'All') {
                    return <MenuItem key="All" value="All">{t('common.all')}</MenuItem>;
                  }
                  return (
                    <MenuItem key={cat} value={cat}>
                      {t(`products.categories.${cat.toLowerCase()}`)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {(mainCategory === 'Men' || mainCategory === 'Women') && (
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
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
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('products.sortBy')}</InputLabel>
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
                <Typography gutterBottom>
                  {t('products.priceRange')}: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </Typography>
                <Slider 
                  value={priceRange} 
                  onChange={(_, newValue) => setPriceRange(newValue as number[])} 
                  valueLabelDisplay="auto" 
                  min={0} 
                  max={500} 
                  valueLabelFormat={(value) => formatCurrency(value)}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>

      {(searchTerm || mainCategory !== 'All' || subCategory || priceRange[0] > 0 || priceRange[1] < 500) && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {filteredProducts.length} {t('products.productsFound')}
          </Typography>
          <Button variant="text" onClick={() => { 
            setSearchTerm(''); 
            setMainCategory('All');
            setSubCategory('');
            setPriceRange([0, 500]); 
            setSortBy('newest');
          }}>
            {t('products.clearFilters')}
          </Button>
        </Box>
      )}

      {filteredProducts.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="text.secondary" gutterBottom>{t('products.noProducts')}</Typography>
          <Button variant="contained" onClick={() => { 
            setSearchTerm(''); 
            setMainCategory('All');
            setSubCategory('');
            setPriceRange([0, 500]); 
            setSortBy('newest');
          }}>
            {t('products.clearFilters')}
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <ProductGrid 
              products={paginatedProducts} 
              isAdmin={isAdmin} 
              onDelete={handleDeleteClick}
              onEdit={handleEdit}
              onViewHistory={handleViewHistory}
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

      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

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