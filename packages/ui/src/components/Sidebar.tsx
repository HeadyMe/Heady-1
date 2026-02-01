import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  bottomItems?: SidebarItem[];
  className?: string;
  style?: React.CSSProperties;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  bottomItems,
  className,
  style 
}) => {
  return (
    <div 
      className={className}
      style={{
        width: '50px',
        backgroundColor: '#18181b', // Zinc-900
        borderRight: '1px solid #27272a', // Zinc-800
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem 0',
        ...style
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        {items.map((item) => (
          <SidebarButton key={item.id} item={item} />
        ))}
      </div>

      {bottomItems && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bottomItems.map((item) => (
            <SidebarButton key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarButton: React.FC<{ item: SidebarItem }> = ({ item }) => {
  const { icon: Icon, label, onClick, isActive } = item;
  
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        color: isActive ? '#fff' : '#71717a', // Zinc-500 inactive, White active
        position: 'relative',
        transition: 'color 0.2s ease'
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '24px',
          backgroundColor: '#00ff9d',
          borderRadius: '0 2px 2px 0'
        }} />
      )}
      <Icon size={24} strokeWidth={1.5} />
    </button>
  );
};
