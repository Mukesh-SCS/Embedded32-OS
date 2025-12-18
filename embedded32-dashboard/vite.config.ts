import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    middlewareMode: false,
    strictPort: false,  // Use next available port if 5173 is taken
  },
  build: {
    // Increase chunk size warning limit (Recharts is large)
    chunkSizeWarningLimit: 600,
    // Optimize chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Recharts into its own chunk for lazy loading
          recharts: ['recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts'],
  },
});
