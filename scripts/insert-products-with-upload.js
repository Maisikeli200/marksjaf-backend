const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Creating uploads directory:', uploadsDir);
}

// Function to copy image and return new URL
function copyImageToUploads(imageName, productName) {
  try {
    const frontendImagePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'items-images', productName, imageName);
    
    if (!fs.existsSync(frontendImagePath)) {
      console.log(`Image not found: ${frontendImagePath}`);
      return '/placeholder.svg?height=200&width=200';
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(imageName);
    const newFileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}${extension}`;
    const newImagePath = path.join(uploadsDir, newFileName);
    
    // Copy file
    fs.copyFileSync(frontendImagePath, newImagePath);
    
    // Return full URL that matches frontend's API configuration
    const serverUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000';
    return `${serverUrl}/uploads/products/${newFileName}`;
  } catch (error) {
    console.error(`Error copying image for ${productName}:`, error.message);
    return '/placeholder.svg?height=200&width=200';
  }
}

// Image mapping function
function getProductImageUrl(productName) {
  // Use functions instead of immediate calls
  const imageMapping = {
    '1 Egg Boiled and Fried': () => copyImageToUploads('item18_1.jpg', '1_Egg_Boiled_and_Fried'),
    'Apple Drink': () => copyImageToUploads('item58_1.jpg', 'Apple_Drink'),
    'Baobab Drink': () => copyImageToUploads('item79_1.jpg', 'Baobab_Drink'),
    'Basbousa': () => copyImageToUploads('item8_1.jpg', 'Basbousa'),
    'Beef': () => copyImageToUploads('item73_1.jpg', 'Beef'),
    'Biryani': () => copyImageToUploads('item36_1.jpg', 'Biryani'),
    'Bukhari': () => copyImageToUploads('item41_1.jpg', 'Bukhari'),
    'Cabbage Roll (Rice and Meat)': () => copyImageToUploads('item47_2.jpg', 'Cabbage_Roll_(RiceandMeat)'),
    'Chicken Part': () => copyImageToUploads('item20_1.jpg', 'Chicken_Part'),
    'Coleslaw': () => copyImageToUploads('item65_2.jpg', 'Coleslaw'),
    'Cow Head and Leg': () => copyImageToUploads('item70_2.jpg', 'Cow_Head_and_Leg'),
    'Cow Tail': () => copyImageToUploads('item69_2.jpg', 'Cow_Tail'),
    'Dambun Tsaki': () => copyImageToUploads('item13_2.jpg', 'Dambun_Tsaki'),
    'Dan Waken Gari': () => copyImageToUploads('item15_1.jpg', 'Dan_Waken_Gari'),
    'Danwaken Flour': () => copyImageToUploads('item14_1.jpg', 'Danwaken_Flour'),
    'Fatan Acca': () => copyImageToUploads('item11_2.jpg', 'Fatan_Acca'),
    'Fatan Doya': () => copyImageToUploads('item4_1.jpg', 'Fatan_Doya'),
    'Fatan Shinkafa': () => copyImageToUploads('item12_1.jpg', 'Fatan_Shinkafa'),
    'Fatan Wake': () => copyImageToUploads('item10_1.jpg', 'Fatan_Wake'),
    'Fatira Bael Bael with Meat': () => copyImageToUploads('item43_1.jpg', 'Fatira_Bael_Bael_with_Meat'),
    'Fatira Bael Bayd': () => copyImageToUploads('item42_2.jpg', 'Fatira_Bael_Bayd'),
    'Fresh Fish': () => copyImageToUploads('item72_2.jpg', 'Fresh_Fish'),
    'Fresh Rama': () => copyImageToUploads('item66_1.jpg', 'Fresh_Rama'),
    'Fresh Zogale da Kuli': () => copyImageToUploads('item67_2.jpg', 'Fresh_Zogale_da_Kuli'),
    'Fried Rice': () => copyImageToUploads('item34_1.jpg', 'Fried_Rice'),
    'Full Watamis (Gurasa & Beans)': () => copyImageToUploads('item68_1.jpg', 'Full_Watamis_(Gurasa_&_Beans)'),
    'Fura Tamba & Yogurt': () => copyImageToUploads('item62_1.jpg', 'Fura_Tamba_&_Yogurt'),
    'Ginger Drink': () => copyImageToUploads('item51_1.jpg', 'Ginger_Drink'),
    'Golden Yam': () => copyImageToUploads('item3_2.jpg', 'Golden_Yam'),
    'Haniyat Nahal': () => copyImageToUploads('item9_1.jpg', 'Haniyat_Nahal'),
    'Ice Cream': () => copyImageToUploads('item60_1.jpg', 'Ice_Cream'),
    'Indomie': () => copyImageToUploads('item17_1.jpg', 'Indomie'),
    'Jollof Rice': () => copyImageToUploads('item33_2.jpg', 'Jellof_Rice'),
    'Kabuli': () => copyImageToUploads('item38_1.jpg', 'Kabuli'),
    'Kashmiri': () => copyImageToUploads('item40_2.jpg', 'Kashmiri'),
    'Koko': () => copyImageToUploads('item1_2.jpg', 'Koko'),
    'Kosai': () => copyImageToUploads('item2_1.jpg', 'Kosai'),
    'Kunun Aya': () => copyImageToUploads('item49_1.jpg', 'Kunun_Aya'),
    'Kunun Gyada': () => copyImageToUploads('item54_2.jpg', 'Kunun_Gyada'),
    'Kunun Tamba': () => copyImageToUploads('item55_1.jpg', 'Kunun_Tamba'),
    'Kunu': () => copyImageToUploads('item48_1.jpg', 'Kunun_Zaki'),
    'Fresh Orange Juice': () => copyImageToUploads('item56_2.jpg', 'Orange_Drink'),
    'Pineapple Juice': () => copyImageToUploads('item57_1.jpg', 'Pineapple_Drink'),
    'Watermelon Juice': () => copyImageToUploads('item59_1.jpg', 'Water_Melon_Drink'),
    'Zobo': () => copyImageToUploads('item50_1.jpg', 'Zobo_Drink'),
    'Lemon Juice': () => copyImageToUploads('item53_1.jpg', 'Lemon_Juice'),
    'Liver Sauce and Gurasa': () => copyImageToUploads('item80_1.jpg', 'Liver_Souce_and_Gurasa'),
    'Macaroni': () => copyImageToUploads('item16_2.jpg', 'Macaroni_per_Plate'),
    'Mandi': () => copyImageToUploads('item37_2.jpg', 'Mandi'),
    'Manshanu': () => copyImageToUploads('item74_2.jpg', 'Manshanu'),
    'Masa': () => copyImageToUploads('item6_1.jpg', 'Masa_(5_pcs)'),
    'Meat Pie': () => copyImageToUploads('item44_1.jpg', 'Meat_Pie'),
    'Miya Kuka': () => copyImageToUploads('item26_1.jpg', 'Miyan_Kuka'),
    'Miya Kubewa': () => copyImageToUploads('item28_2.jpg', 'Miyan_Kubewa'),
    'Miya Taushe': () => copyImageToUploads('item30_2.jpg', 'Miyan_Taushe'),
    'Miya Wake': () => copyImageToUploads('item27_1.jpg', 'Miyan_Wake'),
    'Miyan Dubba': () => copyImageToUploads('item31_1.jpg', 'Miyan_Dubba'),
    'Miyan Shuwaka': () => copyImageToUploads('item29_1.jpg', 'Miyan_Shuwaka'),
    'Normal Yaji': () => copyImageToUploads('item77_2.jpg', 'Normal_Yaji'),
    'Offal and Kayan Ciki': () => copyImageToUploads('item71_1.jpg', 'Offal_and_Kayan_Ciki'),
    'Sakwara': () => copyImageToUploads('item5_1.jpg', 'Sakwara'),
    'Garden Salad': () => copyImageToUploads('item64_1.jpg', 'Salad'),
    'Shawarma Beef': () => copyImageToUploads('item46_2.jpg', 'Shawarma_Beef'),
    'Shawarma Chicken': () => copyImageToUploads('item45_1.jpg', 'Shawarma_Chicken'),
    'Shayi Bil Ananas (Pineapple)': () => copyImageToUploads('item78_1.jpg', 'Shayi_Bil_Ananas_(Pineapple)'),
    'Sinasir': () => copyImageToUploads('item7_1.jpg', 'Sinasir'),
    'Smoothie': () => copyImageToUploads('item61_2.jpg', 'Smoothie'),
    'Soya Milk': () => copyImageToUploads('item63_2.jpg', 'Soya_Milk'),
    'Tamarin Drink': () => copyImageToUploads('item52_2.jpg', 'Tamarin_Drink'),
    'Tuwo Dawa': () => copyImageToUploads('item24_1.jpg', 'Tuwon_Acha'),
    'Tuwo Masara': () => copyImageToUploads('item25_2.jpg', 'Tuwon_Alkama'),
    'Tuwo Shinkafa': () => copyImageToUploads('item23_1.jpg', 'Tuwon_Shinkafa'),
    'Rice and Stew': () => copyImageToUploads('item35_2.jpg', 'White_Rice_and_Stew'),
    'Yajin Kuli Kuli': () => copyImageToUploads('item75_2.jpg', 'Yajin_Kuli_Kuli'),
    'Yajin Tafarnuwa': () => copyImageToUploads('item76_1.jpg', 'Yajin_Tafarnuwa'),
    'Zibiriyani': () => copyImageToUploads('item39_1.jpg', 'Zibiriyani'),
    'Meat One Piece': () => copyImageToUploads('item19_1.jpg', 'Meat_One_Piece'),
    'Tuwon Semo': () => copyImageToUploads('item22_1.jpg', 'Tuwon_Semo'),
    'Chapman': () => copyImageToUploads('item50_1.jpg', 'Zobo_Drink'), // Using Zobo as fallback
    'Tiger Nut Drink': () => copyImageToUploads('item54_2.jpg', 'Kunun_Gyada'), // Using similar drink
    'Goat Meat Pepper Soup': () => copyImageToUploads('item73_1.jpg', 'Beef'), // Using meat as fallback
    'Fish Pepper Soup': () => copyImageToUploads('item72_2.jpg', 'Fresh_Fish'),
    'Chicken Pepper Soup': () => copyImageToUploads('item20_1.jpg', 'Chicken_Part'),
    'Cow Tail Pepper Soup': () => copyImageToUploads('item69_2.jpg', 'Cow_Tail')
  };
  
  // Check if we have a specific mapping for this product
  if (imageMapping[productName]) {
    return imageMapping[productName](); // Call the function!
  }
  
  // For products without specific images, provide category-based fallbacks
  return '/placeholder.svg?height=200&width=200';
}

async function createCategories() {
  const categoryData = [
    { name: 'Nigerian Traditional Food', description: 'Authentic Nigerian dishes and traditional meals' },
    { name: 'Rice Dishes', description: 'Various rice-based Nigerian meals' },
    { name: 'Pasta & Basics', description: 'Pasta dishes and basic food items' },
    { name: 'Traditional Breakfast', description: 'Nigerian breakfast and snack items' },
    { name: 'Tuwo', description: 'Traditional northern Nigerian tuwo base dishes' },
    { name: 'Miya', description: 'Traditional northern Nigerian sauces (served with Tuwo)' },
    { name: 'Salads & Sides', description: 'Side dishes and salads' },
    { name: 'Snacks', description: 'Nigerian snacks and finger foods' },
    { name: 'Beverages', description: 'Traditional and fresh drinks' },
    { name: 'Pepper Soup', description: 'Various types of Nigerian pepper soup' },
    { name: 'Health Supplements', description: 'Vitamins, minerals and health supplements' },
    { name: 'Beauty & Skincare', description: 'Beauty products and skincare items' },
    { name: 'Personal Care', description: 'Personal hygiene and care products' },
    { name: 'Health Devices', description: 'Health and wellness devices' },
    { name: 'Treatment Combinations', description: 'Herbal treatment combinations for various ailments' }
  ];

  const categories = {};
  
  for (const cat of categoryData) {
    // Check if category already exists
    let category = await prisma.categories.findFirst({
      where: { name: cat.name }
    });
    
    // If it doesn't exist, create it
    if (!category) {
      category = await prisma.categories.create({
        data: cat
      });
    }
    
    categories[cat.name] = category.id;
  }
  
  return categories;
}

async function insertNigerianFoodProducts(categories) {
  // Base Tuwo items (can be ordered alone)
  const tuwoItems = [
    { name: 'Tuwo Shinkafa', price: 800, category: 'Tuwo', description: 'Northern Nigerian rice pudding, soft and filling base dish' },
    { name: 'Tuwo Masara', price: 800, category: 'Tuwo', description: 'Traditional corn-based tuwo, a staple base dish in northern Nigeria' },
    { name: 'Tuwo Dawa', price: 800, category: 'Tuwo', description: 'Millet-based tuwo, nutritious traditional northern Nigerian base dish' }
  ];

  // Miya items (sauces - served with Tuwo)
  const miyaItems = [
    { name: 'Miya Kuka', price: 500, category: 'Miya', description: 'Traditional baobab leaf soup, rich in nutrients and flavor (served with Tuwo)' },
    { name: 'Miya Kubewa', price: 500, category: 'Miya', description: 'Pumpkin leaf soup, healthy and delicious northern Nigerian dish (served with Tuwo)' },
    { name: 'Miya Taushe', price: 500, category: 'Miya', description: 'Pumpkin soup with meat and spices, a northern Nigerian favorite (served with Tuwo)' },
    { name: 'Miya Yakuwa', price: 500, category: 'Miya', description: 'Onion leaf soup, flavorful traditional northern dish (served with Tuwo)' },
    { name: 'Miya Ganye', price: 500, category: 'Miya', description: 'Mixed vegetable soup, nutritious northern Nigerian sauce (served with Tuwo)' }
  ];

  // Other food products
  const otherFoodProducts = [
    // Pasta & Basics
    { name: 'Spaghetti Jollof', price: 3500, category: 'Pasta & Basics', description: 'Delicious Nigerian-style jollof spaghetti cooked with tomatoes, peppers, and aromatic spices' },
    { name: 'Macaroni', price: 3000, category: 'Pasta & Basics', description: 'Classic macaroni pasta prepared Nigerian style with rich tomato sauce' },
    { name: 'Indomie', price: 1500, category: 'Pasta & Basics', description: 'Popular instant noodles prepared with vegetables and Nigerian spices' },
    { name: 'Bread', price: 1000, category: 'Pasta & Basics', description: 'Fresh Nigerian bread, perfect for breakfast or as a side' },
    { name: 'Eba', price: 1500, category: 'Pasta & Basics', description: 'Traditional Nigerian staple made from cassava flour, served with various soups' },
    { name: 'Amala', price: 1500, category: 'Pasta & Basics', description: 'Popular Yoruba staple made from yam flour, dark and nutritious' },
    { name: 'Fufu', price: 1500, category: 'Pasta & Basics', description: 'Traditional Nigerian staple made from cassava, smooth and stretchy texture' },
    { name: 'Pounded Yam', price: 2000, category: 'Pasta & Basics', description: 'Classic Nigerian staple made from pounded yam, smooth and satisfying' },
    
    // Rice Dishes
    { name: 'Jollof Rice', price: 3500, category: 'Rice Dishes', description: 'Nigeria\'s most famous rice dish cooked in rich tomato sauce with spices' },
    { name: 'Fried Rice', price: 4000, category: 'Rice Dishes', description: 'Colorful Nigerian fried rice with vegetables, liver, and aromatic seasonings' },
    { name: 'Coconut Rice', price: 3500, category: 'Rice Dishes', description: 'Fragrant rice cooked in coconut milk with spices and vegetables' },
    { name: 'Rice and Stew', price: 3000, category: 'Rice Dishes', description: 'Plain rice served with rich Nigerian tomato stew' },
    { name: 'Ofada Rice', price: 4000, category: 'Rice Dishes', description: 'Local Nigerian rice variety served with spicy ofada stew' },
    { name: 'Rice and Beans', price: 3000, category: 'Rice Dishes', description: 'Nutritious combination of rice and beans cooked together with spices' },
    
    // Traditional Breakfast/Snacks
    { name: 'Akara', price: 1000, category: 'Traditional Breakfast', description: 'Deep-fried bean cakes, crispy outside and soft inside, perfect breakfast item' },
    { name: 'Moi Moi', price: 1500, category: 'Traditional Breakfast', description: 'Steamed bean pudding with eggs, fish, and vegetables' },
    { name: 'Yam and Egg', price: 2000, category: 'Traditional Breakfast', description: 'Boiled or fried yam served with scrambled eggs' },
    { name: 'Plantain and Egg', price: 2000, category: 'Traditional Breakfast', description: 'Fried plantain served with scrambled eggs' },
    { name: 'Bread and Egg', price: 1500, category: 'Traditional Breakfast', description: 'Fresh bread served with fried or scrambled eggs' },
    { name: 'Pancake', price: 2000, category: 'Traditional Breakfast', description: 'Nigerian-style pancakes, fluffy and delicious' },
    { name: 'Pap', price: 1000, category: 'Traditional Breakfast', description: 'Traditional corn pudding, smooth and nutritious breakfast option' },
    
    // Salads & Sides
    { name: 'Coleslaw', price: 2000, category: 'Salads & Sides', description: 'Fresh cabbage and carrot salad with creamy dressing' },
    { name: 'Garden Salad', price: 2500, category: 'Salads & Sides', description: 'Mixed fresh vegetables with lettuce, tomatoes, and cucumber' },
    { name: 'Potato Salad', price: 2500, category: 'Salads & Sides', description: 'Creamy potato salad with vegetables and mayonnaise' },
    
    // Snacks
    { name: 'Puff Puff', price: 1000, category: 'Snacks', description: 'Sweet deep-fried dough balls, popular Nigerian snack' },
    { name: 'Meat Pie', price: 1500, category: 'Snacks', description: 'Flaky pastry filled with seasoned minced meat and vegetables' },
    { name: 'Sausage Roll', price: 1500, category: 'Snacks', description: 'Pastry wrapped around seasoned sausage meat' },
    { name: 'Scotch Egg', price: 2000, category: 'Snacks', description: 'Hard-boiled egg wrapped in seasoned meat and breadcrumbs' },
    { name: 'Samosa', price: 1000, category: 'Snacks', description: 'Crispy triangular pastry filled with spiced meat or vegetables' },
    { name: 'Spring Roll', price: 1000, category: 'Snacks', description: 'Crispy rolls filled with vegetables and sometimes meat' },
    { name: 'Buns', price: 1000, category: 'Snacks', description: 'Sweet Nigerian buns, soft and fluffy snack' },
    { name: 'Doughnut', price: 1000, category: 'Snacks', description: 'Sweet fried dough rings, popular Nigerian treat' },
    { name: 'Chin Chin', price: 1500, category: 'Snacks', description: 'Crunchy fried cubes of sweet dough, addictive Nigerian snack' },
    
    // Traditional Dishes
    { name: 'Egusi Soup', price: 4000, category: 'Nigerian Traditional Food', description: 'Rich soup made with ground melon seeds, vegetables, and meat or fish' },
    { name: 'Okro Soup', price: 3500, category: 'Nigerian Traditional Food', description: 'Nutritious soup made with okra, meat, and traditional seasonings' },
    { name: 'Bitter Leaf Soup', price: 4000, category: 'Nigerian Traditional Food', description: 'Traditional soup made with bitter leaf vegetables, very nutritious' },
    { name: 'Ogbono Soup', price: 4000, category: 'Nigerian Traditional Food', description: 'Thick soup made from ground ogbono seeds with meat and fish' },
    { name: 'Efo Riro', price: 3500, category: 'Nigerian Traditional Food', description: 'Yoruba spinach stew with meat, fish, and aromatic spices' },
    { name: 'Afang Soup', price: 4500, category: 'Nigerian Traditional Food', description: 'Delicious soup from Cross River state made with afang leaves' },
    { name: 'Edikang Ikong', price: 4500, category: 'Nigerian Traditional Food', description: 'Nutritious vegetable soup from Akwa Ibom state' },
    { name: 'Banga Soup', price: 4000, category: 'Nigerian Traditional Food', description: 'Palm nut soup popular in the Niger Delta region' },
    
    // Native Drinks
    { name: 'Zobo', price: 1500, category: 'Beverages', description: 'Refreshing hibiscus drink with ginger, cucumber, and other natural flavors' },
    { name: 'Kunu', price: 1000, category: 'Beverages', description: 'Traditional northern Nigerian drink made from grains and spices' },
    { name: 'Chapman', price: 2000, category: 'Beverages', description: 'Popular Nigerian cocktail with fruit juices and soda' },
    { name: 'Tiger Nut Drink', price: 1500, category: 'Beverages', description: 'Nutritious drink made from tiger nuts, rich and creamy' },
    
    // Fresh Drinks
    { name: 'Fresh Orange Juice', price: 1500, category: 'Beverages', description: 'Freshly squeezed orange juice, vitamin C rich' },
    { name: 'Pineapple Juice', price: 1500, category: 'Beverages', description: 'Fresh pineapple juice, sweet and refreshing' },
    { name: 'Watermelon Juice', price: 1000, category: 'Beverages', description: 'Fresh watermelon juice, hydrating and sweet' },
    { name: 'Smoothie', price: 2000, category: 'Beverages', description: 'Mixed fruit smoothie with yogurt or milk' },
    
    // Pepper Soup
    { name: 'Goat Meat Pepper Soup', price: 4000, category: 'Pepper Soup', description: 'Spicy goat meat soup with traditional pepper soup spices' },
    { name: 'Fish Pepper Soup', price: 3500, category: 'Pepper Soup', description: 'Fresh fish cooked in spicy pepper soup with herbs' },
    { name: 'Chicken Pepper Soup', price: 3500, category: 'Pepper Soup', description: 'Tender chicken in aromatic pepper soup broth' },
    { name: 'Cow Tail Pepper Soup', price: 4500, category: 'Pepper Soup', description: 'Rich cow tail soup with traditional spices and herbs' }
  ];

  // Combine all food products
  const allFoodProducts = [...tuwoItems, ...miyaItems, ...otherFoodProducts];

  // Update the product creation sections to use the image mapping function:
  for (const product of allFoodProducts) {
    // Check if product already exists
    const existingProduct = await prisma.items.findFirst({
      where: { name: product.name }
    });
    
    // Only create if it doesn't exist
    if (!existingProduct) {
      await prisma.items.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          type: 'food',
          status: 'active',
          stock_quantity: Math.floor(Math.random() * 50) + 20,
          low_stock_threshold: 10,
          category_id: categories[product.category],
          image_url: getProductImageUrl(product.name) // Use the mapping function
        }
      });
    } else {
      console.log(`Food product already exists: ${product.name}`);
    }
  }
  
  console.log('Nigerian food products inserted successfully!');
  console.log(`Inserted ${tuwoItems.length} Tuwo base items`);
  console.log(`Inserted ${miyaItems.length} Miya sauce items`);
}

async function insertHealthProducts(categories) {
  const healthCombinations = [
    { name: 'Diabetes Treatment Combo', price: 45000, description: 'Comprehensive herbal treatment for diabetes management including blood sugar regulation supplements' },
    { name: 'Hypertension Control Combo', price: 40000, description: 'Natural blood pressure management combination with herbs and supplements' },
    { name: 'Weight Loss Combo', price: 35000, description: 'Complete weight management package with metabolism boosters and appetite suppressants' },
    { name: 'Fertility Enhancement Combo', price: 50000, description: 'Natural fertility support for both men and women with reproductive health supplements' },
    { name: 'Immune System Booster Combo', price: 30000, description: 'Powerful immune system enhancement with vitamins, minerals, and herbal extracts' },
    { name: 'Joint Pain Relief Combo', price: 38000, description: 'Comprehensive joint health support with anti-inflammatory herbs and pain relief supplements' },
    { name: 'Digestive Health Combo', price: 32000, description: 'Complete digestive system support with probiotics and digestive enzymes' },
    { name: 'Heart Health Combo', price: 42000, description: 'Cardiovascular support with omega-3, CoQ10, and heart-healthy herbs' },
    { name: 'Liver Detox Combo', price: 36000, description: 'Liver cleansing and detoxification with milk thistle and other hepatic herbs' },
    { name: 'Stress & Anxiety Relief Combo', price: 33000, description: 'Natural stress management with adaptogenic herbs and calming supplements' },
    { name: 'Sleep Improvement Combo', price: 28000, description: 'Natural sleep aid combination with melatonin and relaxing herbs' },
    { name: 'Energy & Vitality Combo', price: 35000, description: 'Natural energy enhancement with B-vitamins, ginseng, and vitality herbs' },
    { name: 'Skin Health Combo', price: 40000, description: 'Complete skin care support with collagen, vitamins, and antioxidants' },
    { name: 'Hair Growth Combo', price: 38000, description: 'Hair health and growth support with biotin, saw palmetto, and hair vitamins' },
    { name: 'Memory & Brain Health Combo', price: 45000, description: 'Cognitive support with ginkgo biloba, omega-3, and brain-boosting nutrients' }
  ];

  for (const combo of healthCombinations) {
    // Check if product already exists
    const existingProduct = await prisma.items.findFirst({
      where: { name: combo.name }
    });
    
    // Only create if it doesn't exist
    if (!existingProduct) {
      await prisma.items.create({
        data: {
          name: combo.name,
          description: combo.description,
          price: combo.price,
          type: 'medicine',
          status: 'active',
          stock_quantity: Math.floor(Math.random() * 30) + 10,
          low_stock_threshold: 5,
          category_id: categories['Treatment Combinations'],
          image_url: '/placeholder.svg?height=200&width=200'
        }
      });
    } else {
      console.log(`Health product already exists: ${combo.name}`);
    }
  }
  
  console.log('Health product combinations inserted successfully!');
}

async function insertDrVigorProducts(categories) {
  const drVigorProducts = [
    // Health Devices
    { name: 'Vigor Water Purifier', price: 150000, pv: 90, category: 'Health Devices', description: 'Advanced water purification system for clean, healthy drinking water' },
    
    // Beauty & Skincare
    { name: 'Dr.Vigor Lavender Beauty Set', price: 150000, pv: 90, category: 'Beauty & Skincare', description: 'Complete lavender-infused beauty care set for skin rejuvenation and relaxation' },
    { name: 'KLVER Brightening CC Cream', price: 28000, pv: 20, category: 'Beauty & Skincare', description: 'Color-correcting cream that brightens and evens skin tone while providing coverage' },
    { name: 'KLVER Brightening and Beautifying BB Cream', price: 25200, pv: 16, category: 'Beauty & Skincare', description: 'Multi-functional BB cream that brightens, moisturizes, and provides natural coverage' },
    { name: 'Kyle Velvet Gold Lipstick (Caramel Maple Leaf)', price: 14000, pv: 9, category: 'Beauty & Skincare', description: 'Luxurious velvet finish lipstick in warm caramel maple leaf shade' },
    { name: 'Kelly Velvet Gold Lipstick (Mary Jane Red)', price: 14000, pv: 9, category: 'Beauty & Skincare', description: 'Premium velvet gold lipstick in classic Mary Jane red color' },
    { name: 'Kyle Velvet Gold Lipstick (Slightly Drunk Rose)', price: 14000, pv: 9, category: 'Beauty & Skincare', description: 'Elegant velvet lipstick in romantic slightly drunk rose shade' },
    { name: 'Kyle Velvet Gold Lipstick (Red Flame Pomegranate)', price: 14000, pv: 9, category: 'Beauty & Skincare', description: 'Bold velvet gold lipstick in vibrant red flame pomegranate color' },
    { name: 'Dr.Vigor Sunscreen Lotion SPF50PA++++', price: 12000, pv: 7.5, category: 'Beauty & Skincare', description: 'High protection sunscreen lotion with SPF50 and PA++++ for maximum UV protection' },
    { name: 'Moisturizing and Clear Sunscreen', price: 12000, pv: 7.5, category: 'Beauty & Skincare', description: 'Lightweight, moisturizing sunscreen that provides clear, non-greasy protection' },
    { name: 'El Nino Skin Care Brightening Lotion (230g)', price: 8400, pv: 3, category: 'Beauty & Skincare', description: 'Skin brightening lotion that evens skin tone and provides deep moisturization' },
    { name: 'Lavender Hand Cream 80g/PIECE', price: 5000, pv: 3, category: 'Beauty & Skincare', description: 'Nourishing lavender hand cream for soft, smooth, and fragrant hands' },
    
    // Health Supplements
    { name: 'Dr.Vigor Flash Code Drink', price: 80000, pv: 65, category: 'Health Supplements', description: 'Premium energy and vitality drink with natural ingredients for enhanced performance' },
    { name: 'Dr.Vigor Maca Candy', price: 50000, pv: 30, category: 'Health Supplements', description: 'Maca root candy for natural energy, stamina, and hormonal balance support' },
    { name: 'Dr.Vigor Liver Keeper Candy 80g', price: 35000, pv: 22, category: 'Health Supplements', description: 'Liver health support candy with hepatoprotective herbs and nutrients' },
    { name: 'DHA algal oil phosphatidylserine gel candy', price: 32000, pv: 18, category: 'Health Supplements', description: 'Brain health candy with DHA and phosphatidylserine for cognitive support' },
    { name: 'Dr.Vigor Protein powder', price: 30000, pv: 9, category: 'Health Supplements', description: 'High-quality protein powder for muscle building and recovery support' },
    { name: 'Dr.Vigor Liver Keeper Candy 24g(0.8g*30)', price: 25000, pv: 22, category: 'Health Supplements', description: 'Convenient portion-controlled liver support candy for daily liver health maintenance' },
    { name: 'Dr vigor propolis capsules', price: 22500, pv: 14.5, category: 'Health Supplements', description: 'Natural propolis capsules for immune system support and antioxidant protection' },
    { name: 'Muscle and Bone Health Patch 13 * 16cm, 10 stickers/box', price: 22000, pv: 14, category: 'Health Supplements', description: 'Topical patches for muscle and bone health support with targeted relief' },
    { name: 'Dr.Vigor Chitosan Capsules', price: 22000, pv: 14, category: 'Health Supplements', description: 'Chitosan capsules for weight management and cholesterol support' },
    { name: 'Natto & Red Kojic Rice Hard Candy 72g (0.6g × 120 pieces)', price: 21000, pv: 13, category: 'Health Supplements', description: 'Heart health candy with natto and red kojic rice for cardiovascular support' },
    { name: 'Dr.Vigor Jasmine Green Tea', price: 20000, pv: 13, category: 'Health Supplements', description: 'Premium jasmine green tea with antioxidants for health and wellness' },
    { name: 'Dr vigor Xinkunning Coenzyme Q10 Soft Capsules', price: 20000, pv: 12, category: 'Health Supplements', description: 'CoQ10 soft capsules for heart health and cellular energy production' },
    { name: 'Dr.Vigor Bovine Colostrum Powder Tablets', price: 20000, pv: 11, category: 'Health Supplements', description: 'Bovine colostrum tablets for immune system support and gut health' },
    { name: 'Dr vigor iron capsules', price: 18500, pv: 11.5, category: 'Health Supplements', description: 'Iron supplement capsules for anemia prevention and energy support' },
    { name: 'Dr vigor aloe vera capsules', price: 18000, pv: 11.5, category: 'Health Supplements', description: 'Aloe vera capsules for digestive health and anti-inflammatory support' },
    { name: 'Dr vigor vitamin K soft capsules', price: 18000, pv: 11.5, category: 'Health Supplements', description: 'Vitamin K soft capsules for bone health and blood clotting support' },
    { name: 'Dr vigor spirulina Tablets', price: 17500, pv: 11, category: 'Health Supplements', description: 'Spirulina tablets packed with nutrients, protein, and antioxidants' },
    { name: 'Dr vigor Multi B Vitamin Tablets', price: 15500, pv: 10, category: 'Health Supplements', description: 'Complete B-vitamin complex for energy metabolism and nervous system support' },
    { name: 'Dr vigor soy phospholipid soft capsules', price: 15400, pv: 9, category: 'Health Supplements', description: 'Soy phospholipid capsules for brain health and cellular membrane support' },
    { name: 'Dr.Vigor Slim Code Black Coffee', price: 15000, pv: 9.5, category: 'Health Supplements', description: 'Weight management coffee with natural fat-burning ingredients' },
    { name: 'Dr vigor vitamin C Tablets', price: 12500, pv: 8, category: 'Health Supplements', description: 'High-potency vitamin C tablets for immune support and antioxidant protection' },
    { name: 'Dr vigor calcium magnesium chewable tablets', price: 11000, pv: 6.5, category: 'Health Supplements', description: 'Chewable calcium and magnesium tablets for bone and muscle health' },
    { name: 'Dr vigor fish oil soft capsules', price: 20000, pv: 13, category: 'Health Supplements', description: 'Omega-3 fish oil capsules for heart, brain, and joint health support' },
    { name: 'Dr vigor calcium vitamin D soft capsules', price: 10000, pv: 6, category: 'Health Supplements', description: 'Calcium and vitamin D combination for optimal bone health and absorption' },
    { name: 'Dr vigor garlic oil soft capsules', price: 20000, pv: 13, category: 'Health Supplements', description: 'Garlic oil capsules for cardiovascular health and immune system support' },
    { name: 'Dr vigor calcium iron zinc tablets', price: 10000, pv: 6, category: 'Health Supplements', description: 'Multi-mineral tablets with calcium, iron, and zinc for comprehensive nutrition' },
    
    // Personal Care
    { name: 'Dr.Vigor Honey Soap 100g * 3/box', price: 15000, pv: 3.5, category: 'Personal Care', description: 'Natural honey soap set for gentle cleansing and skin nourishment' },
    { name: 'Aloe Vera Intimate Care Gel 3g/pack. 6 packs/box', price: 13500, pv: 8, category: 'Personal Care', description: 'Gentle aloe vera intimate care gel for sensitive area hygiene and comfort' },
    { name: 'Dr.Vigor Bath Health Care Liquid', price: 9000, pv: 5, category: 'Personal Care', description: 'Therapeutic bath liquid for skin health and relaxation' },
    { name: 'Dr.Vigor detox body massage oil ONE Bottle', price: 9000, pv: 4, category: 'Personal Care', description: 'Detoxifying massage oil for body wellness and skin health' },
    { name: 'Elnino Silver Ion dandruff shampoo (400g)', price: 8000, pv: 3.5, category: 'Personal Care', description: 'Anti-dandruff shampoo with silver ion technology for scalp health' },
    { name: 'Dr.Vigor Anti-Dandruff Shampoo', price: 7500, pv: 3.5, category: 'Personal Care', description: 'Effective anti-dandruff shampoo for healthy scalp and hair' },
    { name: 'Dr.Vigor Soothing & Moisturizing Shower Gel', price: 7500, pv: 3.5, category: 'Personal Care', description: 'Gentle shower gel that soothes and moisturizes skin during cleansing' },
    { name: 'Zhencai Plant Extract Hair Dyeing Cream (Chestnut Brown)', price: 7000, pv: 1, category: 'Personal Care', description: 'Natural plant-based hair dye in chestnut brown for chemical-free coloring' },
    { name: 'Zhencai Plant Extract Hair Dyeing Cream (Wine Red)', price: 7000, pv: 0.5, category: 'Personal Care', description: 'Natural plant-based hair dye in wine red for vibrant, healthy coloring' },
    { name: 'El Nino Aloe Moisturizing Hair Conditioner (230g)', price: 5600, pv: 2, category: 'Personal Care', description: 'Aloe-infused hair conditioner for deep moisturizing and hair health' },
    { name: 'Ernino disinfectant toilet cleaner', price: 4200, pv: 1, category: 'Personal Care', description: 'Powerful disinfectant toilet cleaner for hygiene and cleanliness' },
    { name: 'El Nino oil fume cleaner', price: 4200, pv: 1, category: 'Personal Care', description: 'Effective oil fume cleaner for kitchen and cooking area maintenance' },
    { name: 'Dr.Vigor Bamboo Essence Sanitary Napkin (night use upgrade) 8 pieces/pack', price: 4000, pv: 2, category: 'Personal Care', description: 'Premium bamboo essence sanitary napkins for comfortable night protection' },
    { name: 'Dr.Vigor Bamboo Essence Sanitary Napkin (day use upgrade) 10 pieces/pack', price: 3500, pv: 2, category: 'Personal Care', description: 'Bamboo essence sanitary napkins for comfortable daily protection' },
    { name: 'Dr.Vigor Bamboo Essence panty liners (upgrade)30 pieces/pack', price: 3500, pv: 2, category: 'Personal Care', description: 'Bamboo essence panty liners for daily freshness and comfort' },
    { name: 'Aloe Vera Care Toothpaste 150g/tube', price: 3500, pv: 2, category: 'Personal Care', description: 'Natural aloe vera toothpaste for gentle oral care and gum health' },
    { name: 'Curacao aloe gel can', price: 3000, pv: 1.5, category: 'Personal Care', description: 'Pure aloe gel for skin soothing, healing, and moisturizing' },
    { name: 'El Nino water free hand sanitizer', price: 2100, pv: 1, category: 'Personal Care', description: 'Convenient waterless hand sanitizer for on-the-go hygiene' },
    { name: 'El Nino Skincare Aromatherapy Sea Salt Soap', price: 2100, pv: 1, category: 'Personal Care', description: 'Aromatherapy sea salt soap for skin exfoliation and relaxation' },
    { name: 'Dr Vigor Citrus Vial Antiperspirant Deodorant', price: 4500, pv: 2.5, category: 'Personal Care', description: 'Citrus-scented antiperspirant deodorant for long-lasting freshness' },
    { name: 'Dr.vigor Non Woven Gift Bag（2024', price: 1500, pv: 0, category: 'Personal Care', description: 'Eco-friendly non-woven gift bag for sustainable packaging' },
    { name: 'Dr.Vigor Non Woven Bag', price: 150, pv: 0, category: 'Personal Care', description: 'Reusable non-woven bag for eco-friendly shopping and storage' }
  ];

  for (const product of drVigorProducts) {
    // Check if product already exists
    const existingProduct = await prisma.items.findFirst({
      where: { name: product.name }
    });
    
    // Only create if it doesn't exist
    if (!existingProduct) {
      await prisma.items.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          type: 'medicine',
          status: 'active',
          stock_quantity: Math.floor(Math.random() * 40) + 15,
          low_stock_threshold: 8,
          category_id: categories[product.category],
          image_url: '/placeholder.svg?height=200&width=200'
        }
      });
    } else {
      console.log(`Dr. Vigor product already exists: ${product.name}`);
    }
  }
  
  console.log('Dr. Vigor products inserted successfully!');
}

async function main() {
  try {
    console.log('Starting product insertion with image upload...');

    // First, create categories
    const categories = await createCategories();
    
    // Then insert all products
    await insertNigerianFoodProducts(categories);
    await insertHealthProducts(categories);
    await insertDrVigorProducts(categories);
    
    console.log('All products inserted successfully!');
  } catch (error) {
    console.error('Error inserting products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });