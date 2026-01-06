import mysql from 'mysql2/promise';

// Parse DATABASE_URL properly
const dbUrl = process.env.DATABASE_URL || 'mysql://freshsip_user:freshsip_password@localhost:3306/freshsip';
const urlObj = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: urlObj.hostname,
  port: urlObj.port || 3306,
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.slice(1),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function createTables() {
  console.log('Creating tables if they do not exist...');

  // Create sizes table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      priceMultiplier DECIMAL(5,2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create addOns table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS addOns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create menuItems table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS menuItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      basePrice DECIMAL(10,2) NOT NULL,
      image TEXT,
      category VARCHAR(100),
      isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_menuItems_category (category),
      INDEX idx_menuItems_isAvailable (isAvailable)
    )
  `);

  // Create users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openId VARCHAR(64) NOT NULL UNIQUE,
      name TEXT,
      email VARCHAR(320),
      loginMethod VARCHAR(64),
      role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_users_openId (openId),
      INDEX idx_users_role (role)
    )
  `);

  // Create orders table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderNumber VARCHAR(50) NOT NULL UNIQUE,
      userId INT,
      customerName VARCHAR(255) NOT NULL,
      customerPhone VARCHAR(20) DEFAULT NULL,
      status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
      totalAmount DECIMAL(10,2) NOT NULL,
      paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
      paymentMethod VARCHAR(50) DEFAULT 'razorpay',
      razorpayOrderId VARCHAR(255),
      razorpayPaymentId VARCHAR(255),
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      completedAt TIMESTAMP NULL,
      INDEX idx_orders_status (status),
      INDEX idx_orders_orderNumber (orderNumber),
      INDEX idx_orders_paymentStatus (paymentStatus),
      INDEX idx_orders_razorpayOrderId (razorpayOrderId)
    )
  `);

  // Fix customerPhone column to allow NULL (for existing tables)
  try {
    await connection.execute(`ALTER TABLE orders MODIFY COLUMN customerPhone VARCHAR(20) DEFAULT NULL`);
    console.log('  Fixed customerPhone column to allow NULL');
  } catch (e) { /* Column already correct */ }

  // Add missing columns if table already exists (for migrations)
  try {
    await connection.execute(`ALTER TABLE orders ADD COLUMN paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' NOT NULL AFTER totalAmount`);
    console.log('  Added paymentStatus column');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(50) DEFAULT 'razorpay' AFTER paymentStatus`);
    console.log('  Added paymentMethod column');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orders ADD COLUMN razorpayOrderId VARCHAR(255) AFTER paymentMethod`);
    console.log('  Added razorpayOrderId column');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orders ADD COLUMN razorpayPaymentId VARCHAR(255) AFTER razorpayOrderId`);
    console.log('  Added razorpayPaymentId column');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orders ADD COLUMN completedAt TIMESTAMP NULL AFTER updatedAt`);
    console.log('  Added completedAt column');
  } catch (e) { /* Column already exists */ }

  // Create orderItems table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orderItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT NOT NULL,
      menuItemId INT NOT NULL,
      menuItemName VARCHAR(255),
      sizeId INT NOT NULL,
      sizeName VARCHAR(50),
      quantity INT DEFAULT 1 NOT NULL,
      itemPrice DECIMAL(10,2) NOT NULL,
      addOnsData JSON,
      addOnsTotal DECIMAL(10,2) DEFAULT 0.00,
      specialInstructions TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Add missing columns to orderItems if table already exists
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN menuItemName VARCHAR(255) AFTER menuItemId`);
    console.log('  Added menuItemName column to orderItems');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN sizeName VARCHAR(50) AFTER sizeId`);
    console.log('  Added sizeName column to orderItems');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN itemPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER quantity`);
    console.log('  Added itemPrice column to orderItems');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN addOnsData JSON AFTER itemPrice`);
    console.log('  Added addOnsData column to orderItems');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN addOnsTotal DECIMAL(10,2) DEFAULT 0.00 AFTER addOnsData`);
    console.log('  Added addOnsTotal column to orderItems');
  } catch (e) { /* Column already exists */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems ADD COLUMN specialInstructions TEXT AFTER addOnsTotal`);
    console.log('  Added specialInstructions column to orderItems');
  } catch (e) { /* Column already exists */ }

  // Rename old columns if they exist (migration from old schema)
  try {
    await connection.execute(`ALTER TABLE orderItems CHANGE COLUMN unitPrice itemPrice DECIMAL(10,2) NOT NULL`);
    console.log('  Renamed unitPrice to itemPrice');
  } catch (e) { /* Column doesn't exist or already renamed */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems CHANGE COLUMN addOnIds addOnsData JSON`);
    console.log('  Renamed addOnIds to addOnsData');
  } catch (e) { /* Column doesn't exist or already renamed */ }

  // Drop old columns if they still exist after adding new ones
  try {
    await connection.execute(`ALTER TABLE orderItems DROP COLUMN unitPrice`);
    console.log('  Dropped old unitPrice column');
  } catch (e) { /* Column doesn't exist */ }
  
  try {
    await connection.execute(`ALTER TABLE orderItems DROP COLUMN addOnIds`);
    console.log('  Dropped old addOnIds column');
  } catch (e) { /* Column doesn't exist */ }

  // Create orderStatusHistory table (for tracking status changes)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orderStatusHistory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId INT NOT NULL,
      oldStatus VARCHAR(50) NOT NULL,
      newStatus VARCHAR(50) NOT NULL,
      changedBy VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_orderStatusHistory_orderId (orderId)
    )
  `);

  // Create menuItemPrices table for specific size pricing
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS menuItemPrices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      menuItemId INT NOT NULL,
      sizeId INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      isAvailable BOOLEAN DEFAULT TRUE NOT NULL,
      UNIQUE KEY unique_item_size (menuItemId, sizeId),
      INDEX idx_menuItemPrices_menuItemId (menuItemId)
    )
  `);

  console.log('✓ Tables created/verified');
}

async function seed() {
  try {
    console.log('=== FreshSip Database Seeding ===');
    console.log('Database URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
    
    // Create tables first
    await createTables();

    // Always update images for existing menu items (to fix image issues)
    // Then check if full reseed is needed
    const [existingItems] = await connection.execute('SELECT COUNT(*) as count FROM menuItems');
    const [existingPrices] = await connection.execute('SELECT COUNT(*) as count FROM menuItemPrices').catch(() => [[{ count: 0 }]]);
    
    // Define image updates - always apply these (USER PROVIDED IMAGES)
    const imageUpdates = [
      { name: 'Mix Fruit Juice', image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop' },
      { name: 'Orange Juice', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop' },
      { name: 'Pineapple Juice', image: 'https://source.unsplash.com/OKT6Ce9fwqI/500x500' }, // User provided - pineapple on yellow
      { name: 'Anar Juice', image: 'https://source.unsplash.com/gLb467qQVxU/500x500' }, // User provided - cut pomegranates
      { name: 'Vegetable Juice', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop' },
      { name: 'Mango Shake', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop' },
      { name: 'Banana Shake', image: 'https://source.unsplash.com/y0KwfCF8h-4/500x500' }, // User provided - banana with ice cream
      { name: 'Khajoor Banana Mix', image: 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=500&h=500&fit=crop' },
      { name: 'Chocolate Shake', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop' },
      { name: 'Strawberry Shake', image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop' },
      { name: 'Vanilla Shake', image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&h=500&fit=crop' },
      { name: 'Butter Scotch', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop' },
      { name: 'Kiwi Shake', image: 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=500&h=500&fit=crop' },
      { name: 'Cold Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=500&fit=crop' },
      { name: 'Khajoor Shake', image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=500&h=500&fit=crop' },
      { name: 'Kesar Badam', image: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=500&h=500&fit=crop' },
      { name: 'Kesar Pista', image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&h=500&fit=crop' },
      { name: 'Black Currant', image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=500&h=500&fit=crop' },
      { name: 'Blueberry Shake', image: 'https://source.unsplash.com/0QMiCaiK650/500x500' }, // User provided - blueberries plate
      { name: 'Oreo Shake', image: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?w=500&h=500&fit=crop' },
      { name: 'Badam Shake', image: 'https://i.pinimg.com/736x/c7/b5/b1/c7b5b10e2cddec350fe8fa38e872e6c3.jpg' }, // User provided - Pinterest
      { name: 'Traffic Jam', image: 'https://i.pinimg.com/1200x/27/79/47/277947a4d8322924af89cb5bbc9e831f.jpg' }, // User provided - Pinterest
    ];
    
    // Items to delete (removed from menu)
    const itemsToDelete = ['Mousmi Juice', 'Pineapple Shake'];
    
    // Always update images and delete removed items
    if (existingItems[0].count > 0) {
      console.log('⚡ Updating menu item images...');
      for (const item of imageUpdates) {
        await connection.execute(
          'UPDATE menuItems SET image = ? WHERE name = ?',
          [item.image, item.name]
        );
      }
      console.log('✓ Menu images updated');
      
      // Delete removed items
      console.log('🗑️ Removing discontinued items...');
      for (const itemName of itemsToDelete) {
        // First delete from menuItemPrices
        const [itemRows] = await connection.execute('SELECT id FROM menuItems WHERE name = ?', [itemName]);
        if (itemRows.length > 0) {
          await connection.execute('DELETE FROM menuItemPrices WHERE menuItemId = ?', [itemRows[0].id]);
          await connection.execute('DELETE FROM menuItems WHERE id = ?', [itemRows[0].id]);
          console.log(`  Removed: ${itemName}`);
        }
      }
    }
    
    if (existingItems[0].count > 0 && existingPrices[0].count > 0) {
      console.log('✓ Data already seeded with prices');
      console.log('\n✅ Database ready!');
      await connection.end();
      return;
    }
    
    // If items exist but no prices, clear items to reseed with prices
    if (existingItems[0].count > 0 && existingPrices[0].count === 0) {
      console.log('⚠ Menu items exist but no prices. Clearing for reseed...');
      await connection.execute('DELETE FROM menuItemPrices');
      await connection.execute('DELETE FROM menuItems');
      await connection.execute('DELETE FROM sizes');
    }

    // Insert sizes
    const sizes = [
      { name: 'Small', priceMultiplier: 1.0 },
      { name: 'Medium', priceMultiplier: 1.25 },
      { name: 'Large', priceMultiplier: 1.5 },
      { name: 'Ex-Large', priceMultiplier: 1.75 },
    ];

    for (const size of sizes) {
      await connection.execute(
        'INSERT IGNORE INTO sizes (name, priceMultiplier) VALUES (?, ?)',
        [size.name, size.priceMultiplier]
      );
    }
    console.log('✓ Sizes added');

    // Insert add-ons (only Ice Cream and Honey)
    const addOns = [
      { name: 'Ice Cream', price: 30 },
      { name: 'Honey', price: 15 },
    ];

    for (const addOn of addOns) {
      await connection.execute(
        'INSERT IGNORE INTO addOns (name, price, isAvailable) VALUES (?, ?, 1)',
        [addOn.name, addOn.price]
      );
    }
    console.log('✓ Add-ons added');

    // Insert menu items with exact pricing from price chart
    // Prices: [Small, Medium, Large, Ex-Large] - null means not available in that size
    const menuItems = [
      // ========== FRUIT JUICES ==========
      {
        name: 'Mix Fruit Juice',
        description: 'A delightful blend of seasonal fruits bursting with natural flavors',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop',
      },
      {
        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice, bursting with vitamin C',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop',
      },
      {
        name: 'Pineapple Juice',
        description: 'Tropical pineapple juice with a perfect tangy-sweet balance',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Fruit Juices',
        image: 'https://source.unsplash.com/OKT6Ce9fwqI/500x500',
      },
      {
        name: 'Anar Juice',
        description: 'Ruby red antioxidant-rich pomegranate juice for health lovers',
        basePrice: 50,
        prices: [50, 80, 100, 120],
        category: 'Fruit Juices',
        image: 'https://source.unsplash.com/gLb467qQVxU/500x500',
      },
      {
        name: 'Vegetable Juice',
        description: 'Healthy blend of fresh vegetables for nutrition boost',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop',
      },
      
      // ========== SHAKES ==========
      {
        name: 'Mango Shake',
        description: 'Thick and creamy mango milkshake, summer in a glass',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop',
      },
      {
        name: 'Banana Shake',
        description: 'Classic banana milkshake, creamy and naturally sweet',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://source.unsplash.com/y0KwfCF8h-4/500x500',
      },
      {
        name: 'Khajoor Banana Mix',
        description: 'Nutritious blend of dates and banana, naturally sweet',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=500&h=500&fit=crop',
      },
      {
        name: 'Chocolate Shake',
        description: 'Rich and decadent chocolate milkshake for chocolate lovers',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop',
      },
      {
        name: 'Strawberry Shake',
        description: 'Luscious strawberry milkshake made with fresh strawberries',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop',
      },
      {
        name: 'Vanilla Shake',
        description: 'Classic vanilla milkshake, smooth and creamy',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=500&h=500&fit=crop',
      },
      {
        name: 'Butter Scotch',
        description: 'Buttery caramel flavored shake with crunchy bits',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop',
      },
      {
        name: 'Kiwi Shake',
        description: 'Refreshing kiwi milkshake with a tangy twist',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=500&h=500&fit=crop',
      },
      
      // ========== SPECIAL DRINKS ==========
      {
        name: 'Cold Coffee',
        description: 'Refreshing iced coffee blended to perfection',
        basePrice: 50,
        prices: [null, 50, 80, 100], // No small size
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=500&fit=crop',
      },
      {
        name: 'Khajoor Shake',
        description: 'Rich date shake, naturally sweetened with premium dates',
        basePrice: 50,
        prices: [50, 60, 70, 80],
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=500&h=500&fit=crop',
      },
      {
        name: 'Kesar Badam',
        description: 'Luxurious saffron almond shake, rich and aromatic',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=500&h=500&fit=crop',
      },
      {
        name: 'Kesar Pista',
        description: 'Premium saffron pistachio shake, creamy delight',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&h=500&fit=crop',
      },
      {
        name: 'Black Currant',
        description: 'Tangy black currant shake with berry goodness',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=500&h=500&fit=crop',
      },
      {
        name: 'Blueberry Shake',
        description: 'Antioxidant-rich blueberry milkshake',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://source.unsplash.com/0QMiCaiK650/500x500',
      },
      {
        name: 'Oreo Shake',
        description: 'Indulgent cookies and cream shake topped with crushed Oreos',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?w=500&h=500&fit=crop',
      },
      {
        name: 'Badam Shake',
        description: 'Creamy almond milkshake with roasted almonds and cardamom',
        basePrice: 40,
        prices: [40, 50, 60, 70],
        category: 'Special',
        image: 'https://i.pinimg.com/736x/c7/b5/b1/c7b5b10e2cddec350fe8fa38e872e6c3.jpg',
      },
      {
        name: 'Traffic Jam',
        description: 'Colorful layered smoothie with strawberry, mango, and kiwi',
        basePrice: 60,
        prices: [null, 60, 80, 100], // No small size
        category: 'Special',
        image: 'https://i.pinimg.com/1200x/27/79/47/277947a4d8322924af89cb5bbc9e831f.jpg',
      },
    ];

    for (const item of menuItems) {
      // Insert menu item
      const [result] = await connection.execute(
        'INSERT IGNORE INTO menuItems (name, description, basePrice, category, image, isAvailable) VALUES (?, ?, ?, ?, ?, 1)',
        [item.name, item.description, item.basePrice, item.category, item.image]
      );
      
      // Get the menu item ID (either just inserted or existing)
      const [rows] = await connection.execute('SELECT id FROM menuItems WHERE name = ?', [item.name]);
      if (rows.length > 0 && item.prices) {
        const menuItemId = rows[0].id;
        const sizeNames = ['Small', 'Medium', 'Large', 'Ex-Large'];
        
        for (let i = 0; i < item.prices.length; i++) {
          const price = item.prices[i];
          if (price !== null) {
            // Get size ID
            const [sizeRows] = await connection.execute('SELECT id FROM sizes WHERE name = ?', [sizeNames[i]]);
            if (sizeRows.length > 0) {
              const sizeId = sizeRows[0].id;
              await connection.execute(
                'INSERT INTO menuItemPrices (menuItemId, sizeId, price, isAvailable) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE price = ?, isAvailable = 1',
                [menuItemId, sizeId, price, price]
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
    process.exit(1); // Exit with error code so Railway knows something failed
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
