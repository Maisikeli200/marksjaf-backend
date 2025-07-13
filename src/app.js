const express = require('express')
const cors = require('cors')
const path = require('path') // Add this import
const { sanitizeInput } = require('./middleware/sanitization')
const authRoutes = require('./routes/auth.routes')
const productsRoutes = require('./routes/products.routes')
const categoriesRoutes = require('./routes/categories.routes')
const userRoutes = require('./routes/user.routes')
const orderRoutes = require('./routes/order.routes');
const consultancyRoutes = require('./routes/consultancy.routes');
const contactRoutes = require('./routes/contact.routes');
const helmet = require('helmet')

// Initialize Express app
const app = express()

// Middleware
app.use('/api/v1/orders/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://www.marksjafkitchen.com.ng',
    'https://backend-production-a47c.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Add global input sanitization
app.use(sanitizeInput)

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/consultancy', consultancyRoutes);
app.use('/api/v1/contact', contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Add security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Start server only if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🛍️ Products API: http://localhost:${PORT}/api/v1/products`)
    console.log(`📂 Categories API: http://localhost:${PORT}/api/v1/categories`)
  })
}

module.exports = app