import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/VisionStudio/', // Exact repository name base path for GitHub Pages
  server: {
    port: 3000,
    open: true
  }
})
