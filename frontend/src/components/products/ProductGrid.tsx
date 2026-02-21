import React from 'react';
import { Grid } from '@mui/material';
import ProductCard from './ProductCard';
import { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  isAdmin?: boolean;
  onDelete?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, isAdmin, onDelete, onEdit }) => {
  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid item key={product._id} xs={12} sm={6} md={4}>
          <ProductCard
            product={product}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;