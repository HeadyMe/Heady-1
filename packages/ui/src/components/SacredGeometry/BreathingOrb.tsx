'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BreathingOrbProps {
  size?: number;
  color?: string;
  label?: string;
  isActive?: boolean;
}

export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  size = 60,
  color = "#4fd1c5",
  label,
  isActive = true
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute rounded-full border-2"
          style={{ 
            borderColor: color,
            width: '100%',
            height: '100%'
          }}
          animate={isActive ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
            rotate: 180
          } : { scale: 1, opacity: 0.1 }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Core */}
        <motion.div
          className="relative rounded-full backdrop-blur-sm"
          style={{ 
            width: size * 0.6,
            height: size * 0.6,
            backgroundColor: `${color}40`, // 25% opacity
            border: `1px solid ${color}`,
            boxShadow: isActive ? `0 0 15px ${color}60` : 'none'
          }}
          animate={isActive ? {
            scale: [1, 1.1, 1],
          } : { scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Status Dot */}
        {isActive && (
            <motion.div
                className="absolute rounded-full"
                style={{ width: 4, height: 4, backgroundColor: '#fff' }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />
        )}
      </div>
      {label && (
        <span className="text-sm font-medium tracking-wider uppercase opacity-80" style={{ color }}>
            {label}
        </span>
      )}
    </div>
  );
};
