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
      customerPhone VARCHAR(20) NOT NULL,
      status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
      totalAmount DECIMAL(10,2) NOT NULL,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_orders_status (status),
      INDEX idx_orders_orderNumber (orderNumber)
    )
  `);

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

    // Insert add-ons
    const addOns = [
      { name: 'Ice Cream', price: 30 },
      { name: 'Extra Fruit', price: 20 },
      { name: 'Honey', price: 15 },
      { name: 'Whipped Cream', price: 25 },
      { name: 'Chia Seeds', price: 20 },
    ];

    for (const addOn of addOns) {
      await connection.execute(
        'INSERT IGNORE INTO addOns (name, price, isAvailable) VALUES (?, ?, 1)',
        [addOn.name, addOn.price]
      );
    }
    console.log('✓ Add-ons added');

    // Insert menu items
    const menuItems = [
      {
        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice, rich in vitamin C',
        basePrice: 80,
        category: 'Citrus',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop',
      },
      {
        name: 'Mango Juice',
        description: 'Sweet and creamy mango juice, king of fruits',
        basePrice: 100,
        category: 'Tropical',
        image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop',
      },
      {
        name: 'Watermelon Juice',
        description: 'Refreshing watermelon juice, perfect for summer',
        basePrice: 70,
        category: 'Seasonal',
        image: 'https://images.unsplash.com/photo-1585518419759-fce0e1e37fcc?w=400&h=400&fit=crop',
      },
      {
        name: 'Pomegranate Juice',
        description: 'Antioxidant-rich pomegranate juice',
        basePrice: 120,
        category: 'Premium',
        image: 'https://images.unsplash.com/photo-1585518419759-fce0e1e37fcc?w=400&h=400&fit=crop',
      },
      {
        name: 'Mixed Fruit Juice',
        description: 'Blend of orange, apple, and pineapple',
        basePrice: 90,
        category: 'Mixed',
        image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73?w=400&h=400&fit=crop',
      },
      {
        name: 'Pineapple Juice',
        description: 'Tropical pineapple juice with natural sweetness',
        basePrice: 85,
        category: 'Tropical',
        image: 'https://images.unsplash.com/photo-1585518419759-fce0e1e37fcc?w=400&h=400&fit=crop',
      },
      {
        name: 'Carrot Juice',
        description: 'Nutritious carrot juice, good for eyesight',
        basePrice: 75,
        category: 'Vegetable',
        image: 'https://images.unsplash.com/photo-1585518419759-fce0e1e37fcc?w=400&h=400&fit=crop',
      },
      {
        name: 'Apple Juice',
        description: 'Crisp and refreshing apple juice',
        basePrice: 80,
        category: 'Citrus',
        image: 'https://images.unsplash.com/photo-1585518419759-fce0e1e37fcc?w=400&h=400&fit=crop',
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
