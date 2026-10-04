import { defineConfig } from 'vite';

export default defineConfig({
  // webxdc serves the archive from an arbitrary origin path — emit
  // relative asset URLs so the bundle works wherever it is installed.
  base: './',
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    target: 'esnext',
  },
});
