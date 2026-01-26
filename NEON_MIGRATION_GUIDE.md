# 🚀 Migrate Database from Render to Neon

## Why Neon?
- ✅ **Always free tier** (no 90-day limit like Render)
- ✅ **Instant cold starts** (serverless PostgreSQL)
- ✅ **Auto-suspend** when idle (saves resources)
- ✅ **500MB storage** on free tier
- ✅ **PostgreSQL compatible** (no code changes needed)
- ✅ **Branching support** (create dev/staging databases instantly)

---

## Step 1: Create Neon Account & Database

### 1.1 Sign Up
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"**
3. Sign in with **GitHub** or **Google** (recommended)

### 1.2 Create Project
1. After login, click **"Create Project"**
2. Fill in:
   - **Project Name**: `freshsip` (or any name)
   - **Region**: Select closest to your users:
     - `aws-ap-south-1` (Mumbai) - **Best for India** 🇮🇳
     - `aws-ap-southeast-1` (Singapore)
     - `aws-us-east-2` (Ohio)
   - **PostgreSQL Version**: `16` (latest)
3. Click **"Create Project"**

### 1.3 Get Connection String
1. After creation, you'll see the **Connection Details** page
2. Copy the **Connection String** (looks like this):
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```
3. **IMPORTANT**: Save this somewhere safe - you can't see the password again!

**Example**:
```
postgresql://freshsip_owner:AbCdEf123456@ep-cool-name-12345.ap-south-1.aws.neon.tech/freshsip?sslmode=require
```

---

## Step 2: Backup Current Database (Optional but Recommended)

### Option A: Backup from Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your database service
3. Go to **"Backups"** tab
4. Click **"Create Manual Backup"**
5. Download the backup file

### Option B: Export via pg_dump (if you have access)
```powershell
# Install PostgreSQL tools first (if not installed)
# Download from: https://www.postgresql.org/download/windows/

# Export current database
$env:RENDER_DB_URL="your_render_database_url"
pg_dump $env:RENDER_DB_URL > backup_render_$(Get-Date -Format 'yyyy-MM-dd').sql
```

---

## Step 3: Update Environment Variables

### 3.1 Local Development (.env file)
Open your `.env` file and update:

```env
# Old Render URL (comment out or delete)
# DATABASE_URL=postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/freshsip

# New Neon URL (paste your connection string)
DATABASE_URL=postgresql://freshsip_owner:your_password@ep-xxx.ap-south-1.aws.neon.tech/freshsip?sslmode=require
```

### 3.2 Production (Render Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your **Web Service** (freshsip app, not database)
3. Go to **"Environment"** tab
4. Find `DATABASE_URL` variable
5. Click **"Edit"**
6. Paste your **Neon connection string**
7. Click **"Save Changes"**

**IMPORTANT**: Your app will automatically redeploy with new database URL.

---

## Step 4: Run Database Migrations

### 4.1 Local Migration (Test First)
```powershell
# Navigate to your project
cd c:\Users\amarr\OneDrive\Desktop\v2\v3\freshsip-app-complete\freshsip-app

# Check if Neon database is accessible
node check-db.mjs

# Run migrations (creates tables)
pnpm run db:push

# Verify tables were created
node -e "import pg from 'pg'; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); const client = await pool.connect(); const result = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\''); console.log('Tables:', result.rows); client.release(); pool.end();"
```

### 4.2 Seed Database (Fresh Start)
```powershell
# Seed with menu items, sizes, add-ons
pnpm run db:seed
```

### 4.3 Or Restore from Backup (If you want old orders)
```powershell
# If you have a backup from Render
$env:DATABASE_URL="your_neon_connection_string"
psql $env:DATABASE_URL < backup_render_2026-01-26.sql
```

---

## Step 5: Test Everything

### 5.1 Test Database Connection
```powershell
# Quick connection test
node check-orders.mjs
```

**Expected Output**:
```
🔍 Checking orders in database...
✅ Found 0 recent orders
(or list of orders if you restored backup)
```

### 5.2 Test Local App
```powershell
# Start development server
pnpm run dev
```

Visit `http://localhost:5173` and:
- ✅ Menu items load correctly
- ✅ Can add items to cart
- ✅ Can create test order
- ✅ Admin panel shows orders

