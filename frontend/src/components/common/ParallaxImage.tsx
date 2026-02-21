import React, { useEffect, useRef } from 'react';
import '../../styles/parallax.css';

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  className?: string;
}

const ParallaxImage: React.FC<ParallaxImageProps> = ({
  src,
  alt,
  speed = 0.3,
  className = ''
}) => {
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if container is in viewport
      if (containerRect.top < windowHeight && containerRect.bottom > 0) {
        // Calculate scroll progress within the container
        const scrollProgress = (windowHeight - containerRect.top) / (windowHeight + containerRect.height);
        
        // Apply parallax effect
        const translateY = (scrollProgress - 0.5) * 100 * speed;
        imageRef.current.style.transform = `translateY(${translateY}%) scale(1.1)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`parallax-container ${className}`}
    >
      <div ref={imageRef} className="parallax-image-wrapper">
        <img src={src} alt={alt} className="parallax-image" />
      </div>
    </div>
  );
};

export default ParallaxImage;