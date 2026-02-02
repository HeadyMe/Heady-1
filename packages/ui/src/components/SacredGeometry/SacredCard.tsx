import React from 'react';
import { cn } from '../../utils/cn';

export interface SacredCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'glass' | 'solid' | 'holographic';
  glowing?: boolean;
}

export const SacredCard: React.FC<SacredCardProps> = ({ 
  children, 
  title, 
  className,
  variant = 'glass',
  glowing = false 
}) => {
  const variants = {
    glass: "bg-gray-900/40 backdrop-blur-xl border border-white/10",
    solid: "bg-gray-900 border border-gray-800",
    holographic: "bg-gradient-to-br from-gray-900/80 to-purple-900/20 backdrop-blur-md border border-purple-500/30"
  };

  return (
    <div className={cn(
      "rounded-xl overflow-hidden transition-all duration-300",
      variants[variant],
      glowing && "shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]",
      className
    )}>
      {title && (
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          {/* Sacred decorative dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
          <h3 className="text-lg font-medium text-white/90 tracking-wide font-sans">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4 text-gray-300">
        {children}
      </div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10 rounded-tl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10 rounded-br-xl pointer-events-none" />
    </div>
  );
};
