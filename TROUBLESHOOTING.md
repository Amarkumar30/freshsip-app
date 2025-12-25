# FreshSip - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Menu Items Not Displaying

**Problem**: The menu page loads but shows no juice items.

**Causes & Solutions**:

1. **Database not initialized**
   - Check if MySQL service is running in Railway
   - Verify DATABASE_URL is set correctly
   - Check Railway logs for database connection errors
   - Solution: Restart the application, wait 2-3 minutes for database initialization

2. **Seed data not loaded**
   - Check if seed-db.mjs was run
   - Verify database has data: Check Railway database UI
   - Solution: Run seed script manually or check database directly

3. **Query returning empty results**
   - Check if menuItems table exists: `SELECT * FROM menuItems;`
   - Verify table has data
   - Solution: Re-run seed-db.mjs or manually insert data

**Quick Fix**:
```bash
# Run locally
node seed-db.mjs

# Or manually in Railway database console
INSERT INTO menuItems (name, description, basePrice, image, category, isAvailable)
VALUES ('Orange Juice', 'Fresh orange juice', 150, 'https://...', 'Citrus', true);
```

---

### Issue 2: Razorpay Payment Not Working

**Problem**: Payment button appears but clicking it doesn't open Razorpay checkout.

**Causes & Solutions**:

1. **Missing Razorpay keys**
   - Check if RAZORPAY_KEY_ID is set in environment variables
   - Verify VITE_RAZORPAY_KEY_ID is accessible from frontend
   - Solution: Add keys to Railway environment variables

2. **Invalid Razorpay keys**
   - Verify keys are copied correctly (no extra spaces)
   - Check if using test keys (should start with `rzp_test_`)
   - Solution: Double-check keys in Razorpay dashboard

3. **Razorpay script not loading**
   - Check browser console for script loading errors
   - Verify internet connection
   - Solution: Refresh page, check browser console

4. **CORS issues**
   - Check browser console for CORS errors
   - Verify ALLOWED_ORIGINS includes your domain
   - Solution: Add domain to ALLOWED_ORIGINS environment variable

**Quick Fix**:
```javascript
// Check in browser console
console.log(window.Razorpay); // Should not be undefined
console.log(process.env.VITE_RAZORPAY_KEY_ID); // Should show key
```

---

### Issue 3: Admin Login Not Working

**Problem**: Admin button redirects but login doesn't work or shows error.

**Causes & Solutions**:

1. **OAuth not configured**
   - Check if VITE_OAUTH_PORTAL_URL is set
   - Verify OAuth server is accessible
   - Solution: Check environment variables in Railway

2. **User not promoted to admin**
   - Check user role in database: `SELECT * FROM users WHERE email='your@email.com';`
   - Verify role is 'admin' not 'user'
   - Solution: Update user role in database

3. **Session cookie not set**
   - Check browser cookies (DevTools → Application → Cookies)
   - Verify session cookie is present
   - Solution: Clear cookies and try again

4. **CORS blocking OAuth callback**
   - Check browser console for CORS errors
   - Verify callback URL is whitelisted
   - Solution: Add callback URL to CORS whitelist

**Quick Fix**:
```sql
-- Promote user to admin
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

-- Check user role
SELECT id, email, role FROM users WHERE email = 'your@email.com';
```

---

### Issue 4: Real-Time Updates Not Working

**Problem**: Admin changes order status but customer doesn't see update immediately.

**Causes & Solutions**:

1. **WebSocket connection not established**
   - Check browser console for WebSocket errors
   - Verify WebSocket URL is correct
   - Solution: Check ALLOWED_ORIGINS includes your domain

2. **Socket.IO not running on backend**
   - Check server logs for Socket.IO initialization
   - Verify server is running (check Railway logs)
   - Solution: Restart application in Railway

3. **Client not listening to events**
   - Check if useRealtimeOrders hook is used
   - Verify event listeners are registered
   - Solution: Check component code uses proper hooks

4. **Firewall blocking WebSocket**
   - Some networks block WebSocket connections
   - Check if WebSocket works on different network
   - Solution: Use different network or VPN

**Quick Fix**:
```javascript
// Check WebSocket connection in browser console
const socket = io();
socket.on('connect', () => console.log('Connected!'));
socket.on('disconnect', () => console.log('Disconnected!'));
```

