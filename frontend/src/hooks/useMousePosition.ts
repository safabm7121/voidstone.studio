import { useEffect, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
  xPercent: number;
  yPercent: number;
  xPercentCenter: number;
  yPercentCenter: number;
}

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    xPercent: 0,
    yPercent: 0,
    xPercentCenter: 0,
    yPercentCenter: 0
  });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      const xPercent = ev.clientX / window.innerWidth;
      const yPercent = ev.clientY / window.innerHeight;
      
      setMousePosition({
        x: ev.clientX,
        y: ev.clientY,
        xPercent,
        yPercent,
        xPercentCenter: xPercent - 0.5,
        yPercentCenter: yPercent - 0.5
      });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};