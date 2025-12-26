#!/bin/sh
echo "🚀 Starting FreshSip App..."

echo "📦 Running database migrations..."
pnpm drizzle-kit migrate || echo "⚠️  Migrations failed or already applied"

echo "🌱 Seeding database..."
node seed-db.mjs || echo "⚠️  Seeding failed or already completed"

echo "✅ Starting application server..."
node dist/index.js
