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
      customerPhone VARCHAR(20),
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
      sizeId INT NOT NULL,
      quantity INT DEFAULT 1 NOT NULL,
      unitPrice DECIMAL(10,2) NOT NULL,
      addOnIds JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
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

    // Insert sizes
    const sizes = [
      { name: 'Small', priceMultiplier: 1.0 },
      { name: 'Medium', priceMultiplier: 1.3 },
      { name: 'Large', priceMultiplier: 1.6 },
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
    
    // Clear existing add-ons to keep only Ice Cream and Honey
    await connection.execute('DELETE FROM addOns');

    for (const addOn of addOns) {
      await connection.execute(
        'INSERT IGNORE INTO addOns (name, price, isAvailable) VALUES (?, ?, 1)',
        [addOn.name, addOn.price]
      );
    }
    console.log('✓ Add-ons added');

    // Insert menu items - clear existing and add fresh
    await connection.execute('DELETE FROM menuItems');
    
    const menuItems = [
      // Fruit Juices
      {
        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice, bursting with vitamin C and natural sweetness',
        basePrice: 80,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=500&fit=crop',
      },
      {
        name: 'Mango Juice',
        description: 'Creamy Alphonso mango juice, the king of tropical fruits',
        basePrice: 100,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&h=500&fit=crop',
      },
      {
        name: 'Watermelon Juice',
        description: 'Cool and refreshing watermelon juice, perfect for hot days',
        basePrice: 70,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&h=500&fit=crop',
      },
      {
        name: 'Pineapple Juice',
        description: 'Tropical pineapple juice with a perfect tangy-sweet balance',
        basePrice: 85,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1544252890-c3e95e867a2b?w=500&h=500&fit=crop',
      },
      {
        name: 'Pomegranate Juice',
        description: 'Ruby red antioxidant-rich pomegranate juice for health lovers',
        basePrice: 120,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&h=500&fit=crop',
      },
      {
        name: 'Apple Juice',
        description: 'Crisp and naturally sweet fresh apple juice',
        basePrice: 80,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=500&h=500&fit=crop',
      },
      {
        name: 'Mixed Fruit Juice',
        description: 'A delightful blend of seasonal fruits bursting with flavors',
        basePrice: 90,
        category: 'Fruit Juices',
        image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=500&h=500&fit=crop',
      },
      // Shakes
      {
        name: 'Badam Shake',
        description: 'Creamy almond milkshake with roasted almonds and a hint of cardamom',
        basePrice: 130,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&h=500&fit=crop',
      },
      {
        name: 'Oreo Shake',
        description: 'Indulgent cookies and cream shake topped with crushed Oreos',
        basePrice: 140,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=500&fit=crop',
      },
      {
        name: 'Strawberry Shake',
        description: 'Luscious strawberry milkshake made with fresh strawberries',
        basePrice: 120,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500&h=500&fit=crop',
      },
      {
        name: 'Banana Shake',
        description: 'Classic banana milkshake, creamy and naturally sweet',
        basePrice: 100,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&h=500&fit=crop',
      },
      {
        name: 'Chocolate Shake',
        description: 'Rich and decadent chocolate milkshake for chocolate lovers',
        basePrice: 130,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=500&fit=crop',
      },
      {
        name: 'Mango Shake',
        description: 'Thick and creamy mango milkshake, summer in a glass',
        basePrice: 120,
        category: 'Shakes',
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500&h=500&fit=crop',
      },
      // Special Drinks
      {
        name: 'Traffic Jam',
        description: 'Colorful layered smoothie with strawberry, mango, and kiwi',
        basePrice: 150,
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500&h=500&fit=crop',
      },
      {
        name: 'Green Detox',
        description: 'Healthy blend of spinach, apple, cucumber, and mint',
        basePrice: 110,
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&h=500&fit=crop',
      },
      {
        name: 'Berry Blast',
        description: 'Mixed berries smoothie with blueberries, raspberries, and strawberries',
        basePrice: 140,
        category: 'Special',
        image: 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=500&h=500&fit=crop',
      },
      // Vegetable Juices
      {
        name: 'Carrot Juice',
        description: 'Fresh carrot juice, sweet and packed with beta-carotene',
        basePrice: 75,
        category: 'Vegetable',
        image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=500&h=500&fit=crop',
      },
      {
        name: 'Beetroot Juice',
        description: 'Earthy beetroot juice, great for stamina and blood health',
        basePrice: 80,
        category: 'Vegetable',
        image: 'https://images.unsplash.com/photo-1613478881426-daaadcf1ec08?w=500&h=500&fit=crop',
      },
    ];

    for (const item of menuItems) {
      await connection.execute(
        'INSERT IGNORE INTO menuItems (name, description, basePrice, category, image, isAvailable) VALUES (?, ?, ?, ?, ?, 1)',
        [item.name, item.description, item.basePrice, item.category, item.image]
      );
    }
    console.log('✓ Menu items added');

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
