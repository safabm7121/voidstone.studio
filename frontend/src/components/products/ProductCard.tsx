import React from 'react';
import { Card, CardContent, Typography, Chip, Box, CardActions, Button, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import ParallaxImage from '../common/ParallaxImage';
import '../../styles/animation.css';
import '../../styles/parallax.css';

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
    if (onDelete) onDelete(product);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(product);
    else navigate(`/create-product?id=${product._id}`);
  };

  return (
    <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
      <Card sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        borderRadius: 2,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -8px rgba(0,0,0,0.2)',
        }
      }}>
        {isAdmin && (
          <Box sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            display: 'flex',
            gap: 1
          }}>
            <IconButton
              onClick={handleEdit}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: 'primary.main', color: 'white' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: 'error.main', color: 'white' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box className="card-parallax" sx={{ position: 'relative', pt: '75%', overflow: 'hidden' }}>
  {product.images && product.images.length > 0 ? (
    <ParallaxImage
      src={product.images[0]}
      alt={product.name}
      speed={0.2}
      className="card-parallax-image"
    />
  ) : (
    <Box className="card-no-image">
      <Typography color="text.secondary">No image</Typography>
    </Box>
  )}
</Box>

          <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
            <Typography
              gutterBottom
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                lineHeight: 1.3,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {product.name}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              {product.description}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {product.category}
            </Typography>

            <Typography
              variant="h6"
              color="primary"
              sx={{
                fontWeight: 700,
                fontSize: '1.25rem',
                mb: 1.5,
              }}
            >
              {formatCurrency(product.price)}
            </Typography>

            {product.tags && product.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {product.tags.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: 'rgba(0,0,0,0.04)',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                ))}
                {product.tags.length > 3 && (
                  <Chip
                    label={`+${product.tags.length - 3}`}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: 'rgba(0,0,0,0.04)',
                    }}
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Link>

        <CardActions sx={{ p: 2.5, pt: 0, mt: 'auto' }}>
          <Button
            size="small"
            component={Link}
            to={`/products/${product._id}`}
            sx={{
              color: 'text.primary',
              '&:hover': { color: 'primary.main' },
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            View Details
          </Button>
          <IconButton
            color="primary"
            onClick={handleAddToCart}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Login to add to cart' : 'Add to cart'}
            sx={{
              ml: 'auto',
              bgcolor: !isAuthenticated ? 'transparent' : 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'primary.main', color: 'white' },
            }}
          >
            <AddShoppingCartIcon />
          </IconButton>
        </CardActions>
      </Card>
    </div>
  );
};

export default ProductCard;