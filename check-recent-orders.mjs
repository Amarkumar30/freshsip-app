import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkRecentOrders() {
  try {
    console.log('🔍 Checking recent orders...\n');
    
    const result = await pool.query(`
      SELECT 
        o.id,
        o."orderNumber",
        o."customerName",
        o."customerPhone",
        o."totalAmount",
        o.status,
        o."paymentStatus",
        o."createdAt",
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN "orderItems" oi ON o.id = oi."orderId"
      GROUP BY o.id
      ORDER BY o."createdAt" DESC
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No orders found in database!');
      return;
    }
    
    console.log(`✅ Found ${result.rows.length} recent orders:\n`);
    
    result.rows.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.orderNumber}`);
      console.log(`   Customer: ${order.customerName} (${order.customerPhone})`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Status: ${order.paymentStatus} ${order.paymentStatus === 'completed' ? '✅' : '⚠️ NOT COMPLETED'}`);
      console.log(`   Items: ${order.items_count}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    // Check latest order details
    const latestOrder = result.rows[0];
    console.log('📦 Latest order details:');
    
    const itemsResult = await pool.query(`
      SELECT 
        oi.quantity,
        oi."menuItemName" as item_name,
        oi."sizeName" as size_name,
        oi."itemPrice"
      FROM "orderItems" oi
      WHERE oi."orderId" = $1
    `, [latestOrder.id]);
    
    if (itemsResult.rows.length > 0) {
      console.log('\nItems:');
      itemsResult.rows.forEach(item => {
        console.log(`  - ${item.quantity}x ${item.item_name} (${item.size_name}) - ₹${item.itemPrice}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentOrders();
