export const sacredTokens = {
  colors: {
    core: '#4fd1c5',      // Teal
    network: '#63b3ed',   // Blue
    intelligence: '#9f7aea', // Purple
    alert: {
      critical: '#f56565',
      warning: '#ed8936',
      success: '#48bb78',
      info: '#4299e1',
    },
    background: {
      dark: '#1a202c',
      cosmic: '#0f172a', // Darker slate
    }
  },
  animations: {
    breathe: 'breathing 4s ease-in-out infinite',
    pulse: 'pulsing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    float: 'floating 6s ease-in-out infinite',
    spin: 'spinning 10s linear infinite',
  },
  keyframes: {
    breathing: {
      '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
      '50%': { transform: 'scale(1.05)', opacity: '1' },
    },
    pulsing: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    floating: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    spinning: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    }
  }
};
