'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SacredContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'cosmic';
}

export const SacredContainer: React.FC<SacredContainerProps> = ({
  children,
  className,
  variant = 'cosmic'
}) => {
  const backgrounds = {
    dark: 'bg-gray-900',
    light: 'bg-gray-50',
    cosmic: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#1a1c2e] to-black'
  };

  return (
    <div className={cn(
      "min-h-screen w-full relative overflow-hidden font-sans",
      backgrounds[variant],
      className
    )}>
      {/* Background Mesh/Noise Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
           }} 
      />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
