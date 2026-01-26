# 🎯 Neon Migration - Quick Reference

## ⚡ Quick Start (10 Minutes)

### 1️⃣ Get Neon Connection String (2 min)
```
1. Go to: https://neon.tech
2. Sign up with GitHub/Google
3. Create project → Choose "Mumbai" region for India
4. Copy connection string (looks like):
   postgresql://user:pass@ep-xxx.ap-south-1.aws.neon.tech/freshsip?sslmode=require
```

### 2️⃣ Update Local .env (1 min)
```env
DATABASE_URL=postgresql://[paste_your_neon_connection_string_here]
```

### 3️⃣ Test Connection (1 min)
```powershell
pnpm run db:test
```

### 4️⃣ Setup Database (3 min)
```powershell
pnpm run db:push    # Create tables
pnpm run db:seed    # Add menu items
```

### 5️⃣ Test Locally (2 min)
```powershell
pnpm run dev        # Start app
# Visit: http://localhost:5173
```

### 6️⃣ Update Production (1 min)
```
1. Render Dashboard → Your Web Service
2. Environment tab → Edit DATABASE_URL
3. Paste Neon connection string
4. Save (app auto-redeploys)
```

---

## 🔧 Common Commands

```powershell
# Test database connection
pnpm run db:test

# Create/update tables
pnpm run db:push

# Add sample data
pnpm run db:seed

# Check orders in database
node check-orders.mjs

# Start development server
pnpm run dev
```

---

## ⚠️ Troubleshooting

### "Connection timeout"
- **Cause**: Cold start (Neon was sleeping)
- **Fix**: Run command again - second attempt is instant

### "SSL required"
- **Cause**: Missing `?sslmode=require` in connection string
- **Fix**: Add `?sslmode=require` at end of DATABASE_URL

### "No tables found"
- **Cause**: Migrations not run
- **Fix**: Run `pnpm run db:push` then `pnpm run db:seed`

---

## 📊 What Changes?

| Item | Before (Render) | After (Neon) |
|------|----------------|--------------|
| **Connection String** | `postgresql://...render.com/...` | `postgresql://...neon.tech/...?sslmode=require` |
| **Code Changes** | None | None ✅ |
| **Free Duration** | 90 days | Forever ✅ |
| **Cold Start** | 30-60s | 1-2s ✅ |

---

## ✅ Checklist

- [ ] Create Neon account
- [ ] Create project (choose Mumbai region)
- [ ] Copy connection string
- [ ] Update `.env` file locally
- [ ] Run `pnpm run db:test` (verify connection)
- [ ] Run `pnpm run db:push` (create tables)
- [ ] Run `pnpm run db:seed` (add data)
- [ ] Test locally with `pnpm run dev`
- [ ] Update Render environment variable
- [ ] Test production app
- [ ] Monitor for 24-48 hours
- [ ] Delete old Render database

---

## 🆘 Need Help?

See full guide: [NEON_MIGRATION_GUIDE.md](NEON_MIGRATION_GUIDE.md)
