import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Dev server proxy — avoids CORS issues locally and mirrors production routing
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL
            ? env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:4444',
          changeOrigin: true,
          secure: false,
        }
      }
    },

    // Build output goes to dist/
    build: {
      outDir: 'dist',
      sourcemap: false,
    },

    // Make env vars available
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    }
  }
})
