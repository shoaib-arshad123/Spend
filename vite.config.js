import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isVercel = Boolean(process.env.VERCEL)
const isDev = process.env.NODE_ENV === 'development'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: isDev ? '/' : isVercel ? '/' : '/Spend/',

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})