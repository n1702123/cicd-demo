import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import Redis from 'ioredis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
const PORT = process.env.PORT ?? 3000

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } else if (req.method === 'GET' && req.url === '/api/counter') {
    const count = (await redis.get('counter')) ?? 0
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count: Number(count) }))
  } else if (req.method === 'POST' && req.url === '/api/counter') {
    const count = await redis.incr('counter')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count }))
  } else if (req.method === 'GET' && req.url === '/api/info') {
    let redisStatus = 'unknown'
    try {
      await redis.ping()
      redisStatus = 'connected'
    } catch {
      redisStatus = 'error'
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      hostname: os.hostname(),
      nodeEnv: process.env.NODE_ENV ?? 'development',
      port: PORT,
      redisUrl: process.env.REDIS_URL ? 'REDIS_URL (Railway)' : 'localhost:6379 (local)',
      redisStatus,
    }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
