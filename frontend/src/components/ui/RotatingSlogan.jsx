import React, { useState, useEffect } from 'react';
import { COMPANY_INFO } from '../../constants';

const RotatingSlogan = ({ className = '' }) => {
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentSloganIndex((prevIndex) => 
          (prevIndex + 1) % COMPANY_INFO.slogans.length
        );
        setIsVisible(true);
      }, 300);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentSlogan = COMPANY_INFO.slogans[currentSloganIndex];
  const [firstPart, secondPart] = currentSlogan.split(',').map(part => part.trim());

  return (
    <h1 className={`font-display text-5xl lg:text-7xl font-bold leading-tight text-gray-900 ${className}`}>
      <span className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {firstPart},
        <span className="gradient-text-block bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-700"> {secondPart}</span>
      </span>
    </h1>
  );
};

export default RotatingSlogan;
