import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // 👈 yahan apna custom port likho (5173 ke bajaye)
  },
});
