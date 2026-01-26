# ✨ FreshSip - Simple Setup Guide

## 🚀 Quick Render Deployment

### Required Environment Variables on Render:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_9NRYFpIM5Lfi@ep-polished-dream-afvtof4o-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# Admin Login (Simple - No Hash Required!)
ADMIN_USERNAME=sanjeet
ADMIN_PASSWORD=sanjeet@sau405

# CORS & WebSocket
ALLOWED_ORIGINS=https://www.freshsip.qikcart.in,https://freshsip.qikcart.in

# Razorpay Payment
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
VITE_RAZORPAY_KEY_ID=your_razorpay_key

# Server
NODE_ENV=production
```

---

## ✅ That's It!

### What Happens Automatically:

1. ✅ **Database** - Connects to Neon PostgreSQL
2. ✅ **Menu Items** - Auto-populated on startup (22 items)
3. ✅ **Admin Auth** - Simple username/password (no bcrypt complexity)
4. ✅ **WebSocket** - Real-time order updates
5. ✅ **Security** - Rate limiting, CORS, Helmet

### Admin Login:
- **URL:** https://www.freshsip.qikcart.in/admin
- **Username:** sanjeet
- **Password:** sanjeet@sau405

### Customer Site:
- **URL:** https://www.freshsip.qikcart.in/

---

## 🔧 After Updating Render Variables:

1. **Save changes** - Render auto-deploys (2-3 minutes)
2. **Clear browser cache:**
   - Go to admin panel
   - Press `Ctrl + Shift + Delete`
   - Select "All time"
   - Clear cache and cookies
3. **Login** - Use sanjeet / sanjeet@sau405
4. **Done!** - Orders will appear

---

## 📊 Features:

### Customer Side:
- ✅ Browse 22 menu items (Juices, Shakes, Specials)
- ✅ Add to cart with sizes (Small, Medium, Large, Ex-Large)
- ✅ Razorpay payment integration
- ✅ Real-time order tracking
- ✅ Order success page with tracking link

### Admin Panel:
- ✅ Real-time order notifications
- ✅ Order queue (first-come-first-serve)
- ✅ Update order status
- ✅ Analytics dashboard
- ✅ Auto-refresh every 5 seconds
- ✅ WebSocket for instant updates

---

## 🐛 Troubleshooting:

### Orders Not Showing in Admin Panel?

**Check 1: Are environment variables set correctly?**
- Go to Render → Your Service → Environment tab
- Verify `ADMIN_USERNAME=sanjeet` and `ADMIN_PASSWORD=sanjeet@sau405`

**Check 2: Is deployment successful?**
- Go to Render → Your Service → Logs tab
- Look for: `Your service is live 🎉`

**Check 3: Clear browser cache**
```javascript
// In browser console (F12):
localStorage.clear();
location.reload();
```

**Check 4: Verify orders exist in database**
Run locally:
```bash
node check-recent-orders.mjs
```

### 403 Forbidden Error?

**This means credentials don't match.**

1. **On Render:** Verify `ADMIN_USERNAME=sanjeet` and `ADMIN_PASSWORD=sanjeet@sau405`
2. **Wait for redeploy:** Takes 2-3 minutes
3. **Clear cache:** `localStorage.clear(); location.reload();`
4. **Login again:** Use exact credentials

### CORS Errors?

Add to Render environment:
```
ALLOWED_ORIGINS=https://www.freshsip.qikcart.in,https://freshsip.qikcart.in
```

### Database Connection Issues?

Verify `DATABASE_URL` contains:
- `?sslmode=require` at the end
- Correct Neon connection string
- No extra spaces or quotes

---

## 🎯 Production Checklist:

- [x] Database connected (Neon)
- [x] Environment variables set on Render
- [x] Admin credentials configured
- [x] ALLOWED_ORIGINS includes production domain
- [x] Menu auto-seeded on startup
- [x] WebSocket enabled
- [x] Rate limiting configured
- [x] Security headers (Helmet)
- [x] CORS configured
- [x] Payment gateway (Razorpay)

---

## 📞 Need Help?

**Run diagnostics:**
```bash
# Check database orders
node check-recent-orders.mjs

# Check menu items  
node check-menu.mjs
```

**Check Render logs:**
- Go to Render Dashboard → Your Service → Logs
- Look for errors in red

**Browser console:**
- Press F12 on admin panel
- Check for errors
- Look for WebSocket connection logs

---

## 🔐 Security Notes:

**Current Setup:** Simple username/password
**For Production:** Consider these improvements:
1. Use stronger passwords
2. Add session expiry
3. Enable 2FA (future enhancement)
4. Use HTTPS only (already enforced by Render)

**Current Protection:**
- ✅ Rate limiting (500 req/15min)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Admin auth required
- ✅ SSL/TLS encryption (Render)

---

## 🎉 That's Everything!

Your FreshSip app is now:
- ✅ Production-ready
- ✅ Auto-scaling on Render
- ✅ Database on Neon (serverless)
- ✅ Real-time order updates
- ✅ Payment processing ready
- ✅ Secure and optimized

**Just set those 3 critical environment variables on Render and you're live!** 🚀
