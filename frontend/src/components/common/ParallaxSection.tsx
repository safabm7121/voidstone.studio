import React, { useEffect, useRef } from 'react';
import '../../styles/parallax.css';

interface ParallaxSectionProps {
  children: React.ReactNode;
  bgImage?: string;
  speed?: number;
  className?: string;
  height?: 'vh-90' | 'vh-100' | 'auto' | '400' | '500' | '600';
  overlay?: boolean;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  bgImage,
  speed = 0.5,
  className = '',
  height = 'vh-100',
  overlay = false
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !bgRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = rect.height;
      
      // Calculate how far the section is from the viewport
      const scrollProgress = (scrollTop + window.innerHeight - sectionTop) / (window.innerHeight + sectionHeight);
      
      // Clamp between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
      
      // Calculate parallax offset and apply transform
      const offset = clampedProgress * 100 * speed;
      bgRef.current.style.transform = `translateY(calc(-1 * ${offset}px))`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  // Update background image when it changes
  useEffect(() => {
    if (bgRef.current && bgImage) {
      bgRef.current.style.backgroundImage = `url(${bgImage})`;
    }
  }, [bgImage]);

  // Generate height class
  const heightClass = `height-${height}`;

  return (
    <div
      ref={sectionRef}
      className={`parallax-scroll ${heightClass} ${!bgImage ? 'no-image' : ''} ${className}`}
    >
      {bgImage && (
        <div
          ref={bgRef}
          className={`parallax-scroll-bg ${overlay ? 'with-overlay' : ''}`}
        />
      )}
      <div className="parallax-scroll-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;