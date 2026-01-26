import 'dotenv/config';
import { getDb } from './server/db.js';
import { orders, orderItems } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

async function testOrdersDirectly() {
  console.log('🔍 Testing order retrieval directly from database...\n');
  
  try {
    const db = await getDb();
    
    console.log('1️⃣ Fetching all orders...');
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    console.log(`✅ Found ${allOrders.length} orders\n`);
    
    if (allOrders.length === 0) {
      console.log('❌ No orders in database!');
      return;
    }
    
    for (const order of allOrders) {
      console.log(`Order #${order.orderNumber}`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Customer: ${order.customerName} (${order.customerPhone})`);
      console.log(`  Amount: ₹${order.totalAmount}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Payment Status: ${order.paymentStatus}`);
      console.log(`  Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log('');
    }
    
    // Now test the getAllOrdersWithItems function
    console.log('\n2️⃣ Testing getAllOrdersWithItems function...');
    const { getAllOrdersWithItems } = await import('./server/db.js');
    const ordersWithItems = await getAllOrdersWithItems();
    
    console.log(`✅ getAllOrdersWithItems returned ${ordersWithItems.length} orders\n`);
    
    if (ordersWithItems.length > 0) {
      const firstOrder = ordersWithItems[0];
      console.log('First order details:');
      console.log(JSON.stringify(firstOrder, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testOrdersDirectly();
