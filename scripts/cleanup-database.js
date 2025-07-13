const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Step 1: Delete order_items first (child table)
    console.log('📦 Deleting order_items...');
    const deletedOrderItems = await prisma.order_items.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);
    
    // Step 2: Delete orders (parent table)
    console.log('🛒 Deleting orders...');
    const deletedOrders = await prisma.orders.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);
    
    // Step 3: Delete consultancy_bookings
    console.log('📅 Deleting consultancy_bookings...');
    const deletedBookings = await prisma.consultancy_bookings.deleteMany({});
    console.log(`✅ Deleted ${deletedBookings.count} consultancy bookings`);
    
    // Step 4: Delete related records for food items first
    console.log('🗂️ Deleting related records for food items...');
    
    // Get food item IDs first
    const foodItems = await prisma.items.findMany({
      where: { type: 'food' },
      select: { id: true }
    });
    const foodItemIds = foodItems.map(item => item.id);
    
    if (foodItemIds.length > 0) {
      // Delete inventory_history for food items
      const deletedInventoryHistory = await prisma.inventory_history.deleteMany({
        where: {
          item_id: {
            in: foodItemIds
          }
        }
      });
      console.log(`✅ Deleted ${deletedInventoryHistory.count} inventory history records`);
      
      // Delete item_sales for food items
      const deletedItemSales = await prisma.item_sales.deleteMany({
        where: {
          item_id: {
            in: foodItemIds
          }
        }
      });
      console.log(`✅ Deleted ${deletedItemSales.count} item sales records`);
      
      // Delete favorites for food items
      const deletedFavorites = await prisma.favorites.deleteMany({
        where: {
          item_id: {
            in: foodItemIds
          }
        }
      });
      console.log(`✅ Deleted ${deletedFavorites.count} favorites records`);
      
      // Delete ratings_and_reviews for food items
      const deletedRatingsReviews = await prisma.ratings_and_reviews.deleteMany({
        where: {
          item_id: {
            in: foodItemIds
          }
        }
      });
      console.log(`✅ Deleted ${deletedRatingsReviews.count} ratings and reviews records`);
      
      // Delete reviews for food items
      const deletedReviews = await prisma.reviews.deleteMany({
        where: {
          item_id: {
            in: foodItemIds
          }
        }
      });
      console.log(`✅ Deleted ${deletedReviews.count} reviews records`);
    }
    
    // Step 5: Now delete food items
    console.log('🍽️ Deleting food items...');
    const deletedFoodItems = await prisma.items.deleteMany({
      where: {
        type: 'food'
      }
    });
    console.log(`✅ Deleted ${deletedFoodItems.count} food items`);
    
    // Optional: Show remaining items (medicine)
    const remainingItems = await prisma.items.count({
      where: {
        type: 'medicine'
      }
    });
    console.log(`ℹ️ Remaining medicine items: ${remainingItems}`);
    
    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('✨ Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });