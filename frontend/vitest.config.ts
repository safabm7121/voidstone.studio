import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    deps: {
      optimizer: {
        web: {
          include: ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
        },
      },
    },
    server: {
      deps: {
        inline: ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
      },
    },
  },
});