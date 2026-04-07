import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},           // 👈 this fixes the error
    'process.env.NODE_ENV': '"development"',
  },
  optimizeDeps: {
    include: [
      '@wordpress/format-library',
      '@wordpress/block-editor',
      '@wordpress/blocks',
      '@wordpress/components',
      '@wordpress/block-library',
      '@wordpress/data',
      '@wordpress/element',
      '@wordpress/rich-text',
      'path-browserify',
    ]
  },
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
      'path': 'path-browserify',
    }
  }
});