# Quick Database Fix for Empty Menu

Your app build is failing because `DATABASE_URL` is not set. The database needs to be configured first.

## Quick Steps:

### 1. Add MySQL Database to Railway
```
Railway Dashboard → New → Database → Add MySQL
```
Wait for it to finish provisioning (about 30 seconds).

### 2. Link DATABASE_URL to Your Web Service

**Option A - Automatic (Recommended):**
Railway should automatically add a `DATABASE_URL` variable to your web service that references the MySQL service.

Check your web service → Variables tab. You should see:
```
DATABASE_URL = ${{MySQL.DATABASE_URL}}
```

**Option B - Manual:**
If not auto-created, in your web service Variables, add:
```
DATABASE_URL = mysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
```

### 3. Redeploy
Once DATABASE_URL is set, click **"Redeploy"** or trigger a new deployment.

The build will now succeed!

### 4. Run Migrations (After Successful Deploy)

**Via Railway CLI:**
```bash
npm i -g @railway/cli
railway link
railway run pnpm run db:push
```

### 5. Seed the Database (One Time)

```bash
railway run node seed-db.mjs
```

### 6. Refresh Your App
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
