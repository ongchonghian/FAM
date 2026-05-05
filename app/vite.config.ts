import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve(__dirname, 'src/data')

const API_FILES: Record<string, string> = {
  '/api/diagram':             'famDiagram.json',
  '/api/overview-layout':     'overviewLayout.json',
  '/api/scenarios-overrides': 'scenarios-overrides.json',
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-server',
      configureServer(server) {
        // Redirect / to the shell
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') req.url = '/peppol-wiki.html'
          next()
        })

        // File-backed API — replaces server.cjs
        server.middlewares.use((req, res, next) => {
          const file = API_FILES[req.url?.split('?')[0] ?? '']
          if (!file) return next()

          const filePath = path.join(DATA_DIR, file)
          res.setHeader('Content-Type', 'application/json')

          if (req.method === 'GET') {
            if (!fs.existsSync(filePath)) { res.statusCode = 404; res.end('{}'); return }
            res.end(fs.readFileSync(filePath, 'utf8'))
          } else if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
            req.on('end', () => {
              fs.writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2))
              res.end('{"ok":true}')
            })
          } else {
            next()
          }
        })
      },
    },
  ],
})
