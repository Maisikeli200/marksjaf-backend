require('dotenv').config()
const app = require('./src/app')
const { createServer } = require('http')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 3001

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.marksjafkitchen.com.ng',
      'https://backend-production-a47c.up.railway.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Desktop client connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('🔌 Desktop client disconnected:', socket.id)
  })
})

// Make io available globally
global.io = io

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🛍️ Products API: http://localhost:${PORT}/api/v1/products`)
  console.log(`📂 Categories API: http://localhost:${PORT}/api/v1/categories`)
  console.log(`🔌 Socket.IO server ready for desktop notifications`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})