---

### Issue 5: Database Connection Error

**Problem**: Application shows "Database not available" error.

**Causes & Solutions**:

1. **DATABASE_URL not set**
   - Check Railway environment variables
   - Verify DATABASE_URL is present
   - Solution: Add DATABASE_URL to environment variables

2. **MySQL service not running**
   - Check Railway services status
   - Verify MySQL service is active
   - Solution: Restart MySQL service in Railway

3. **Database credentials wrong**
   - Verify username and password in DATABASE_URL
   - Check if database exists
   - Solution: Use correct DATABASE_URL from Railway

4. **Connection timeout**
   - Check network connectivity
   - Verify firewall allows connection
   - Solution: Restart application or Railway service

**Quick Fix**:
```bash
# Test database connection locally
mysql -h your-host -u user -p database_name

# Or check in Railway logs
# Look for "Connected to database" message
```

---

### Issue 6: Build Fails on Railway

**Problem**: Deployment fails with build error.

**Causes & Solutions**:

1. **Missing dependencies**
   - Check if all packages are in package.json
   - Verify pnpm-lock.yaml is committed
   - Solution: Run `pnpm install` locally and commit lock file

2. **TypeScript errors**
   - Check for type errors: `pnpm check`
   - Fix any compilation errors
   - Solution: Run type check locally before pushing

3. **Node version incompatible**
   - Verify Node.js version is v18+
   - Check Railway Node.js version
   - Solution: Specify Node version in package.json or railway.json

4. **Build script error**
   - Check build logs in Railway
   - Verify build script in package.json
   - Solution: Run `pnpm build` locally to test

**Quick Fix**:
```bash
# Test build locally
pnpm install
pnpm check
pnpm build

# If successful, push to GitHub
git add .
git commit -m "Fix build"
git push origin main
```

---

### Issue 7: Order Not Saving to Database

**Problem**: Customer completes payment but order doesn't appear in database.

**Causes & Solutions**:

1. **Database connection lost**
   - Check if database is still connected
   - Verify DATABASE_URL is correct
   - Solution: Check Railway database status

2. **Order creation query failed**
   - Check server logs for error messages
   - Verify orders table exists
   - Solution: Check database schema and permissions

3. **Payment verification failed**
   - Verify Razorpay signature
   - Check payment verification logic
   - Solution: Check server logs for verification errors

4. **Transaction rolled back**
   - Check if transaction constraints are met
   - Verify foreign key relationships
   - Solution: Check database constraints

**Quick Fix**:
```sql
-- Check if orders table exists and has data
SELECT COUNT(*) FROM orders;

-- Check latest orders
SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10;

-- Check for errors in order creation
SELECT * FROM orders WHERE status = 'failed';
```

---

### Issue 8: High Memory Usage / Slow Performance

**Problem**: Application is slow or uses too much memory.

**Causes & Solutions**:

1. **Too many WebSocket connections**
   - Check number of connected clients
   - Verify connections are closed properly
   - Solution: Implement connection pooling

2. **Database queries not optimized**
   - Check if indexes are being used
   - Verify no N+1 query problems
   - Solution: Check query performance in database logs

3. **Memory leak in application**
   - Check for event listeners not being removed
   - Verify timers are cleared
   - Solution: Check React component cleanup

4. **Large data transfers**
   - Check response sizes
   - Verify pagination is implemented
   - Solution: Implement pagination for large datasets

**Quick Fix**:
```bash
# Monitor Railway resource usage
# Go to Railway Dashboard → Deployments → Logs

# Check database performance
# Go to Railway Database → Logs

# Restart application to clear memory
# Go to Railway Dashboard → Deployments → Restart
```

---

### Issue 9: CORS Errors

**Problem**: Browser console shows CORS error when calling API.

**Causes & Solutions**:

1. **ALLOWED_ORIGINS not set**
   - Check environment variable ALLOWED_ORIGINS
   - Verify it includes your domain
   - Solution: Add domain to ALLOWED_ORIGINS

