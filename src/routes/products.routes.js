const express = require('express')
const { PrismaClient } = require('@prisma/client')
const router = express.Router()
const prisma = new PrismaClient()

// Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    
    let whereClause = {}
    
    // Fix: Don't parse category as integer since it's a UUID string
    if (category && category !== 'all') {
      whereClause.category_id = category  // Use the category string directly
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const items = await prisma.items.findMany({
      where: whereClause,
      include: {
        categories: true  // Note: Use 'categories' not 'category' based on your schema
      }
    })
    
    // Transform data to match frontend expectations
    const products = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.categories?.name || 'Uncategorized',
      price: parseFloat(item.price),
      originalPrice: null,
      image: item.image_url || '/placeholder.svg?height=200&width=200',
      rating: 4.5,
      reviews: 0,
      description: item.description,
      isNew: false,
      isFavorite: false,
      inStock: item.stock_quantity > 0,
      stockQuantity: item.stock_quantity
    }))
    
    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    })
  }
})

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const item = await prisma.items.findUnique({
      where: { id: id }, // Don't parse as integer since it's a UUID
      include: {
        categories: true
      }
    })
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    const product = {
      id: item.id,
      name: item.name,
      category: item.categories?.name || 'Uncategorized',
      price: parseFloat(item.price),
      originalPrice: null,
      image: item.image_url || '/placeholder.svg?height=200&width=200',
      rating: 4.5,
      reviews: 0,
      description: item.description,
      isNew: false,
      isFavorite: false,
      inStock: item.stock_quantity > 0,
      stockQuantity: item.stock_quantity
    }
    
    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    })
  }
})

module.exports = router