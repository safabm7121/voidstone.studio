import React, { useEffect, useRef } from 'react';

interface MouseTrackerProps {
  children: React.ReactNode;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update CSS variables
      document.documentElement.style.setProperty('--mouse-x-px', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y-px', e.clientY + 'px');
      
      // Add class to body to show effects
      document.body.classList.add('mouse-moved');
      
      // Reset timer to hide effects after mouse stops
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        document.body.classList.remove('mouse-moved');
      }, 500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return <>{children}</>;
};