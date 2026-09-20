import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias @ → src/ para imports limpios
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: true,
    port: 5173,
    // Si el 5173 está ocupado, fallar en vez de saltar al 5174: el backend
    // solo permite por CORS el origen de FRONTEND_URL, y el salto silencioso
    // de puerto rompe el login sin decir por qué.
    strictPort: true,
    proxy: {
      // Proxy para evitar CORS en desarrollo
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
