import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function testDuplicateOrders() {
  try {
    console.log('\n🔍 Testing duplicate order scenario...\n');
    
    // Test 1: Check for any unique constraints that could fail
    console.log('1. Checking schema constraints:');
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'orders'
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');
    `);
    console.log('Constraints:', constraints.rows);
    
    // Test 2: Check last 5 orders
    console.log('\n2. Last 5 orders:');
    const recentOrders = await pool.query(`
      SELECT 
        id,
        "orderNumber",
        "customerName",
        "customerPhone",
        "totalAmount",
        status,
        "paymentStatus",
        "createdAt"
      FROM orders
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);
    console.log(recentOrders.rows);
    
    // Test 3: Try creating a test order
    console.log('\n3. Testing order creation:');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderNumber = `TEST-${timestamp}-${random}`;
    
    try {
      const result = await pool.query(`
        INSERT INTO orders ("orderNumber", "customerName", "customerPhone", "totalAmount", status, "paymentStatus")
        VALUES ($1, $2, $3, $4, 'pending', 'pending')
        RETURNING *
      `, [orderNumber, 'Test Customer', '9876543210', '100.00']);
      
      console.log('✅ Test order created:', result.rows[0]);
      
      // Clean up
      await pool.query('DELETE FROM orders WHERE "orderNumber" = $1', [orderNumber]);
      console.log('🧹 Test order cleaned up');
    } catch (error) {
      console.error('❌ Error creating test order:', error.message);
    }
    
    // Test 4: Check for duplicate phone numbers
    console.log('\n4. Checking duplicate phone numbers:');
    const duplicatePhones = await pool.query(`
      SELECT 
        "customerPhone",
        COUNT(*) as order_count,
        MIN("createdAt") as first_order,
        MAX("createdAt") as last_order
      FROM orders
      WHERE "customerPhone" IS NOT NULL
      GROUP BY "customerPhone"
      HAVING COUNT(*) > 1
      ORDER BY order_count DESC
      LIMIT 5
    `);
    console.log('Duplicate phones:', duplicatePhones.rows);
    
    // Test 5: Check last order from each phone
    console.log('\n5. Last order from each phone:');
    const lastOrders = await pool.query(`
      SELECT DISTINCT ON ("customerPhone")
        "customerPhone",
        "orderNumber",
        "customerName",
        "totalAmount",
        status,
        "paymentStatus",
        "createdAt"
      FROM orders
      WHERE "customerPhone" IS NOT NULL
      ORDER BY "customerPhone", "createdAt" DESC
      LIMIT 10
    `);
    console.log(lastOrders.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testDuplicateOrders();
