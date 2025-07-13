const express = require('express')
const { PrismaClient } = require('@prisma/client')
const router = express.Router()
const prisma = new PrismaClient()

// Get all categories with product counts
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    })
    
    // Add "All" category
    const totalProducts = await prisma.items.count()
  
    const categoriesWithCounts = [
      {
        id: 'all',
        name: 'All Products',
        count: totalProducts
      },
      ...categories.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        count: cat._count.items
      }))
    ]
    
    res.json({
      success: true,
      data: categoriesWithCounts
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    })
  }
})

module.exports = router