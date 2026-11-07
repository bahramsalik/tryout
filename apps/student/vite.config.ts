import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const sharedDir = fileURLToPath(new URL('../../shared', import.meta.url));
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': sharedDir,
      '@': srcDir,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [appDir, sharedDir] },
  },
  preview: { port: 5173, strictPort: true },
});
