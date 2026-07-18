import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exit');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayLocation(location);
      setTransitionStage('enter');
    }
  };

  return (
    <div
      className={`w-full ${
        transitionStage === 'enter' ? 'page-transition-enter' : 'page-transition-exit'
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};
