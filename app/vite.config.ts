import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'root-to-shell',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') req.url = '/peppol-wiki.html'
          next()
        })
      },
    },
  ],
})
