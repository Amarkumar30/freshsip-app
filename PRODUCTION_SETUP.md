# 🚀 Production Setup for https://www.freshsip.qikcart.in

## Step 1: Update Render Environment Variables

Go to [Render Dashboard](https://dashboard.render.com/) → Your Web Service → **Environment** tab

### Add/Update These Variables:

```env
# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_9NRYFpIM5Lfi@ep-polished-dream-afvtof4o-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# CORS & WebSocket (CRITICAL)
ALLOWED_ORIGINS=https://www.freshsip.qikcart.in,https://freshsip.qikcart.in

# Node Environment
NODE_ENV=production

# Admin Credentials (Already configured)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=(your existing hash)

# Razorpay (Already configured)
RAZORPAY_KEY_ID=(your existing key)
RAZORPAY_KEY_SECRET=(your existing secret)
RAZORPAY_WEBHOOK_SECRET=(your existing secret)
VITE_RAZORPAY_KEY_ID=(your existing key)

# JWT Secret (Already configured)
JWT_SECRET=(your existing secret)
```

**Click "Save Changes"** - Render will auto-redeploy (takes 2-3 minutes)

---

## Step 2: Add Menu Items to Production Database

After Render finishes deploying:

### Option A: Render Shell (Easiest)
1. Render Dashboard → Your Service → **Shell** tab
2. Run:
   ```bash
   node add-full-menu.mjs
   ```
3. Should show: "✨ Complete! Added: 21 new items"

### Option B: Manual Deploy Script
If shell doesn't work, I can create a one-time deploy script for you.

---

## Step 3: Test Everything

### 1. Health Check
Visit: https://www.freshsip.qikcart.in/health
Should return: `{"status":"healthy","timestamp":"...","uptime":...}`

### 2. Menu Page
Visit: https://www.freshsip.qikcart.in/
- Should show 22 juice items
- Categories: Fruit Juices, Shakes, Special

### 3. Place Test Order
1. Add item to cart
2. Fill customer details
3. Use test payment or real payment
4. Note the order number

### 4. Admin Panel
1. Visit: https://www.freshsip.qikcart.in/admin/login
2. Login: 
   - Username: `admin`
   - Password: (your password)
3. Order should appear instantly (no refresh needed)

---

## Step 4: Verify WebSocket Connection

Open browser console (F12) on admin panel and check for:

✅ **Success Messages:**
```
[WebSocket] Connected to server
[WebSocket] Joined admin-room
```

❌ **Error Messages (if you see these):**
```
WebSocket connection failed
CORS policy blocked
```
**Fix:** Double-check ALLOWED_ORIGINS includes your domain

---

## 🎯 Critical Points

1. **ALLOWED_ORIGINS** must include BOTH:
   - `https://www.freshsip.qikcart.in`
   - `https://freshsip.qikcart.in` (without www)

2. **DATABASE_URL** must end with `?sslmode=require`

3. **Menu items** must be added via `node add-full-menu.mjs`

---

## 🆘 Troubleshooting

### Orders not showing in admin panel?

**Check 1: Database connection**
```bash
# In Render Shell
node check-orders.mjs
```
Should list recent orders.

**Check 2: WebSocket logs**
In Render Logs tab, search for:
```
[WebSocket] Client connected
[WebSocket] xxx joined admin-room
```

**Check 3: CORS errors**
Browser console should NOT show:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

### Menu is empty?

**Fix:** Run in Render Shell:
```bash
node add-full-menu.mjs
```

### Admin login fails?

**Fix:** Verify in Render Environment:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=(your bcrypt hash)
```

---

## ✅ Expected Result

After completing all steps:

1. ✅ Menu shows 22 items
2. ✅ Orders can be placed
3. ✅ Orders appear in admin panel instantly
4. ✅ Admin can update order status
5. ✅ Customer sees real-time status updates

---

## 🚀 Quick Command Summary

```bash
# In Render Shell after deploy:
node add-full-menu.mjs        # Add all menu items
node check-orders.mjs         # Verify orders are saved
node debug-admin.mjs          # Check admin configuration
```

---

**Ready to deploy?** 

1. Copy the environment variables above
2. Paste them in Render Dashboard → Environment tab
3. Click Save Changes
4. Wait 2-3 minutes
5. Run `node add-full-menu.mjs` in Render Shell
6. Test your admin panel!

Let me know once you've updated the environment variables and I'll help you verify everything is working! 🎉
