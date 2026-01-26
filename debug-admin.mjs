import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('🔍 Checking order and WebSocket configuration...\n');

// Check orders
const orders = await pool.query(`
  SELECT 
    o.id, 
    o."orderNumber", 
    o."customerName", 
    o."totalAmount", 
    o.status, 
    o."paymentStatus",
    o."createdAt",
    COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN "orderItems" oi ON o.id = oi."orderId"
  GROUP BY o.id
  ORDER BY o."createdAt" DESC 
  LIMIT 10
`);

if (orders.rows.length === 0) {
  console.log('❌ No orders found in database');
  console.log('\n📝 Try placing a test order from the menu page');
} else {
  console.log(`✅ Found ${orders.rows.length} orders:\n`);
  orders.rows.forEach((order, i) => {
    console.log(`${i + 1}. ${order.orderNumber}`);
    console.log(`   Customer: ${order.customerName}`);
    console.log(`   Amount: ₹${order.totalAmount}`);
    console.log(`   Items: ${order.item_count}`);
    console.log(`   Status: ${order.status} | Payment: ${order.paymentStatus}`);
    console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
    console.log('');
  });
}

// Check admin credentials
console.log('🔐 Admin Authentication:');
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH) {
  console.log(`   ✅ Username: ${process.env.ADMIN_USERNAME}`);
  console.log(`   ✅ Password hash configured`);
} else {
  console.log('   ⚠️  ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set!');
  console.log('   Run: node generate-admin-hash.mjs');
}

// Check WebSocket URL
console.log('\n🔌 WebSocket Configuration:');
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
if (allowedOrigins.length > 0) {
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
} else {
  console.log('   ⚠️  No ALLOWED_ORIGINS set (using defaults)');
}

console.log('\n📊 Troubleshooting Tips:');
console.log('   1. Admin panel should connect to WebSocket on page load');
console.log('   2. Orders emit "new-order" event to "admin-room"');
console.log('   3. Check browser console for WebSocket connection errors');
console.log('   4. Verify admin is logged in with correct credentials');
console.log('   5. Orders should appear without page refresh (real-time)');

await pool.end();
