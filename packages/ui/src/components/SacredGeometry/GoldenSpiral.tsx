'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GoldenSpiralProps {
  className?: string;
  scale?: number;
  duration?: number;
  color?: string;
}

export const GoldenSpiral: React.FC<GoldenSpiralProps> = ({
  className,
  scale = 200,
  duration = 20,
  color = "currentColor"
}) => {
  // Approximate Golden Spiral path
  const path = `
    M ${scale},${scale} 
    A ${scale},${scale} 0 0 1 ${scale * 2},0 
    L ${scale * 2},${scale} 
    A ${scale/1.618},${scale/1.618} 0 0 1 ${scale + scale/1.618},${scale + scale/1.618}
    L ${scale},${scale + scale/1.618}
  `;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: scale * 2.5, height: scale * 1.8 }}>
      <motion.svg
        viewBox={`0 0 ${scale * 2.5} ${scale * 1.8}`}
        width={scale * 2.5}
        height={scale * 1.8}
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: 0.8, rotate: 360 }}
        transition={{ 
          duration: duration, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-0"
      >
        <path
          d="M100,100 Q200,50 300,100 T500,100" // Placeholder curve for visual effect if complex path fails
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.5"
        />
         {/* Concentric Golden Ratio Circles */}
        <circle cx="50%" cy="50%" r={scale * 0.618} stroke={color} fill="none" strokeWidth="1" opacity="0.3" />
        <circle cx="50%" cy="50%" r={scale * 0.382} stroke={color} fill="none" strokeWidth="1" opacity="0.4" />
        <circle cx="50%" cy="50%" r={scale * 0.236} stroke={color} fill="none" strokeWidth="1" opacity="0.5" />
      </motion.svg>
      
      {/* Central Pulsing Core */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
            width: scale * 0.1, 
            height: scale * 0.1, 
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}`
        }}
        animate={{ scale: [1, 1.618, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
