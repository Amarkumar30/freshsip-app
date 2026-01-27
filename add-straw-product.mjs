import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function addStrawAsProduct() {
  try {
    console.log('\n🥤 Adding Straw as a separate menu product...\n');
    
    // First, remove Straw from addOns if it exists
    await pool.query(`DELETE FROM "addOns" WHERE name = 'Straw'`);
    console.log('🧹 Removed Straw from add-ons (if existed)');
    
    // Check if Straw already exists in menuItems
    const existing = await pool.query(`
      SELECT * FROM "menuItems" WHERE name = 'Straw'
    `);
    
    let strawId;
    
    if (existing.rows.length > 0) {
      console.log('⏭️  Straw already exists in menu items:', existing.rows[0]);
      strawId = existing.rows[0].id;
      
      // Update the image
      await pool.query(`
        UPDATE "menuItems" 
        SET image = 'https://images.unsplash.com/photo-1568899900127-aef5da3bde76?w=400&h=400&fit=crop',
            "basePrice" = '2.00',
            "isAvailable" = true
        WHERE id = $1
      `, [strawId]);
      console.log('✅ Updated Straw with new image and price');
    } else {
      // Add new Straw menu item
      const result = await pool.query(`
        INSERT INTO "menuItems" (name, description, "basePrice", image, category, "isAvailable")
        VALUES (
          'Straw', 
          'Colorful eco-friendly straw for your drink',
          '2.00',
          'https://images.unsplash.com/photo-1568899900127-aef5da3bde76?w=400&h=400&fit=crop',
          'Extras',
          true
        )
        RETURNING *
      `);
      
      strawId = result.rows[0].id;
      console.log('✅ Straw added to menu items:', result.rows[0]);
    }
    
    // Get all sizes
    const sizes = await pool.query(`SELECT id, name FROM sizes ORDER BY id`);
    console.log('\n📏 Available sizes:', sizes.rows.map(s => s.name).join(', '));
    
    // For Straw, we'll add a single "Standard" price for all sizes (₹2)
    // Remove existing prices for Straw
    await pool.query(`DELETE FROM "menuItemPrices" WHERE "menuItemId" = $1`, [strawId]);
    
    // Add price for each size (all ₹2 since it's just a straw)
    for (const size of sizes.rows) {
      await pool.query(`
        INSERT INTO "menuItemPrices" ("menuItemId", "sizeId", price, "isAvailable")
        VALUES ($1, $2, '2.00', true)
      `, [strawId, size.id]);
    }
    console.log(`✅ Added prices for all ${sizes.rows.length} sizes (₹2 each)`);
    
    // Show the final product
    console.log('\n📋 Straw product details:');
    const finalProduct = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.description,
        m."basePrice",
        m.category,
        m.image,
        m."isAvailable"
      FROM "menuItems" m
      WHERE m.name = 'Straw'
    `);
    console.log(finalProduct.rows[0]);
    
    // Show prices
    console.log('\n💰 Straw prices by size:');
    const prices = await pool.query(`
      SELECT s.name as size, p.price
      FROM "menuItemPrices" p
      JOIN sizes s ON p."sizeId" = s.id
      WHERE p."menuItemId" = $1
      ORDER BY s.id
    `, [strawId]);
    console.table(prices.rows);
    
    // Show menu item count
    const count = await pool.query(`SELECT COUNT(*) as total FROM "menuItems" WHERE "isAvailable" = true`);
    console.log(`\n📊 Total menu items: ${count.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addStrawAsProduct();
