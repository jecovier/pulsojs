import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: '/rumi',
  build: {
    //minify: 'terser',
    emptyOutDir: true,
    outDir: '../dist',
    reportCompressedSize: true,
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    //   mangle: true,
    // },
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
