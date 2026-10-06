import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default {
  publicDir: 'assets',
  plugins: [react(), tailwindcss()],
  resolve: {
    // Le projet vit dans OneDrive : ses fichiers sont des « reparse points » que le résolveur de
    // Vite 8 (Rolldown) ne sait pas suivre — aucun paquet de node_modules n'est alors trouvé.
    // Ne pas résoudre les liens contourne le problème (le projet n'utilise aucun paquet lié).
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
};
