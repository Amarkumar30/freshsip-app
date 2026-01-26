#!/usr/bin/env node
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkOrders() {
  console.log('🔍 Checking orders in database...\n');

  const MAX_ATTEMPTS = parseInt(process.env.CHECK_ORDERS_MAX_RETRIES || '5', 10);
  const BASE_DELAY_MS = parseInt(process.env.CHECK_ORDERS_BASE_DELAY_MS || '1000', 10);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          "orderNumber", 
          "customerName", 
          "totalAmount", 
          status, 
          "paymentStatus",
          "createdAt"
        FROM orders 
        ORDER BY "createdAt" DESC 
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        console.log('❌ No orders found in database');
      } else {
        console.log(`✅ Found ${result.rows.length} recent orders:\n`);
        result.rows.forEach((order, i) => {
          console.log(`${i + 1}. Order #${order.orderNumber}`);
          console.log(`   Customer: ${order.customerName}`);
          console.log(`   Amount: ₹${order.totalAmount}`);
          console.log(`   Status: ${order.status}`);
          console.log(`   Payment: ${order.paymentStatus}`);
          console.log(`   Date: ${order.createdAt}`);
          console.log('');
        });
      }

      await pool.end();
      return;
    } catch (error) {
      const isLast = attempt === MAX_ATTEMPTS;
      console.error(`❌ Attempt ${attempt} failed: ${error.message}`);

      if (isLast) {
        console.error('❌ All attempts failed — giving up.');
        try { await pool.end(); } catch (e) {}
        process.exit(1);
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${Math.round(delay/1000)}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`);
      await sleep(delay);
    }
  }
}

checkOrders();
