'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FractalGridProps {
  className?: string;
  active?: boolean;
  density?: number;
  color?: string;
}

export const FractalGrid: React.FC<FractalGridProps> = ({
  className,
  active = true,
  density = 20,
  color = '#4fd1c5'
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg width="100%" height="100%" className="opacity-20">
        <pattern
          id="fractal-grid"
          x="0"
          y="0"
          width={density * 2}
          height={density * 2}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${density} 0 L ${density * 2} ${density} L ${density} ${density * 2} L 0 ${density} Z`}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            className="transition-all duration-1000"
          />
          <circle cx={density} cy={density} r={1} fill={color} />
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#fractal-grid)" />
        
        {/* Animated overlay */}
        {active && (
          <motion.rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#fractal-grid)"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ transformOrigin: 'center' }}
          />
        )}
      </svg>
    </div>
  );
};
