import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The frontend talks to Django through this proxy, so the browser only ever
// sees one origin (no CORS setup needed). In Docker the target is the
// `backend` service.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
