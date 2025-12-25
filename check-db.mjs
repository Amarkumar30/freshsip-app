#!/usr/bin/env node

// Run database migrations only if DATABASE_URL is set
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'mysql://:@:/') {
  console.log('✓ DATABASE_URL found, running migrations...');
  process.exit(0); // Let drizzle-kit run normally
} else {
  console.log('⚠️  DATABASE_URL not set, skipping migrations.');
  console.log('   Migrations will need to be run manually after deployment.');
  process.exit(0); // Exit successfully without running migrations
}
