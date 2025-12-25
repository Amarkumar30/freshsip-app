import mysql from 'mysql2/promise';

// Parse DATABASE_URL properly
const dbUrl = process.env.DATABASE_URL || 'mysql://freshsip_user:freshsip_password@localhost:3306/freshsip';
const urlObj = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: urlObj.hostname,
  user: urlObj.username,
  password: urlObj.password,
  database: urlObj.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    console.log('Seeding database...');

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
    console.log('You can now browse the menu at http://localhost:3000/menu');
  } catch (error) {
    console.error('❌ Error seeding database:', error?.message || error);
  } finally {
    await connection.end();
  }
}

seed();
