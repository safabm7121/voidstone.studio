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
  speed = 0.15,
  className = '',
  height = 'vh-100',
  overlay = false
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    const updateParallax = () => {
      if (!section || !bg) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far the section is from viewport center
      const viewportCenter = windowHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const distanceFromCenter = (sectionCenter - viewportCenter) / (windowHeight / 2);
      
      // Smooth parallax effect based on distance from center
      const clampedDistance = Math.max(-1, Math.min(1, distanceFromCenter));
      const offset = clampedDistance * 30 * speed;
      
      // Apply transform with hardware acceleration
      bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.02)`;
      bg.style.willChange = 'transform';
      
      ticking.current = false;
    };

    const onScroll = () => {
      lastScrollY.current = window.scrollY;
      
      if (!ticking.current) {
        animationFrameRef.current = requestAnimationFrame(updateParallax);
        ticking.current = true;
      }
    };

    const onResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    
    // Initial update
    updateParallax();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed]);

  // Update background image
  useEffect(() => {
    if (bgRef.current && bgImage) {
      bgRef.current.style.backgroundImage = `url(${bgImage})`;
    }
  }, [bgImage]);

  // Smooth mouse move effect (only on non-touch devices)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || 'ontouchstart' in window) return;

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        
        // Calculate mouse position relative to section center (-1 to 1)
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        
        // Clamp and smooth the values
        const clampedX = Math.max(-0.8, Math.min(0.8, x));
        const clampedY = Math.max(-0.8, Math.min(0.8, y));
        
        // Apply with easing
        section.style.setProperty('--mouse-x-percent', clampedX.toString());
        section.style.setProperty('--mouse-y-percent', clampedY.toString());
        section.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        section.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };

    const handleMouseLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        section.style.setProperty('--mouse-x-percent', '0');
        section.style.setProperty('--mouse-y-percent', '0');
      });
    };

    section.addEventListener('mousemove', handleMouseMove, { passive: true });
    section.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Generate height class
  const heightClass = `height-${height}`;

  return (
    <div
      ref={sectionRef}
      className={`parallax-scroll ${heightClass} ${!bgImage ? 'no-image' : ''} ${className}`}
      data-parallax="true"
    >
      {bgImage && (
        <div
          ref={bgRef}
          className={`parallax-scroll-bg ${overlay ? 'with-overlay' : ''}`}
          aria-hidden="true"
        />
      )}
      <div className="parallax-scroll-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;