import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: '/rumi',
  build: {
    emptyOutDir: true,
    outDir: '../dist',
  },
  server: {
    port: 5000,
    open: true,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@@', replacement: path.resolve(__dirname) },
    ],
  },
  plugins: [tailwindcss()],
});
