#!/usr/bin/env node
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

console.log('🔍 Testing Neon Database Connection...\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('💡 Make sure you have a .env file with DATABASE_URL set');
  process.exit(1);
}

// Check if it's a Neon connection string
const isNeon = process.env.DATABASE_URL.includes('neon.tech');
const isRender = process.env.DATABASE_URL.includes('render.com');
const isRailway = process.env.DATABASE_URL.includes('railway');

console.log('📊 Database Provider:');
if (isNeon) console.log('   ✅ Neon (neon.tech)');
else if (isRender) console.log('   ⚠️  Render (render.com) - Consider migrating to Neon');
else if (isRailway) console.log('   ⚠️  Railway - Consider migrating to Neon');
else console.log('   ❓ Unknown provider');
console.log('');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || isNeon || isRender ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  const startTime = Date.now();
  
  try {
    // Test connection
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully (${connectTime}ms)`);
    
    if (connectTime > 2000) {
      console.log('⚠️  Cold start detected - first connection took >2 seconds');
      console.log('   This is normal for Neon serverless databases');
    }
    
    // Check PostgreSQL version
    console.log('\n📦 Database Info:');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log(`   PostgreSQL: ${version.split(' ')[1]}`);
    
    // List all tables
    console.log('\n📋 Tables in database:');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found');
      console.log('   💡 Run: pnpm run db:push');
      console.log('   💡 Then: pnpm run db:seed');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✅ ${row.tablename}`);
      });
      
      // Count records in key tables
      console.log('\n📊 Record Counts:');
      
      const tables = ['menuItems', 'sizes', 'addOns', 'orders'];
      for (const table of tables) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const count = parseInt(countResult.rows[0].count);
          const icon = count > 0 ? '✅' : '⚠️ ';
          console.log(`   ${icon} ${table}: ${count} records`);
        } catch (e) {
          console.log(`   ❌ ${table}: Table not found`);
        }
      }
    }
    
    // Check database size (Neon free tier = 500MB)
    if (isNeon) {
      console.log('\n💾 Storage Usage:');
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      console.log(`   Database size: ${sizeResult.rows[0].size}`);
      console.log('   Free tier limit: 500 MB');
    }
    
    // Test a simple query
    console.log('\n🧪 Running test query...');
    const testStart = Date.now();
    await client.query('SELECT 1 as test');
    const testTime = Date.now() - testStart;
    console.log(`✅ Query successful (${testTime}ms)`);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ All checks passed! Database is ready.\n');
    
    // Next steps
    if (tablesResult.rows.length === 0) {
      console.log('📝 Next Steps:');
      console.log('   1. Run migrations: pnpm run db:push');
      console.log('   2. Seed database: pnpm run db:seed');
      console.log('   3. Start app: pnpm run dev\n');
    } else {
      console.log('🚀 You can now start your app: pnpm run dev\n');
    }
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`\n❌ Connection failed after ${errorTime}ms\n`);
    console.error('Error details:', error.message);
    console.error('');
    
    // Provide helpful error messages
    if (error.message.includes('timeout')) {
      console.log('💡 Troubleshooting:');
      console.log('   • Neon database might be suspended (cold start)');
      console.log('   • Try running this script again');
      console.log('   • Check if DATABASE_URL is correct\n');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Troubleshooting:');
      console.log('   • Check username and password in DATABASE_URL');
      console.log('   • Make sure you copied the full connection string from Neon\n');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('💡 Troubleshooting:');
      console.log('   • Check your internet connection');
      console.log('   • Verify the database host is correct in DATABASE_URL\n');
    } else if (error.message.includes('SSL')) {
      console.log('💡 Troubleshooting:');
      console.log('   • Neon requires SSL connection');
      console.log('   • Make sure DATABASE_URL ends with: ?sslmode=require\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
