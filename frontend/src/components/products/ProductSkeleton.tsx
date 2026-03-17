import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

const ProductSkeleton: React.FC = () => {
  return (
    <Card className="product-card">
      <Skeleton 
        variant="rectangular" 
        height={200} 
        animation="wave"
        sx={{ bgcolor: 'rgba(0,0,0,0.08)' }}
      />
      <CardContent className="product-card-content">
        <Skeleton 
          variant="text" 
          height={24} 
          width="80%" 
          animation="wave"
          sx={{ mb: 1 }}
        />
        <Skeleton 
          variant="text" 
          height={20} 
          width="90%" 
          animation="wave"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="rounded" width={60} height={24} animation="wave" />
          <Skeleton variant="rounded" width={60} height={24} animation="wave" />
        </Box>
        
        <Skeleton 
          variant="text" 
          height={32} 
          width="40%" 
          animation="wave"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={50} height={22} animation="wave" />
          <Skeleton variant="rounded" width={50} height={22} animation="wave" />
          <Skeleton variant="rounded" width={50} height={22} animation="wave" />
        </Box>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={80} height={36} animation="wave" />
          <Skeleton variant="circular" width={40} height={40} animation="wave" />
        </Box>
      </Box>
    </Card>
  );
};

export default ProductSkeleton;