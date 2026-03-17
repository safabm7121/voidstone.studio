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
import '../../styles/animation.css';
import '../../styles/product-card.css'; 
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper to split category into main and sub (e.g., "Men Shirts" → main="Men", sub="Shirts")
  const splitCategory = (cat: string) => {
    if (!cat) return { main: '', sub: '' };
    const parts = cat.split(' ');
    if (parts.length >= 2) {
      return { main: parts[0], sub: parts.slice(1).join(' ') };
    }
    return { main: cat, sub: '' };
  };

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

  const { main, sub } = splitCategory(product.category || '');
  const isRtl = document.dir === 'rtl';

  return (
    <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''} product-card-wrapper`}>
      <Card className="product-card">
        {/* Admin actions – positioned according to direction */}
        {isAdmin && (
          <Box className={`product-card-admin-actions ${isRtl ? 'rtl' : 'ltr'}`}>
            <Tooltip title="View History">
              <IconButton
                size="small"
                onClick={handleViewHistory}
                className="product-card-admin-btn"
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={handleEdit}
                className="product-card-admin-btn"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={handleDelete}
                className="product-card-admin-btn delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Link
          to={`/products/${product._id}`}
          className="product-card-link"
        >
          {/* Image container */}
          <Box className="product-card-image-container">
            {product.images?.length ? (
              <Box
                component="img"
                src={product.images[0]}
                alt={product.name}
                className="product-card-image"
              />
            ) : (
              <Box className="product-card-no-image">
                No image
              </Box>
            )}
          </Box>

          <CardContent className="product-card-content">
            <Typography
              variant="subtitle1"
              className="product-card-title"
              noWrap // Ensure single line
            >
              {product.name}
            </Typography>
            <Typography
              variant="body2"
              className="product-card-description"
              noWrap // Ensure single line
            >
              {product.description}
            </Typography>

            {/* Category chips – main and sub (translated) */}
            {product.category && (
              <Box className="product-card-categories">
                <Chip
                  label={t(`products.categories.${main.toLowerCase()}`)}
                  size="small"
                  variant="outlined"
                />
                {sub && (
                  <Chip
                    label={t(`products.categories.${sub === 'T-Shirts' ? 'tShirts' : sub.toLowerCase()}`)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            )}

            <Typography variant="h6" className="product-card-price">
              {formatCurrency(product.price)}
            </Typography>

            {/* Tags – justified based on direction */}
            {product.tags?.length > 0 && (
              <Box className={`product-card-tags ${isRtl ? 'rtl' : 'ltr'}`}>
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

        <CardActions className="product-card-actions">
          <Button
            component={Link}
            to={`/products/${product._id}`}
            className="product-card-view-details-btn"
          >
            View Details
          </Button>
          <Box className="product-card-spacer" />
          <IconButton
            onClick={handleAddToCart}
            disabled={!isAuthenticated}
            className="product-card-add-to-cart-btn"
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