import { useEffect } from 'react';

export const useMouseTracking = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      // Update CSS variables for global effects
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
      document.documentElement.style.setProperty('--mouse-x-percent', (x - 0.5).toString());
      document.documentElement.style.setProperty('--mouse-y-percent', (y - 0.5).toString());
      document.documentElement.style.setProperty('--mouse-x-px', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y-px', e.clientY + 'px');
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};