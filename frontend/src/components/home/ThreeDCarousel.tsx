import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import './ThreeDCarousel.css';

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  category: string;
}

interface ThreeDCarouselProps {
  products: Product[];
}

const ThreeDCarousel: React.FC<ThreeDCarouselProps> = ({ products }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const getPrevIndex = () => (currentIndex - 1 + products.length) % products.length;
  const getNextIndex = () => (currentIndex + 1) % products.length;

  const handleSideCardClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.8,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
      rotateY: direction < 0 ? 45 : -45,
      transition: {
        duration: 0.8,
      },
    }),
  };

  return (
    <Box className="carousel-container">
      {/* Navigation Buttons */}
      <IconButton
        onClick={handlePrev}
        className="carousel-nav-button left"
      >
        <ChevronLeftIcon />
      </IconButton>

      <IconButton
        onClick={handleNext}
        className="carousel-nav-button right"
      >
        <ChevronRightIcon />
      </IconButton>

      {/* Main Carousel */}
      <Box className="carousel-main">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="carousel-slide"
            onClick={() => handleProductClick(products[currentIndex]?._id)}
          >
            <Box className="carousel-card">
              <img
                src={products[currentIndex]?.images[0] || 'https://via.placeholder.com/800x400'}
                alt={products[currentIndex]?.name}
                className="carousel-image"
              />
              <Box className="carousel-overlay">
                <Typography variant="h4" gutterBottom>
                  {products[currentIndex]?.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {products[currentIndex]?.category}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${products[currentIndex]?.price}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Side cards for 3D effect - now clickable */}
        <Box 
          className="carousel-side-card left"
          onClick={() => handleSideCardClick(getPrevIndex())}
        >
          <img
            src={products[getPrevIndex()]?.images[0] || 'https://via.placeholder.com/300x400'}
            alt={products[getPrevIndex()]?.name || 'previous'}
            className="carousel-side-image"
          />
        </Box>

        <Box 
          className="carousel-side-card right"
          onClick={() => handleSideCardClick(getNextIndex())}
        >
          <img
            src={products[getNextIndex()]?.images[0] || 'https://via.placeholder.com/300x400'}
            alt={products[getNextIndex()]?.name || 'next'}
            className="carousel-side-image"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ThreeDCarousel;