import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'react-vendor'
          }
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui-vendor'
          }
          if (id.includes('axios') || id.includes('socket.io-client')) {
            return 'network-vendor'
          }
          if (id.includes('katex') || id.includes('marked') || id.includes('react-markdown')) {
            return 'markdown-vendor'
          }
          return 'vendor'
        },
      },
    },
  },
})