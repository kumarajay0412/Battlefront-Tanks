import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3'],
  build: {
    // Disable generating source maps in production
    sourcemap: false,
  },
  esbuild: {
    // Drop console.log in production
    drop: ['console', 'debugger'],
  },
})
