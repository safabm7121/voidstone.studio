import React, { useEffect, useRef, useState } from 'react';
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
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = rect.height;
      
      // Calculate how far the section is from the viewport
      const scrollProgress = (scrollTop + window.innerHeight - sectionTop) / (window.innerHeight + sectionHeight);
      
      // Clamp between 0 and 1
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
      
      // Calculate parallax offset
      setOffset(clampedProgress * 100 * speed);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  // Update CSS variables when offset or bgImage changes
  useEffect(() => {
    if (bgRef.current) {
      if (bgImage) {
        bgRef.current.style.setProperty('--bg-image', `url(${bgImage})`);
      }
      bgRef.current.style.setProperty('--parallax-offset', `${offset}px`);
    }
  }, [offset, bgImage]);

  // Generate height class
  const heightClass = `height-${height}`;

  return (
    <div
      ref={sectionRef}
      className={`parallax-scroll ${heightClass} relative overflow-hidden ${className}`}
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