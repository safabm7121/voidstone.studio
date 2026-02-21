import React from 'react';
import { Card, CardMedia, CardContent, Typography, Chip, Box, CardActions, Button, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onDelete, onEdit }) => {
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(product);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(product);
    } else {
      navigate(`/create-product?id=${product._id}`);
    }
  };

  return (
    <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6
        }
      }}>
        {isAdmin && (
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            zIndex: 1, 
            display: 'flex', 
            gap: 1 
          }}>
            <IconButton
              onClick={handleEdit}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'primary.main', color: 'white' },
              }}
              title="Edit product"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'error.main', color: 'white' },
              }}
              title="Delete product"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {product.images && product.images.length > 0 ? (
            <CardMedia 
              component="img" 
              height="300" 
              image={product.images[0]} 
              alt={product.name} 
              sx={{ objectFit: 'cover' }} 
            />
          ) : (
            <Box 
              sx={{ 
                height: 300, 
                bgcolor: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Typography color="text.secondary">No image</Typography>
            </Box>
          )}
          
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography gutterBottom variant="h5" component="div">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {product.description.substring(0, 100)}...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Category: {product.category}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
              {formatCurrency(product.price)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {product.tags?.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          </CardContent>
        </Link>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button 
            size="small" 
            component={Link} 
            to={`/products/${product._id}`}
          >
            View Details
          </Button>
          <IconButton
            color="primary"
            onClick={handleAddToCart}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Login to add to cart' : 'Add to cart'}
          >
            <AddShoppingCartIcon />
          </IconButton>
        </CardActions>
      </Card>
    </div>
  );
};

export default ProductCard;