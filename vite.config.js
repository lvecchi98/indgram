import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In produzione (build) l'app è servita da GitHub Pages sotto /indgram/,
// in sviluppo resta alla radice (http://localhost:5173/).
// Vite, "Deploying a Static Site" → GitHub Pages.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/indgram/' : '/',
  plugins: [react()],
  server: { host: true, port: 5173 },
}));
