import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function testSecondOrder() {
  try {
    console.log('\n🧪 Testing second order from same phone scenario...\n');
    
    const testPhone = '9999999999';
    const testName = 'Test User';
    
    // Check if there are existing orders from this phone
    const existingOrders = await pool.query(`
      SELECT "orderNumber", "customerName", "customerPhone", "totalAmount", status, "paymentStatus", "createdAt"
      FROM orders
      WHERE "customerPhone" = $1
      ORDER BY "createdAt" DESC
    `, [testPhone]);
    
    console.log(`📋 Existing orders from ${testPhone}:`, existingOrders.rows.length);
    if (existingOrders.rows.length > 0) {
      console.log('Last order:', existingOrders.rows[0]);
    }
    
    // Create first order
    console.log('\n1️⃣ Creating first order...');
    const order1Number = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order1Result = await pool.query(`
      INSERT INTO orders ("orderNumber", "customerName", "customerPhone", "totalAmount", status, "paymentStatus")
      VALUES ($1, $2, $3, $4, 'pending', 'pending')
      RETURNING *
    `, [order1Number, testName, testPhone, '50.00']);
    
    const order1 = order1Result.rows[0];
    console.log('✅ First order created:', order1.id, order1.orderNumber);
    
    // Add item to first order
    await pool.query(`
      INSERT INTO "orderItems" ("orderId", "menuItemId", "menuItemName", "sizeId", "sizeName", "quantity", "itemPrice", "addOnsTotal")
      VALUES ($1, 1, 'Test Juice', 1, 'Small', 1, '50.00', '0.00')
    `, [order1.id]);
    console.log('✅ Item added to first order');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create second order (simulating repeat customer)
    console.log('\n2️⃣ Creating second order from SAME PHONE...');
    const order2Number = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    try {
      const order2Result = await pool.query(`
        INSERT INTO orders ("orderNumber", "customerName", "customerPhone", "totalAmount", status, "paymentStatus")
        VALUES ($1, $2, $3, $4, 'pending', 'pending')
        RETURNING *
      `, [order2Number, testName, testPhone, '60.00']);
      
      const order2 = order2Result.rows[0];
      console.log('✅ Second order created:', order2.id, order2.orderNumber);
      
      // Add item to second order
      await pool.query(`
        INSERT INTO "orderItems" ("orderId", "menuItemId", "menuItemName", "sizeId", "sizeName", "quantity", "itemPrice", "addOnsTotal")
        VALUES ($1, 2, 'Another Juice', 1, 'Small', 1, '60.00', '0.00')
      `, [order2.id]);
      console.log('✅ Item added to second order');
      
      // Verify both orders exist
      console.log('\n📊 Verification:');
      const allTestOrders = await pool.query(`
        SELECT 
          o.id,
          o."orderNumber",
          o."customerPhone",
          o."totalAmount",
          o.status,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN "orderItems" oi ON o.id = oi."orderId"
        WHERE o."orderNumber" IN ($1, $2)
        GROUP BY o.id, o."orderNumber", o."customerPhone", o."totalAmount", o.status
      `, [order1Number, order2Number]);
      
      console.log('Both orders:', allTestOrders.rows);
      
      if (allTestOrders.rows.length === 2) {
        console.log('\n✅ SUCCESS: Both orders created with items!');
      } else {
        console.log('\n❌ FAILURE: Only', allTestOrders.rows.length, 'order(s) found!');
      }
      
      // Clean up
      console.log('\n🧹 Cleaning up test orders...');
      await pool.query('DELETE FROM "orderItems" WHERE "orderId" IN ($1, $2)', [order1.id, order2.id]);
      await pool.query('DELETE FROM orders WHERE id IN ($1, $2)', [order1.id, order2.id]);
      console.log('✅ Test orders cleaned up');
      
    } catch (error) {
      console.error('❌ Error creating second order:', error.message);
      console.error('Code:', error.code);
      console.error('Detail:', error.detail);
      
      // Clean up first order
      await pool.query('DELETE FROM "orderItems" WHERE "orderId" = $1', [order1.id]);
      await pool.query('DELETE FROM orders WHERE id = $1', [order1.id]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testSecondOrder();