2. **Wrong domain format**
   - Verify domain includes protocol (https://)
   - Check for trailing slashes
   - Solution: Use correct format: `https://domain.railway.app`

3. **Credentials not included**
   - Check if credentials are sent with requests
   - Verify tRPC client includes credentials
   - Solution: Ensure credentials: 'include' in fetch options

**Quick Fix**:
```bash
# Add to Railway environment variables
ALLOWED_ORIGINS=https://your-domain.railway.app,https://localhost:3000

# Restart application
# Go to Railway Dashboard → Deployments → Restart
```

---

### Issue 10: SSL Certificate Error

**Problem**: Browser shows "Not Secure" or SSL certificate error.

**Causes & Solutions**:

1. **Railway SSL not configured**
   - Check Railway domain settings
   - Verify SSL is enabled
   - Solution: Railway enables SSL automatically, just wait

2. **Custom domain SSL not configured**
   - If using custom domain, configure SSL
   - Add domain to Railway
   - Solution: Railway handles SSL automatically for custom domains

3. **Mixed content (HTTP + HTTPS)**
   - Check if loading resources over HTTP
   - Verify all resources use HTTPS
   - Solution: Update resource URLs to HTTPS

**Quick Fix**:
```bash
# Check SSL status
# Visit your domain in browser
# Should show green lock icon

# If not, wait 5-10 minutes for SSL to be issued
# Or check Railway domain settings
```

---

## General Troubleshooting Steps

### Step 1: Check Logs
```bash
# Railway Application Logs
# Go to Railway Dashboard → Logs

# Browser Console Logs
# Press F12 → Console tab

# Database Logs
# Go to Railway Database → Logs
```

### Step 2: Verify Environment Variables
```bash
# Check all required variables are set
# Go to Railway Dashboard → Variables

# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - RAZORPAY_KEY_ID
# - RAZORPAY_KEY_SECRET
# - VITE_RAZORPAY_KEY_ID
```

### Step 3: Restart Services
```bash
# Restart application
# Go to Railway Dashboard → Deployments → Restart

# Restart database
# Go to Railway Database → Restart
```

### Step 4: Check Database
```bash
# Connect to database
# Go to Railway Database → Connect

# Run basic queries
SELECT * FROM menuItems LIMIT 5;
SELECT * FROM orders LIMIT 5;
SELECT * FROM users LIMIT 5;
```

### Step 5: Clear Cache
```bash
# Browser cache
# Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

# Application cache
# Go to Railway → Deployments → Clear Cache
```

---

## Performance Optimization

### Database Optimization
- Verify all indexes are created
- Check query performance in logs
- Implement pagination for large datasets
- Use connection pooling

### Frontend Optimization
- Enable code splitting
- Lazy load images
- Minimize bundle size
- Use React.memo for expensive components

### Backend Optimization
- Cache frequently accessed data
- Implement rate limiting
- Use compression for responses
- Optimize database queries

---

## Emergency Procedures

### If Application is Down

1. **Check Railway Status**
   - Go to Railway Dashboard
   - Check if services are running
   - Look for error messages

2. **Check Recent Deployments**
   - Go to Deployments tab
   - Look for failed deployments
   - Check deployment logs

3. **Rollback to Previous Version**
   - Find last successful deployment
   - Click "Redeploy"
   - Wait for deployment to complete

4. **Restart Services**
   - Restart application
   - Restart database
   - Wait 2-3 minutes

5. **Contact Support**
   - If still not working, check Railway status page
   - Contact Railway support if infrastructure issue

---

## Getting Help

### Resources
- Railway Docs: https://docs.railway.app
- Razorpay Docs: https://razorpay.com/docs
- Node.js Docs: https://nodejs.org/docs
- MySQL Docs: https://dev.mysql.com/doc

### Debug Information to Collect
- Error message (exact text)
- Browser console errors
- Server logs (last 50 lines)
- Steps to reproduce
- When it last worked

---

## Prevention Tips

1. **Monitor regularly** - Check logs daily
2. **Test before deploying** - Test locally first
3. **Keep backups** - Backup database regularly
4. **Update dependencies** - Keep packages updated
5. **Document changes** - Keep track of modifications
6. **Set up alerts** - Get notified of errors
7. **Test payment flow** - Verify payments work
8. **Test admin functions** - Verify admin panel works

---

**Last Updated**: December 25, 2025
**Version**: 1.0.0
