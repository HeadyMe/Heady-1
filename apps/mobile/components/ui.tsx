import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { styled } from 'nativewind';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LinearGradient } from 'expo-linear-gradient';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Card Component
export const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <View className={cn("bg-white rounded-xl p-4 shadow-sm border border-gray-100", className)}>
    {children}
  </View>
);

// Gradient Card Component
interface GradientCardProps {
    className?: string;
    children: React.ReactNode;
    colors?: readonly [string, string, ...string[]];
}

export const GradientCard = ({ className, children, colors = ['#4c669f', '#3b5998', '#192f6a'] }: GradientCardProps) => (
    <LinearGradient
        colors={colors as any}
        className={cn("rounded-xl p-4 shadow-sm", className)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
    >
        {children}
    </LinearGradient>
);

// Button Component
interface ButtonProps {
    onPress?: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
    className?: string;
    textClassName?: string;
    icon?: React.ReactNode;
}

export const Button = ({ onPress, title, variant = 'primary', className, textClassName, icon }: ButtonProps) => {
    const baseStyle = "py-3 px-6 rounded-lg items-center justify-center flex-row active:opacity-80";
    const variants = {
        primary: "bg-blue-600",
        secondary: "bg-gray-800",
        outline: "bg-transparent border border-gray-300",
        gradient: "bg-transparent", // handled by wrapper if needed, but for now we'll just simulate
    };
    const textBaseStyle = "font-bold text-base";
    const textVariants = {
        primary: "text-white",
        secondary: "text-white",
        outline: "text-gray-800",
        gradient: "text-white"
    };

    if (variant === 'gradient') {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} className={className}>
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    className={baseStyle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={cn(textBaseStyle, textVariants[variant], textClassName)}>
                        {title}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity 
            onPress={onPress} 
            className={cn(baseStyle, variants[variant], className)}
        >
            {icon && <View className="mr-2">{icon}</View>}
            <Text className={cn(textBaseStyle, textVariants[variant], textClassName)}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

// Metric Card Component
interface MetricCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    className?: string;
    variant?: 'default' | 'gradient';
}

export const MetricCard = ({ title, value, icon, trend, trendType = 'neutral', className, variant = 'default' }: MetricCardProps) => {
    const trendColors = {
        up: variant === 'gradient' ? "text-green-200" : "text-green-500",
        down: variant === 'gradient' ? "text-red-200" : "text-red-500",
        neutral: variant === 'gradient' ? "text-gray-300" : "text-gray-500"
    };

    const textColor = variant === 'gradient' ? "text-white" : "text-gray-900";
    const subTextColor = variant === 'gradient' ? "text-blue-100" : "text-gray-500";

    const Content = () => (
        <>
            <View className="flex-row justify-between items-start mb-2">
                <Text className={cn(subTextColor, "text-sm font-medium")}>{title}</Text>
                {icon && <View className="opacity-80">{icon}</View>}
            </View>
            <Text className={cn(textColor, "text-2xl font-bold mb-1")}>{value}</Text>
            {trend && (
                <Text className={cn("text-xs font-medium", trendColors[trendType])}>
                    {trend}
                </Text>
            )}
        </>
    );

    if (variant === 'gradient') {
        return (
            <GradientCard colors={['#3B82F6', '#2563EB'] as const} className={cn("flex-1 min-w-[150px]", className)}>
                <Content />
            </GradientCard>
        );
    }

    return (
        <Card className={cn("flex-1 min-w-[150px]", className)}>
            <Content />
        </Card>
    );
};
