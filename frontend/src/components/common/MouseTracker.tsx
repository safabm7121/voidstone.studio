import React, { useEffect, useRef, useState } from 'react';

interface MouseTrackerProps {
  children: React.ReactNode;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const timerRef = useRef<NodeJS.Timeout>();
  
  // Add touch device detection
  const [isTouchDevice] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    // 🛑 CRITICAL: Skip on touch devices
    if (isTouchDevice) {
      return;
    }

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
  }, [isTouchDevice]); // Add dependency

  return <>{children}</>;
};