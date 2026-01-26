import 'dotenv/config';
import fetch from 'node-fetch';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = 'sanjeet@sau405'; // This should match what's in the frontend

// Create admin token
const adminToken = Buffer.from(JSON.stringify({
  username: ADMIN_USERNAME,
  password: ADMIN_PASSWORD
})).toString('base64');

async function testAdminAPI() {
  console.log('🧪 Testing Admin API...\n');
  console.log('Admin Token:', adminToken.substring(0, 20) + '...');
  console.log('');

  // Test local server first
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('1️⃣ Testing getAllOrders endpoint...');
    
    const response = await fetch(`${baseUrl}/api/trpc/admin.getAllOrders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Response received!');
    console.log('Data structure:', JSON.stringify(data, null, 2));

    // Parse tRPC response
    if (data.result && data.result.data) {
      const orders = data.result.data;
      console.log(`\n📊 Found ${orders.length} orders:`);
      
      orders.forEach((order, idx) => {
        console.log(`\n${idx + 1}. Order #${order.orderNumber}`);
        console.log(`   Customer: ${order.customerName} (${order.customerPhone})`);
        console.log(`   Amount: ₹${order.totalAmount}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Payment: ${order.paymentStatus}`);
        console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
        if (order.items && order.items.length > 0) {
          console.log(`   Items: ${order.items.length}`);
          order.items.forEach(item => {
            console.log(`     - ${item.quantity}x ${item.menuItemName || 'Unknown'} (${item.sizeName || 'Unknown'})`);
          });
        }
      });
    } else {
      console.log('Unexpected response format:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ Server is running\n');
      return true;
    }
  } catch (e) {
    console.error('❌ Server is not running!');
    console.error('Please start the server with: pnpm run dev');
    console.error('');
    return false;
  }
}

(async () => {
  if (await checkServer()) {
    await testAdminAPI();
  }
})();
