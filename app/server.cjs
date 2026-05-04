// Dev-only Express server on port 3001.
// Handles file writes for famDiagram.json and scenarios-overrides.json.
// Start via: npm run dev (concurrently with Vite) or npm run server

const express = require('express')
const cors    = require('cors')
const fs      = require('fs')
const path    = require('path')

const app     = express()
const DATA    = path.join(__dirname, 'src', 'data')
const DIAGRAM  = path.join(DATA, 'famDiagram.json')
const OVERRIDES = path.join(DATA, 'scenarios-overrides.json')
const OVERVIEW  = path.join(DATA, 'overviewLayout.json')

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json({ limit: '2mb' }))

// ── Diagram ──────────────────────────────────────────────────────────────────

app.get('/api/diagram', (_req, res) => {
  if (!fs.existsSync(DIAGRAM)) return res.status(404).json({ error: 'not found' })
  try {
    res.json(JSON.parse(fs.readFileSync(DIAGRAM, 'utf8')))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/diagram', (req, res) => {
  try {
    fs.writeFileSync(DIAGRAM, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// ── Scenarios overrides ───────────────────────────────────────────────────────

app.get('/api/scenarios-overrides', (_req, res) => {
  if (!fs.existsSync(OVERRIDES)) return res.status(404).json({ error: 'not found' })
  try {
    res.json(JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/scenarios-overrides', (req, res) => {
  try {
    fs.writeFileSync(OVERRIDES, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// ── Overview layout ───────────────────────────────────────────────────────────

app.get('/api/overview-layout', (_req, res) => {
  if (!fs.existsSync(OVERVIEW)) return res.status(404).json({ error: 'not found' })
  try {
    res.json(JSON.parse(fs.readFileSync(OVERVIEW, 'utf8')))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/overview-layout', (req, res) => {
  try {
    fs.writeFileSync(OVERVIEW, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// ─────────────────────────────────────────────────────────────────────────────

app.listen(3001, () => {
  console.log('[FAM dev server] listening on http://localhost:3001')
})
