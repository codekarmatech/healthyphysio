import React from 'react';

/**
 * ProgressRing - Circular progress indicator
 * 
 * @param {number} progress - Progress value (0-100)
 * @param {number} size - Size of the ring in pixels
 * @param {number} strokeWidth - Width of the progress stroke
 * @param {string} color - Color of the progress (primary, secondary, success, warning)
 * @param {React.ReactNode} children - Content to display in center
 */
const ProgressRing = ({
  progress = 0,
  size = 120,
  strokeWidth = 10,
  color = 'primary',
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return { stroke: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] };
      case 'secondary':
        return { stroke: '#f97316', gradient: ['#f97316', '#fb923c'] };
      case 'success':
        return { stroke: '#22c55e', gradient: ['#22c55e', '#4ade80'] };
      case 'warning':
        return { stroke: '#eab308', gradient: ['#eab308', '#facc15'] };
      default:
        return { stroke: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] };
    }
  };

  const colors = getColorClass();
  const gradientId = `progress-gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="100%" stopColor={colors.gradient[1]} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-2xl font-bold text-gray-900">{progress}%</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
