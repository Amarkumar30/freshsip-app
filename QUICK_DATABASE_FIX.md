# Quick Database Fix for Empty Menu

Your app is deployed and working, but the menu is empty because the database needs to be set up.

## Quick Steps:

### 1. Add MySQL Database to Railway
```
Railway Dashboard → New → Database → Add MySQL
```

### 2. Check DATABASE_URL Variable
In your **web service** (not MySQL), go to Variables tab and verify `DATABASE_URL` exists.

If missing, add it:
```
DATABASE_URL = mysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
```

### 3. Redeploy to Run Migrations
The build process will now automatically run database migrations.

Click **"Redeploy"** in Railway or just wait for the auto-deploy from the latest push.

### 4. Seed the Database (One Time)

**Option A - Via Railway CLI (Easiest):**
```bash
npm i -g @railway/cli
railway link
railway run node seed-db.mjs
```

**Option B - Add to build temporarily:**
In Railway Variables, add:
```
BUILD_COMMAND = pnpm install && pnpm run db:push && node seed-db.mjs && pnpm run build:client && pnpm run build:server
```
Then redeploy, then remove this override.

### 5. Refresh Your App
Menu should now show 8 juice items!

---

## Expected Result:
- ✅ Orange Juice
- ✅ Mango Juice  
- ✅ Watermelon Juice
- ✅ Pomegranate Juice
- ✅ Mixed Fruit Juice
- ✅ Pineapple Juice
- ✅ Carrot Juice
- ✅ Beetroot Juice

Plus sizes (Small, Medium, Large) and add-ons (Ice Cream, Honey, etc.)

---

See [RAILWAY_DATABASE_SETUP.md](RAILWAY_DATABASE_SETUP.md) for detailed instructions.
