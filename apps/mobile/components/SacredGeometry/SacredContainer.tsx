import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

const StyledView = styled(View);

interface SacredContainerProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light' | 'cosmic';
}

export const SacredContainer: React.FC<SacredContainerProps> = ({
  children,
  variant = 'cosmic',
  style,
  ...props
}) => {
  if (variant === 'cosmic') {
    return (
      <LinearGradient
        colors={['#111827', '#1a1c2e', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.container, style]}
      >
        <StyledView className="flex-1 w-full" {...props}>
          {children}
        </StyledView>
      </LinearGradient>
    );
  }

  const bgColors = {
    dark: '#111827',
    light: '#f9fafb',
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColors[variant] }, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
