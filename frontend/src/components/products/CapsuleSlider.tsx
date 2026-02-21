import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import ProductCard from './ProductCard';
import { Product } from '../../types'; // ← IMPORT SHARED TYPE

const CapsuleSlider: React.FC<{ products: Product[] }> = ({ products }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      const slides = slider.children;
      const center = slider.scrollLeft + slider.clientWidth / 2;
      let closestIndex = 0;
      let closestDist = Infinity;

      Array.from(slides).forEach((slide, idx) => {
        const slideCenter = (slide as HTMLElement).offsetLeft + (slide as HTMLElement).clientWidth / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = idx;
        }
      });
      setActiveIndex(closestIndex);
    };

    slider.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => slider.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box ref={sliderRef} className="capsule-slider" sx={{ py: 4, display: 'flex', overflowX: 'auto', gap: 2 }}>
      {products.map((product, idx) => (
        <Box key={product._id} className={`capsule-slide ${idx === activeIndex ? 'active' : ''}`} sx={{ flex: '0 0 auto', width: '280px' }}>
          <ProductCard product={product} />
        </Box>
      ))}
    </Box>
  );
};

export default CapsuleSlider;