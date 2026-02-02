import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

interface SacredCardProps extends ViewProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'glass' | 'solid' | 'holographic';
  glowing?: boolean;
}

export const SacredCard: React.FC<SacredCardProps> = ({
  children,
  title,
  variant = 'glass',
  glowing = false,
  style,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'bg-gray-900/60 border border-white/10';
      case 'solid':
        return 'bg-gray-900 border border-gray-800';
      case 'holographic':
        return 'bg-purple-900/20 border border-purple-500/30';
      default:
        return 'bg-gray-900/60 border border-white/10';
    }
  };

  const glowClasses = glowing ? 'shadow-lg shadow-purple-500/30' : '';

  return (
    <StyledView 
      className={`rounded-xl overflow-hidden ${getVariantClasses()} ${glowClasses}`}
      style={style}
      {...props}
    >
      {title && (
        <StyledView className="px-4 py-3 border-b border-white/5 flex-row items-center gap-2">
          {/* Sacred decorative dot - represented as a small view since we don't have shadow props easily in nativewind without more config */}
          <StyledView className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <StyledText className="text-lg font-medium text-white/90 tracking-wide">
            {title}
          </StyledText>
        </StyledView>
      )}
      <StyledView className="p-4">
        {children}
      </StyledView>
    </StyledView>
  );
};
