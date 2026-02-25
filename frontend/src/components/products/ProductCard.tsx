import React from 'react';
import { Card, CardContent, Typography, Chip, Box, CardActions, Button, IconButton, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/animation.css'; // keep your existing animation

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onViewHistory?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdmin,
  onDelete,
  onEdit,
  onViewHistory
}) => {
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
    onDelete?.(product);
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

  const handleViewHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewHistory?.(product);
  };

  return (
    <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
      <Card
        sx={{
          position: 'relative',
          transition: 'transform 0.3s, box-shadow 0.3s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 8,
          },
        }}
      >
        {/* Admin actions – positioned according to direction */}
        {isAdmin && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              zIndex: 10,
              display: 'flex',
              gap: 1,
              ...(document.dir === 'ltr' ? { right: 8 } : { left: 8 }),
            }}
          >
            <Tooltip title="View History">
              <IconButton
                size="small"
                onClick={handleViewHistory}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={handleEdit}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Link
          to={`/products/${product._id}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          {/* Image container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1/1',
              overflow: 'hidden',
              bgcolor: 'grey.100',
            }}
          >
            {product.images?.length ? (
              <Box
                component="img"
                src={product.images[0]}
                alt={product.name}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s',
                  '.product-card:hover &': { transform: 'scale(1.05)' },
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.disabled',
                }}
              >
                No image
              </Box>
            )}
          </Box>

          <CardContent sx={{ flex: 1, p: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
              }}
            >
              {product.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
              }}
            >
              {product.description}
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {product.category}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              {formatCurrency(product.price)}
            </Typography>

            {/* Tags – justified based on direction */}
            {product.tags?.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  flexWrap: 'wrap',
                  justifyContent: document.dir === 'rtl' ? 'flex-end' : 'flex-start',
                }}
              >
                {product.tags.slice(0, 3).map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ fontSize: '0.6875rem', height: 22, bgcolor: 'action.hover' }}
                  />
                ))}
                {product.tags.length > 3 && (
                  <Chip
                    label={`+${product.tags.length - 3}`}
                    size="small"
                    sx={{ fontSize: '0.6875rem', height: 22, bgcolor: 'action.hover' }}
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Link>

        <CardActions sx={{ display: 'flex', alignItems: 'center', p: 2, pt: 0, borderTop: 1, borderColor: 'divider' }}>
          <Button
            component={Link}
            to={`/products/${product._id}`}
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
            }}
          >
            View Details
          </Button>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={handleAddToCart}
            disabled={!isAuthenticated}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
            }}
            title={!isAuthenticated ? 'Login to add' : 'Add to cart'}
          >
            <AddShoppingCartIcon />
          </IconButton>
        </CardActions>
      </Card>
    </div>
  );
};

export default ProductCard;