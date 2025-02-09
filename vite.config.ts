import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


export default defineConfig({
  plugins: [react()],
  server: {
    // This ensures proper MIME types for WebAssembly files
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // This tells Vite how to handle WebAssembly files
  optimizeDeps: {
    exclude: ['@vite/client', '@vite/env']
  },
  build: {
    target: 'esnext',
    // Ensure WebAssembly files are copied to the dist folder
    assetsInclude: ['**/*.wasm']
  }
});