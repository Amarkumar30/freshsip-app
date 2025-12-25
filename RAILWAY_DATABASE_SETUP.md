# Railway Database Setup Guide

## Step 1: Set Up MySQL Database in Railway

1. Go to your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add MySQL"**
3. Railway will create a MySQL database and automatically generate credentials

## Step 2: Get Database Connection String

After MySQL is added, Railway will create these variables automatically:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLDATABASE`
- `MYSQLUSER`
- `MYSQLPASSWORD`

Railway should automatically create a `DATABASE_URL` variable in the format:
```
mysql://user:password@host:port/database
```

### If DATABASE_URL is not auto-created:

1. Go to your **web app service** (not the database)
2. Click **"Variables"** tab
3. Add a new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** `mysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}`
   
   (Railway will automatically substitute the MySQL values)

## Step 3: Run Database Migrations

Once DATABASE_URL is set, you need to create the tables:

### Option A: Add to Railway Build (Recommended)

Update your `package.json` build script to include migrations:

```json
"build": "pnpm run db:push && pnpm run build:client && pnpm run build:server"
```

Then redeploy.

### Option B: Run Manually via Railway CLI

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Link your project:
   ```bash
   railway link
   ```

3. Run migrations:
   ```bash
   railway run pnpm run db:push
   ```

## Step 4: Seed the Database with Menu Items

### Option A: Add Seed to Build (One-time)

Temporarily update `package.json`:
```json
"build": "pnpm run db:push && node seed-db.mjs && pnpm run build:client && pnpm run build:server"
```

Redeploy, then remove the seed command after first deployment.

### Option B: Run Manually via Railway CLI

```bash
railway run node seed-db.mjs
```

### Option C: Run from Railway Shell

1. In Railway dashboard, click on your service
2. Click **"Settings"** → **"Deploy"** section
3. Open the deploy logs and click **"View Logs"**
4. You can also access **Shell** if available and run:
   ```bash
   node seed-db.mjs
   ```

## Step 5: Verify Database

After seeding, your database should have:
- **sizes** table: Small, Medium, Large
- **addOns** table: Ice Cream, Extra Fruit, Honey, etc.
- **menuItems** table: Orange Juice, Mango Juice, Watermelon Juice, etc.

## Quick Fix (Recommended Approach)

Update your `package.json` to automatically handle migrations:

```json
"scripts": {
  "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
  "build": "pnpm run db:push && pnpm run build:client && pnpm run build:server",
  "build:client": "vite build",
  "build:server": "esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "node dist/index.js",
  "db:push": "drizzle-kit generate && drizzle-kit migrate",
  "db:seed": "node seed-db.mjs"
}
```

Then run seed separately once:
```bash
railway run pnpm run db:seed
```

## Troubleshooting

### Error: "Cannot connect to database"
- Check if `DATABASE_URL` is set in Railway variables
- Verify MySQL service is running in Railway
- Check Railway logs for connection errors

### Menu still empty after seeding
- Check Railway logs: `railway logs`
- Verify tables were created: Use Railway's MySQL client or connect with MySQL Workbench
- Try running seed again: `railway run node seed-db.mjs`

### SSL/TLS Connection Issues
The seed script already includes `ssl: { rejectUnauthorized: false }` which should work with Railway MySQL.

## After Setup is Complete

Your FreshSip app should display:
- 8+ juice items in the menu
- Different sizes (Small, Medium, Large)
- Add-ons like Ice Cream, Honey, etc.

Then you can place test orders and see the full functionality!
