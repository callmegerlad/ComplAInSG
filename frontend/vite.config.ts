import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Backend URL for the dev-server proxy.
// In Docker this is set to http://backend:8000 via docker-compose env.
// Locally it defaults to http://localhost:8000.
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
const backendWs = backendUrl.replace(/^http/, 'ws')

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    // Listen on all interfaces (required for Docker)
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // REST endpoints
      '/incidents': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/health': {
        target: backendUrl,
        changeOrigin: true,
      },
      // WebSocket endpoint
      '/ws': {
        target: backendWs,
        ws: true,
      },
    },
  },
})
