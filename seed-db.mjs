import pg from 'pg';

const { Pool } = pg;

// Parse DATABASE_URL for PostgreSQL
const dbUrl = process.env.DATABASE_URL || 'postgresql://freshsip_user:freshsip_password@localhost:5432/freshsip';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function createTables() {
  console.log('Creating tables if they do not exist...');
  const client = await pool.connect();
  
  try {
    // Create enums first (PostgreSQL uses enums differently)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create sizes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sizes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        "priceMultiplier" DECIMAL(5,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create addOns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "addOns" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "isAvailable" BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create menuItems table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "menuItems" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "basePrice" DECIMAL(10,2) NOT NULL,
        image TEXT,
        category VARCHAR(100),
        "isAvailable" BOOLEAN DEFAULT TRUE NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes on menuItems
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menuItems_category ON "menuItems"(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menuItems_isAvailable ON "menuItems"("isAvailable")`);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "openId" VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        "loginMethod" VARCHAR(64),
        role role DEFAULT 'user' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "lastSignedIn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    // Create indexes on users
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_openId ON users("openId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        "orderNumber" VARCHAR(50) NOT NULL UNIQUE,
        "userId" INTEGER,
        "customerName" VARCHAR(255) NOT NULL,
        "customerPhone" VARCHAR(20) DEFAULT NULL,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        status order_status DEFAULT 'pending' NOT NULL,
        "paymentStatus" payment_status DEFAULT 'pending' NOT NULL,
        "paymentMethod" VARCHAR(50) DEFAULT 'razorpay',
        "razorpayOrderId" VARCHAR(255),
        "razorpayPaymentId" VARCHAR(255),
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "completedAt" TIMESTAMP NULL
      )
    `);
    
    // Create indexes on orders
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders("orderNumber")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_paymentStatus ON orders("paymentStatus")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_customerPhone ON orders("customerPhone")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_updatedAt ON orders("updatedAt")`);

    // Create orderItems table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "orderItems" (
        id SERIAL PRIMARY KEY,
        "orderId" INTEGER NOT NULL,
        "menuItemId" INTEGER NOT NULL,
        "menuItemName" VARCHAR(255),
        "sizeId" INTEGER NOT NULL,
        "sizeName" VARCHAR(50),
        quantity INTEGER DEFAULT 1 NOT NULL,
        "itemPrice" DECIMAL(10,2) NOT NULL,
        "addOnsData" JSONB,
        "addOnsTotal" DECIMAL(10,2) DEFAULT 0.00,
        "specialInstructions" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    // Create indexes on orderItems
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orderItems_orderId ON "orderItems"("orderId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orderItems_menuItemId ON "orderItems"("menuItemId")`);

    // Create orderStatusHistory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "orderStatusHistory" (
        id SERIAL PRIMARY KEY,
        "orderId" INTEGER NOT NULL,
        "oldStatus" VARCHAR(50),
        "newStatus" VARCHAR(50) NOT NULL,
        "changedBy" INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    // Create indexes on orderStatusHistory
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orderStatusHistory_orderId ON "orderStatusHistory"("orderId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orderStatusHistory_timestamp ON "orderStatusHistory"(timestamp)`);

    // Create menuItemPrices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "menuItemPrices" (
        id SERIAL PRIMARY KEY,
        "menuItemId" INTEGER NOT NULL,
        "sizeId" INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "isAvailable" BOOLEAN DEFAULT TRUE NOT NULL,
        UNIQUE("menuItemId", "sizeId")
      )
    `);
    
    // Create index on menuItemPrices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menuItemPrices_menuItemId ON "menuItemPrices"("menuItemId")`);

    console.log('✓ Tables created/verified');
  } finally {
    client.release();
  }
}

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('=== FreshSip Database Seeding (PostgreSQL) ===');
    console.log('Database URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
    
    // Create tables first
    await createTables();

    // Define image updates - always apply these (USER PROVIDED IMAGES)
    const imageUpdates = [
      { name: 'Mix Fruit Juice', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop' },
      { name: 'Orange Juice', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop' },
      { name: 'Pineapple Juice', image: 'https://i.pinimg.com/1200x/0f/7c/bc/0f7cbc51a9bf9d460441589dbf4838c6.jpg' },
      { name: 'Anar Juice', image: 'https://i.pinimg.com/1200x/27/9f/4d/279f4d5c03133d3beacff0c8755b2134.jpg' },
      { name: 'Vegetable Juice', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop' },
      { name: 'Mango Shake', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop' },
      { name: 'Banana Shake', image: 'https://i.pinimg.com/736x/7b/09/63/7b096395683cdf1111cdcb6c47229225.jpg' },
      { name: 'Khajoor Banana Mix', image: 'https://i.pinimg.com/1200x/14/3e/4a/143e4a63ce443d6475a9083c80e63f17.jpg' },
      { name: 'Chocolate Shake', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop' },
      { name: 'Strawberry Shake', image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop' },
      { name: 'Vanilla Shake', image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&h=500&fit=crop' },
      { name: 'Butter Scotch', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop' },
      { name: 'Kiwi Shake', image: 'https://i.pinimg.com/736x/c5/9a/9b/c59a9bef524704c3fed0c7bb4647571d.jpg' },
      { name: 'Cold Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=500&fit=crop' },
      { name: 'Khajoor Shake', image: 'https://i.pinimg.com/1200x/30/cd/4b/30cd4b640c4f9bdd165297316ae6c614.jpg' },
      { name: 'Kesar Badam', image: 'https://i.pinimg.com/736x/a5/36/62/a5366248c1363627ae47b9d631a7626f.jpg' },
      { name: 'Kesar Pista', image: 'https://i.pinimg.com/736x/3f/a4/64/3fa464c9e546fc06437bff4ec77f96b1.jpg' },
      { name: 'Black Currant', image: 'https://i.pinimg.com/736x/a6/64/ed/a664edee9ad699c21badfae952a0e548.jpg' },
      { name: 'Blueberry Shake', image: 'https://i.pinimg.com/1200x/41/0b/b6/410bb6567b3b06e3e97920d32ebb4340.jpg' },
      { name: 'Oreo Shake', image: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?w=500&h=500&fit=crop' },
      { name: 'Badam Shake', image: 'https://i.pinimg.com/736x/c7/b5/b1/c7b5b10e2cddec350fe8fa38e872e6c3.jpg' },
      { name: 'Traffic Jam', image: 'https://i.pinimg.com/1200x/27/79/47/277947a4d8322924af89cb5bbc9e831f.jpg' },
    ];
    
    // Items to delete (removed from menu)
    const itemsToDelete = ['Mousmi Juice', 'Pineapple Shake'];

    // Check if data exists
    const existingItemsResult = await client.query('SELECT COUNT(*) as count FROM "menuItems"');
    const existingPricesResult = await client.query('SELECT COUNT(*) as count FROM "menuItemPrices"').catch(() => ({ rows: [{ count: 0 }] }));
    
    const existingItems = parseInt(existingItemsResult.rows[0].count);
    const existingPrices = parseInt(existingPricesResult.rows[0].count);
    
    // Always update images, fix add-ons, and delete removed items
    if (existingItems > 0) {
      console.log('⚡ Updating menu item images...');
      for (const item of imageUpdates) {
        await client.query('UPDATE "menuItems" SET image = $1 WHERE name = $2', [item.image, item.name]);
      }
      console.log('✓ Menu images updated');
      
      // Fix duplicate add-ons - delete all and re-insert with correct prices
      console.log('🔧 Fixing add-ons (removing duplicates, updating prices)...');
      await client.query('DELETE FROM "addOns"');
      await client.query('INSERT INTO "addOns" (name, price, "isAvailable") VALUES ($1, $2, true)', ['Ice Cream', 15]);
      await client.query('INSERT INTO "addOns" (name, price, "isAvailable") VALUES ($1, $2, true)', ['Honey', 10]);
      console.log('✓ Add-ons fixed: Ice Cream ₹15, Honey ₹10');
      
      // Delete removed items
      console.log('🗑️ Removing discontinued items...');
      for (const itemName of itemsToDelete) {
        const itemResult = await client.query('SELECT id FROM "menuItems" WHERE name = $1', [itemName]);
        if (itemResult.rows.length > 0) {
          await client.query('DELETE FROM "menuItemPrices" WHERE "menuItemId" = $1', [itemResult.rows[0].id]);
          await client.query('DELETE FROM "menuItems" WHERE id = $1', [itemResult.rows[0].id]);
          console.log(`  Removed: ${itemName}`);
        }
      }
    }
    
    if (existingItems > 0 && existingPrices > 0) {
      console.log('✓ Data already seeded with prices');
      console.log('\n✅ Database ready!');
      return;
    }
    
    // If items exist but no prices, clear items to reseed with prices
    if (existingItems > 0 && existingPrices === 0) {
      console.log('⚠ Menu items exist but no prices. Clearing for reseed...');
      await client.query('DELETE FROM "menuItemPrices"');
      await client.query('DELETE FROM "menuItems"');
      await client.query('DELETE FROM sizes');
    }

    // Insert sizes
    const sizes = [
      { name: 'Small', priceMultiplier: 1.0 },
      { name: 'Medium', priceMultiplier: 1.25 },
      { name: 'Large', priceMultiplier: 1.5 },
      { name: 'Ex-Large', priceMultiplier: 1.75 },
    ];

    for (const size of sizes) {
      await client.query(
        'INSERT INTO sizes (name, "priceMultiplier") VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [size.name, size.priceMultiplier]
      );
    }
    console.log('✓ Sizes added');

    // Clean up duplicate add-ons and update prices
    await client.query('DELETE FROM "addOns"');
    
    // Insert add-ons with updated prices (Ice Cream: ₹15, Honey: ₹10)
    const addOns = [
      { name: 'Ice Cream', price: 15 },
      { name: 'Honey', price: 10 },
    ];

    for (const addOn of addOns) {
      await client.query(
        'INSERT INTO "addOns" (name, price, "isAvailable") VALUES ($1, $2, true)',
        [addOn.name, addOn.price]
      );
    }
    console.log('✓ Add-ons added');

    // Insert menu items with exact pricing from price chart
    const menuItems = [
      // ========== FRUIT JUICES ==========
      { name: 'Mix Fruit Juice', description: 'A delightful blend of seasonal fruits bursting with natural flavors', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop' },
      { name: 'Orange Juice', description: 'Fresh squeezed orange juice, bursting with vitamin C', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop' },
      { name: 'Pineapple Juice', description: 'Tropical pineapple juice with a perfect tangy-sweet balance', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://i.pinimg.com/1200x/0f/7c/bc/0f7cbc51a9bf9d460441589dbf4838c6.jpg' },
      { name: 'Anar Juice', description: 'Ruby red antioxidant-rich pomegranate juice for health lovers', basePrice: 50, prices: [50, 80, 100, 120], category: 'Fruit Juices', image: 'https://i.pinimg.com/1200x/27/9f/4d/279f4d5c03133d3beacff0c8755b2134.jpg' },
      { name: 'Vegetable Juice', description: 'Healthy blend of fresh vegetables for nutrition boost', basePrice: 40, prices: [40, 50, 60, 70], category: 'Fruit Juices', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop' },
      
      // ========== SHAKES ==========
      { name: 'Mango Shake', description: 'Thick and creamy mango milkshake, summer in a glass', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop' },
      { name: 'Banana Shake', description: 'Classic banana milkshake, creamy and naturally sweet', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/736x/7b/09/63/7b096395683cdf1111cdcb6c47229225.jpg' },
      { name: 'Khajoor Banana Mix', description: 'Nutritious blend of dates and banana, naturally sweet', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/1200x/14/3e/4a/143e4a63ce443d6475a9083c80e63f17.jpg' },
      { name: 'Chocolate Shake', description: 'Rich and decadent chocolate milkshake for chocolate lovers', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop' },
      { name: 'Strawberry Shake', description: 'Luscious strawberry milkshake made with fresh strawberries', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop' },
      { name: 'Vanilla Shake', description: 'Classic vanilla milkshake, smooth and creamy', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&h=500&fit=crop' },
      { name: 'Butter Scotch', description: 'Buttery caramel flavored shake with crunchy bits', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop' },
      { name: 'Kiwi Shake', description: 'Refreshing kiwi milkshake with a tangy twist', basePrice: 40, prices: [40, 50, 60, 70], category: 'Shakes', image: 'https://i.pinimg.com/736x/c5/9a/9b/c59a9bef524704c3fed0c7bb4647571d.jpg' },
      
      // ========== SPECIAL DRINKS ==========
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

    for (const item of menuItems) {
      // Insert menu item
      await client.query(
        'INSERT INTO "menuItems" (name, description, "basePrice", category, image, "isAvailable") VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT DO NOTHING',
        [item.name, item.description, item.basePrice, item.category, item.image]
      );
      
      // Get the menu item ID
      const itemResult = await client.query('SELECT id FROM "menuItems" WHERE name = $1', [item.name]);
      if (itemResult.rows.length > 0 && item.prices) {
        const menuItemId = itemResult.rows[0].id;
        const sizeNames = ['Small', 'Medium', 'Large', 'Ex-Large'];
        
        for (let i = 0; i < item.prices.length; i++) {
          const price = item.prices[i];
          if (price !== null) {
            // Get size ID
            const sizeResult = await client.query('SELECT id FROM sizes WHERE name = $1', [sizeNames[i]]);
            if (sizeResult.rows.length > 0) {
              const sizeId = sizeResult.rows[0].id;
              await client.query(
                'INSERT INTO "menuItemPrices" ("menuItemId", "sizeId", price, "isAvailable") VALUES ($1, $2, $3, true) ON CONFLICT ("menuItemId", "sizeId") DO UPDATE SET price = $3, "isAvailable" = true',
                [menuItemId, sizeId, price]
              );
            }
          }
        }
      }
    }
    console.log('✓ Menu items and prices added');

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error?.message || error);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
