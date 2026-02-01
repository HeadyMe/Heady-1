import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env.local to get the configured PORT
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });

const BACKEND_PORT = process.env.PORT || 4100;

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': `http://localhost:${BACKEND_PORT}`,
      '/socket.io': {
        target: `ws://localhost:${BACKEND_PORT}`,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@heady/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@heady/task-manager': path.resolve(__dirname, '../../packages/task-manager/src/index.ts'),
      '@heady/core-domain': path.resolve(__dirname, '../../packages/core-domain/src/index.ts'),
    },
  },
});
