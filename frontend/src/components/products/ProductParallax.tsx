import React, { useEffect, useRef } from 'react';

interface ProductParallaxProps {
  src: string;
  alt: string;
  speed?: 'slow' | 'medium' | 'fast';
  containerClassName?: string;
  imageClassName?: string;
}

const ProductParallax: React.FC<ProductParallaxProps> = ({
  src,
  alt,
  speed = 'medium',
  containerClassName = '',
  imageClassName = ''
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (containerRect.top < windowHeight && containerRect.bottom > 0) {
        const containerCenter = containerRect.top + containerRect.height / 2;
        const viewportCenter = windowHeight / 2;
        const distanceFromCenter = containerCenter - viewportCenter;
        
        const speedMap = { slow: 0.1, medium: 0.2, fast: 0.3 };
        const offset = distanceFromCenter * speedMap[speed];
        
        imageRef.current.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div 
      ref={containerRef}
      className={containerClassName}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={imageClassName}
      />
    </div>
  );
};

export default ProductParallax;