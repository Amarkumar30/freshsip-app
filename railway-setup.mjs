#!/usr/bin/env node

/**
 * This script runs database migrations and seeding via Railway shell
 * Use: node railway-setup.mjs
 */

import { execSync } from 'child_process';

console.log('🚀 Setting up FreshSip database on Railway...\n');

try {
  console.log('Step 1: Running database migrations...');
  execSync('railway run pnpm drizzle-kit generate', { stdio: 'inherit' });
  execSync('railway run pnpm drizzle-kit migrate', { stdio: 'inherit' });
  console.log('✅ Migrations completed!\n');

  console.log('Step 2: Seeding database with menu items...');
  execSync('railway run node seed-db.mjs', { stdio: 'inherit' });
  console.log('✅ Database seeded!\n');

  console.log('🎉 Database setup complete! Your menu should now be visible.');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure you saved the DATABASE_URL in Railway dashboard');
  console.log('2. Try running: railway link');
  console.log('3. Then run this script again');
  process.exit(1);
}
