import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function addStraw() {
  try {
    console.log('\n🥤 Adding Straw to menu add-ons...\n');
    
    // Check if Straw already exists
    const existing = await pool.query(`
      SELECT * FROM "addOns" WHERE name = 'Straw'
    `);
    
    if (existing.rows.length > 0) {
      console.log('⏭️  Straw already exists:', existing.rows[0]);
      
      // Update the image if needed
      console.log('\n✅ Straw is already in the menu!');
    } else {
      // Add new Straw add-on
      const result = await pool.query(`
        INSERT INTO "addOns" (name, price, "isAvailable")
        VALUES ('Straw', '2.00', true)
        RETURNING *
      `);
      
      console.log('✅ Straw added successfully:', result.rows[0]);
    }
    
    // Show all add-ons
    console.log('\n📋 All available add-ons:');
    const allAddOns = await pool.query(`
      SELECT id, name, price, "isAvailable"
      FROM "addOns"
      ORDER BY price ASC
    `);
    
    console.table(allAddOns.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addStraw();
