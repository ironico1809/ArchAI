import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,
    port: 443,
    open: true,
    allowedHosts: [
      'main.d2nlfe2rkbsyt.amplifyapp.com',
      '.amplifyapp.com',
      'localhost'
    ]
  }
})
