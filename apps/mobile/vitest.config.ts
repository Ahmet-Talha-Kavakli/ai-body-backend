import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules/**', 'e2e/**', '.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        external: ['react-native'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  ssr: {
    external: ['react-native'],
  },
});
