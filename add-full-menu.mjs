#!/usr/bin/env node
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addFullMenu() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current menu items...\n');
    
    // Check current items
    const currentItems = await client.query('SELECT COUNT(*) as count FROM "menuItems"');
    console.log(`Current menu items: ${currentItems.rows[0].count}`);
    
    // Get sizes
    const sizesResult = await client.query('SELECT id, name FROM sizes ORDER BY id');
    const sizes = sizesResult.rows;
    console.log(`Sizes available: ${sizes.map(s => s.name).join(', ')}\n`);
    
    // Define all 22 menu items from your original setup
    const menuItems = [
      // FRUIT JUICES
      { name: 'Mix Fruit Juice', description: 'A delightful blend of seasonal fruits bursting with natural flavors', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop' },
      { name: 'Orange Juice', description: 'Fresh squeezed orange juice, bursting with vitamin C', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop' },
      { name: 'Pineapple Juice', description: 'Tropical pineapple juice with a perfect tangy-sweet balance', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://i.pinimg.com/1200x/0f/7c/bc/0f7cbc51a9bf9d460441589dbf4838c6.jpg' },
      { name: 'Anar Juice', description: 'Ruby red antioxidant-rich pomegranate juice for health lovers', basePrice: 50, prices: [50, 80, 100, 120], category: 'Fruit Juices', image: 'https://i.pinimg.com/1200x/27/9f/4d/279f4d5c03133d3beacff0c8755b2134.jpg' },
      { name: 'Vegetable Juice', description: 'Healthy blend of fresh vegetables for nutrition boost', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop' },
      
      // SHAKES
      { name: 'Mango Shake', description: 'Thick and creamy mango milkshake, summer in a glass', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop' },
      { name: 'Banana Shake', description: 'Classic banana milkshake, creamy and naturally sweet', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/736x/7b/09/63/7b096395683cdf1111cdcb6c47229225.jpg' },
      { name: 'Khajoor Banana Mix', description: 'Nutritious blend of dates and banana, naturally sweet', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/1200x/14/3e/4a/143e4a63ce443d6475a9083c80e63f17.jpg' },
      { name: 'Chocolate Shake', description: 'Rich and decadent chocolate milkshake for chocolate lovers', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop' },
      { name: 'Strawberry Shake', description: 'Luscious strawberry milkshake made with fresh strawberries', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop' },
      { name: 'Vanilla Shake', description: 'Classic vanilla milkshake, smooth and creamy', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&h=500&fit=crop' },
      { name: 'Butter Scotch', description: 'Buttery caramel flavored shake with crunchy bits', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop' },
      { name: 'Kiwi Shake', description: 'Refreshing kiwi milkshake with a tangy twist', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/736x/c5/9a/9b/c59a9bef524704c3fed0c7bb4647571d.jpg' },
      
      // SPECIAL DRINKS
      { name: 'Cold Coffee', description: 'Refreshing iced coffee blended to perfection', basePrice: 50, prices: [null, 50, 80, 100], category: 'Special', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=500&fit=crop' },
      { name: 'Khajoor Shake', description: 'Rich date shake, naturally sweetened with premium dates', basePrice: 50, prices: [50, 60, 70, 80], category: 'Special', image: 'https://i.pinimg.com/1200x/30/cd/4b/30cd4b640c4f9bdd165297316ae6c614.jpg' },
      { name: 'Kesar Badam', description: 'Luxurious saffron almond shake, rich and aromatic', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://i.pinimg.com/736x/a5/36/62/a5366248c1363627ae47b9d631a7626f.jpg' },
      { name: 'Kesar Pista', description: 'Premium saffron pistachio shake, creamy delight', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://i.pinimg.com/736x/3f/a4/64/3fa464c9e546fc06437bff4ec77f96b1.jpg' },
      { name: 'Black Currant', description: 'Tangy black currant shake with berry goodness', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://i.pinimg.com/736x/a6/64/ed/a664edee9ad699c21badfae952a0e548.jpg' },
      { name: 'Blueberry Shake', description: 'Antioxidant-rich blueberry milkshake', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://i.pinimg.com/1200x/41/0b/b6/410bb6567b3b06e3e97920d32ebb4340.jpg' },
      { name: 'Oreo Shake', description: 'Indulgent cookies and cream shake topped with crushed Oreos', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?w=500&h=500&fit=crop' },
      { name: 'Badam Shake', description: 'Creamy almond milkshake with roasted almonds and cardamom', basePrice: 40, prices: [40, 50, 60, 70], category: 'Special', image: 'https://i.pinimg.com/736x/c7/b5/b1/c7b5b10e2cddec350fe8fa38e872e6c3.jpg' },
      { name: 'Traffic Jam', description: 'Colorful layered smoothie with strawberry, mango, and kiwi', basePrice: 60, prices: [null, 60, 80, 100], category: 'Special', image: 'https://i.pinimg.com/1200x/27/79/47/277947a4d8322924af89cb5bbc9e831f.jpg' },
    ];

    console.log(`📝 Adding ${menuItems.length} menu items...\n`);
    
    let added = 0;
    let updated = 0;
    
    for (const item of menuItems) {
      // Check if item exists
      const existingItem = await client.query(
        'SELECT id FROM "menuItems" WHERE name = $1',
        [item.name]
      );
      
      let menuItemId;
      
      if (existingItem.rows.length > 0) {
        // Update existing item
        menuItemId = existingItem.rows[0].id;
        await client.query(
          `UPDATE "menuItems" 
           SET description = $1, "basePrice" = $2, category = $3, image = $4, "isAvailable" = true 
           WHERE id = $5`,
          [item.description, item.basePrice, item.category, item.image, menuItemId]
        );
        updated++;
      } else {
        // Insert new item
        const insertResult = await client.query(
          `INSERT INTO "menuItems" (name, description, "basePrice", category, image, "isAvailable") 
           VALUES ($1, $2, $3, $4, $5, true) 
           RETURNING id`,
          [item.name, item.description, item.basePrice, item.category, item.image]
        );
        menuItemId = insertResult.rows[0].id;
        added++;
      }
      
      // Add prices for each size
      if (item.prices) {
        for (let i = 0; i < item.prices.length && i < sizes.length; i++) {
          const price = item.prices[i];
          if (price !== null) {
            const sizeId = sizes[i].id;
            
            // Delete existing price first to avoid conflicts
            await client.query(
              'DELETE FROM "menuItemPrices" WHERE "menuItemId" = $1 AND "sizeId" = $2',
              [menuItemId, sizeId]
            );
            
            // Insert new price
            await client.query(
              `INSERT INTO "menuItemPrices" ("menuItemId", "sizeId", price, "isAvailable") 
               VALUES ($1, $2, $3, true)`,
              [menuItemId, sizeId, price]
            );
          }
        }
      }
      
      console.log(`✅ ${item.name} (${item.category})`);
    }
    
    console.log(`\n✨ Complete!`);
    console.log(`   Added: ${added} new items`);
    console.log(`   Updated: ${updated} existing items`);
    console.log(`   Total: ${menuItems.length} items in menu`);
    
    // Show final counts
    const finalCount = await client.query('SELECT COUNT(*) as count FROM "menuItems"');
    const finalPrices = await client.query('SELECT COUNT(*) as count FROM "menuItemPrices"');
    
    console.log(`\n📊 Database Stats:`);
    console.log(`   Menu Items: ${finalCount.rows[0].count}`);
    console.log(`   Prices: ${finalPrices.rows[0].count}`);
    console.log(`\n🎉 Your menu is ready!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addFullMenu();
