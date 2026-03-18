import React, { useEffect, useRef } from 'react';

interface MouseTrackerProps {
  children: React.ReactNode;
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const timerRef = useRef<NodeJS.Timeout>();
  
  // Check if it's a mobile device - more accurate detection
  const isMobileDevice = () => {
    const ua = navigator.userAgent;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Only treat as mobile if it has touch AND is a mobile user agent
    // This prevents laptops with touch screens from being detected as mobile
    return hasTouch && isMobileUserAgent;
  };

  useEffect(() => {
    // Skip on actual mobile devices, keep on desktop
    if (isMobileDevice()) {
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
  }, []); // Empty dependency array - runs once on mount

  return <>{children}</>;
};