### 5.3 Test Production (After Render Redeploy)
1. Wait for Render to finish redeploying (2-3 minutes)
2. Visit your production URL
3. Test the same features as above
4. Check admin panel for real-time order updates

---

## Step 6: Update UptimeRobot/Cron Jobs (No Changes Needed!)

✅ **Good news**: Your UptimeRobot setup doesn't need any changes!
- Still pings: `https://your-app.onrender.com/health`
- Health endpoint doesn't query database
- App stays warm regardless of database provider

---

## Step 7: Clean Up Old Render Database (Optional)

**WAIT 24-48 hours** to ensure everything works, then:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your **old PostgreSQL database**
3. Go to **"Settings"** tab
4. Scroll to bottom
5. Click **"Delete Database"**
6. Confirm deletion

⚠️ **Warning**: This is permanent! Make sure your Neon database is working first.

---

## Troubleshooting

### Issue 1: "Connection Timeout" Error
**Cause**: Neon database auto-suspends when idle
**Fix**: 
- First query might take 1-2 seconds (cold start)
- Your retry logic in `check-orders.mjs` handles this automatically
- Subsequent queries are instant

### Issue 2: "SSL Connection Error"
**Cause**: SSL mode not set correctly
**Fix**: Ensure connection string has `?sslmode=require` at the end
```
postgresql://user:pass@host/db?sslmode=require
```

### Issue 3: "Relation Does Not Exist" Error
**Cause**: Tables not created yet
**Fix**: Run migrations
```powershell
pnpm run db:push
pnpm run db:seed
```

### Issue 4: "Too Many Connections"
**Cause**: Connection pool not closed properly
**Fix**: Already handled in your code (`server/db.ts` has proper pooling)

### Issue 5: Can't See Old Orders After Migration
**Options**:
1. **Start Fresh**: Just seed the database (recommended for testing)
2. **Restore Backup**: Import your Render backup (if you need old data)

---

## Neon Dashboard Features

### Monitor Your Database
1. Go to [Neon Console](https://console.neon.tech)
2. Click your project
3. View:
   - **Storage usage** (max 500MB free tier)
   - **Query duration** (active time)
   - **Connections** (current active connections)
   - **Branches** (create test databases instantly)

### Create Database Branches (Pro Feature)
```bash
# Create a dev branch (copies main database)
neonctl branches create --name dev

# Get branch connection string
neonctl connection-string dev
```

---

## Performance Comparison: Render vs Neon

| Feature | Render Free PostgreSQL | Neon Free Tier |
|---------|----------------------|----------------|
| **Duration** | 90 days free | Forever free ✅ |
| **Storage** | 1GB | 500MB |
| **Cold Start** | 30-60 seconds | 1-2 seconds ✅ |
| **Auto-suspend** | No | Yes (saves quota) ✅ |
| **Backups** | Manual | Automatic ✅ |
| **Branching** | No | Yes ✅ |
| **Scaling** | Manual | Serverless auto-scale ✅ |

---

## FAQ

**Q: Will I lose my orders during migration?**
A: Only if you don't backup. Follow Step 2 to backup first.

**Q: Do I need to change any code?**
A: No! Neon uses PostgreSQL, fully compatible with your current code.

**Q: What happens to my current Render database?**
A: It keeps running until you delete it. You can keep both temporarily.

**Q: Will my app go down during migration?**
A: Yes, for ~2-3 minutes when Render redeploys with new DATABASE_URL.

**Q: Can I rollback if something goes wrong?**
A: Yes! Just change DATABASE_URL back to your Render connection string.

**Q: How much does Neon cost after free tier?**
A: Free tier should be enough for small apps. Paid plans start at $19/month.

---

## Next Steps After Migration

1. ✅ Test app thoroughly (24 hours)
2. ✅ Monitor Neon dashboard for any issues
3. ✅ Update your documentation with new database info
4. ✅ Delete old Render database (after 48 hours of stable operation)
5. ✅ Celebrate! 🎉 You now have a better, free database.

---

## Support

- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)
- **Neon Discord**: [https://discord.gg/neon](https://discord.gg/neon)
- **PostgreSQL Docs**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

---

**Ready to migrate?** Start with Step 1 and follow along! 🚀
