import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const result = await pool.query(`
  SELECT category, COUNT(*) as count 
  FROM "menuItems" 
  WHERE "isAvailable" = true
  GROUP BY category 
  ORDER BY category
`);

console.log('\n📋 Menu Summary:\n');
result.rows.forEach(r => console.log(`   ${r.category}: ${r.count} items`));

const total = await pool.query('SELECT COUNT(*) as count FROM "menuItems" WHERE "isAvailable" = true');
console.log(`\n   Total: ${total.rows[0].count} items\n`);

await pool.end();
