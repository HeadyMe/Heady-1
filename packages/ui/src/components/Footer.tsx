import React from 'react';

export interface FooterProps {
  className?: string;
  style?: React.CSSProperties;
  companyName?: string;
  year?: number;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  style = {},
  companyName = 'Heady Systems',
  year = new Date().getFullYear(),
}) => {
  return (
    <footer 
      className={`w-full py-6 mt-auto border-t border-gray-200 dark:border-gray-800 ${className}`}
      style={{
        padding: '1.5rem 0',
        marginTop: 'auto',
        borderTop: '1px solid #333',
        width: '100%',
        backgroundColor: 'transparent',
        ...style
      }}
    >
      <div 
        className="container mx-auto px-4 flex flex-col items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: '#888'
        }}
      >
        <p style={{ margin: 0 }}>
          &copy; {year} {companyName}. All rights reserved.
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="flex items-center gap-1">
          Made with <span style={{ color: '#ef4444', display: 'inline-block' }} className="text-red-500 animate-pulse">❤️</span> by Heady Systems
        </p>
      </div>
    </footer>
  );
};
