# 🔐 Security Setup Guide

## Step 1: Generate Admin Password Hash

Run this command to generate a secure password hash:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-secure-password', 10).then(console.log)"
```

Example:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('MySecurePassword123!', 10).then(console.log)"
# Output: $2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ
```

## Step 2: Update Environment Variables

### For Render:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your app → **Environment** tab
3. Add/Update these variables:

```env
# Required - Admin Credentials
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD_HASH=$2b$10$...your-generated-hash...

# Optional - CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Already configured
DATABASE_URL=postgresql://...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
JWT_SECRET=...
```

### For Local Development:

Create/update `.env` file:

```env
# Database
DATABASE_URL=postgresql://freshsip_user:freshsip_password@localhost:5432/freshsip

# Admin (use bcrypt hash for production)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...your-generated-hash...

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS (optional, defaults to localhost in dev)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
NODE_ENV=development
```

## Step 3: Test Security Setup

### Test 1: Health Check (Should Work)
```bash
curl https://your-app.com/health
# Expected: {"status":"healthy","timestamp":"...","uptime":123}
```

### Test 2: CORS Check
```bash
curl -H "Origin: https://evil.com" -I https://your-app.com/api/trpc/menu.list
# Expected: Error or CORS headers blocking
```

### Test 3: Rate Limiting
```bash
for i in {1..150}; do curl https://your-app.com/health; done
# Expected: After 100 requests, should get rate limit error
```

### Test 4: Admin Login (Should Work with Correct Credentials)
```bash
# Generate admin token
node -e "console.log(Buffer.from(JSON.stringify({username:'admin',password:'your-password'})).toString('base64'))"

# Use token in request
curl -H "x-admin-token: YOUR_BASE64_TOKEN" https://your-app.com/api/trpc/admin.getOrders
```

## Step 4: Verify Security Headers

```bash
curl -I https://your-app.com
```

You should see these headers:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'; ...
```

## Step 5: Monitor Logs

Watch for security events in Render logs:
- `[Security] Helmet, CORS, and rate limiting configured` ✅
- `[CORS] Blocked origin: https://...` ⚠️
- `[WebSocket] Unauthorized admin join attempt` ⚠️
- `[Security] ADMIN_USERNAME and ADMIN_PASSWORD_HASH not set` ❌

## Common Issues

### Issue: "Admin credentials not configured"
**Fix**: Set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` in environment variables

### Issue: CORS errors in browser
**Fix**: Add your domain to `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Issue: Rate limit too strict
**Fix**: Adjust in `server/_core/security.ts`:
```typescript
max: 200, // Increase from 100
```

### Issue: WebSocket not connecting
**Fix**: Ensure `ALLOWED_ORIGINS` includes your frontend domain

## Security Checklist

Before going to production:

- [ ] `ADMIN_PASSWORD_HASH` is set (not plaintext)
- [ ] `ADMIN_USERNAME` changed from defaults
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `RAZORPAY_WEBHOOK_SECRET` is set
- [ ] `ALLOWED_ORIGINS` configured for production domains
- [ ] HTTPS enabled (automatic on Render)
- [ ] Test all security features above
- [ ] Review Render logs for security warnings
- [ ] Database backups enabled

## Next Steps

1. ✅ Deploy changes to Render
2. ✅ Set environment variables
3. ✅ Test endpoints
4. ✅ Monitor logs for 24 hours
5. ✅ Update client app with new CORS settings if needed

## Need to Rotate Credentials?

To change admin password:
1. Generate new hash: `node -e "const bcrypt = require('bcrypt'); bcrypt.hash('new-password', 10).then(console.log)"`
2. Update `ADMIN_PASSWORD_HASH` in Render
3. Save (will auto-redeploy)
4. Update admin login credentials in client app

## Emergency: Disable Security Temporarily

If something breaks, you can temporarily disable strict CORS:

```env
ALLOWED_ORIGINS=*
```

**Warning**: Only use this for debugging, never in production!
