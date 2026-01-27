import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function updateStraw() {
  try {
    console.log('\n🥤 Updating Straw product...\n');
    
    // Update straw image
    const newImageUrl = 'https://images.unsplash.com/photo-1615723093586-1ad38d59056b?w=400&h=400&fit=crop';
    
    const result = await pool.query(`
      UPDATE "menuItems" 
      SET image = $1
      WHERE name = 'Straw'
      RETURNING *
    `, [newImageUrl]);
    
    if (result.rows.length > 0) {
      console.log('✅ Straw image updated:', result.rows[0]);
    } else {
      console.log('❌ Straw not found in menu items');
    }
    
    // Remove all size-based prices except one (we'll use the first size as "Standard")
    const straw = await pool.query(`SELECT id FROM "menuItems" WHERE name = 'Straw'`);
    if (straw.rows.length > 0) {
      const strawId = straw.rows[0].id;
      
      // Delete all prices except the first one
      await pool.query(`
        DELETE FROM "menuItemPrices" 
        WHERE "menuItemId" = $1 
        AND "sizeId" != (SELECT MIN(id) FROM sizes)
      `, [strawId]);
      
      console.log('✅ Removed extra size options for Straw');
      
      // Show remaining prices
      const prices = await pool.query(`
        SELECT s.name as size, p.price
        FROM "menuItemPrices" p
        JOIN sizes s ON p."sizeId" = s.id
        WHERE p."menuItemId" = $1
      `, [strawId]);
      console.log('📋 Remaining prices:', prices.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateStraw();
