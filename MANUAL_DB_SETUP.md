# Manual Database Setup (If Railway CLI Issues)

The Railway CLI might be caching the old DATABASE_URL. Here's how to set up the database manually:

## Option 1: Use Railway Dashboard Shell (Easiest)

1. Go to https://railway.app
2. Open your project **"sublime-courtesy"**
3. Click on **"freshsip-app"** service
4. Go to the **"Deployments"** tab
5. Click on the latest deployment
6. Click **"View Logs"** 
7. Look for a **"Shell"** or **"Console"** button (might be in a menu)
8. In the shell, run these commands:

```bash
cd /app
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
node seed-db.mjs
```

## Option 2: Use Railway API (Advanced)

If Railway has a shell/terminal feature:
1. Open the service terminal/shell from Railway dashboard
2. Run the migration commands directly in the Railway environment

## Option 3: Close PowerShell and Start Fresh

The Railway CLI might be caching variables. Try this:

1. **Close PowerShell completely**
2. Open a **new PowerShell window**
3. Navigate to your project:
   ```powershell
   cd C:\Users\amarr\OneDrive\Desktop\v2\v3\freshsip-app-complete\freshsip-app
   ```
4. Link Railway again:
   ```powershell
   railway link
   ```
   Select: Amar Kumar's Projects → sublime-courtesy → production → freshsip-app

5. Verify DATABASE_URL is correct:
   ```powershell
   railway variables | Select-String "DATABASE_URL"
   ```

6. If it shows the correct MySQL URL (not `mysql://:@:/`), run:
   ```powershell
   railway run pnpm run db:push
   railway run node seed-db.mjs
   ```

## Option 4: Run Migrations After Deployment

The migrations are already set to run on Railway during deployment. So:

1. Make sure DATABASE_URL is saved in Railway dashboard (you've done this)
2. Go to Railway → freshsip-app → Deployments
3. Click **"Redeploy"** button
4. Watch the build logs - migrations should run automatically
5. Then just run the seeding:
   ```powershell
   railway run node seed-db.mjs
   ```

## Verification

After any of these options, check:
- Visit https://freshsip.qikcart.in
- The menu should show juice items
- You should see: Orange Juice, Mango Juice, Watermelon Juice, etc.

## If Still Not Working

The tables might already exist but are empty. Just run:
```powershell
railway run node seed-db.mjs
```

This will populate the database with menu items even if migrations already ran.
