# Admin Panel Troubleshooting Guide

## Issue: Admin Panel Shows No Orders

### Checklist:

#### 1. ✅ Check Environment Variable on Render
Go to: Render Dashboard → Your Service → Environment

**Required Variable:**
```
ALLOWED_ORIGINS=https://www.freshsip.qikcart.in,https://freshsip.qikcart.in
```

**Also verify these exist:**
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<your-bcrypt-hash>
DATABASE_URL=postgresql://neondb_owner:...
```

#### 2. ✅ Check Browser Console (F12)
Open: https://www.freshsip.qikcart.in/admin

**Look for errors:**
- ❌ `401 Unauthorized` → Admin credentials issue
- ❌ `403 Forbidden` → Password hash mismatch
- ❌ `CORS error` → ALLOWED_ORIGINS not set
- ❌ `Failed to fetch` → Network/server issue

#### 3. ✅ Check Network Tab
1. Open DevTools (F12) → Network tab
2. Refresh admin panel
3. Look for: `admin.getAllOrders`

**What to check:**
- Status Code: Should be `200 OK`
- Response: Should have `result.data` array
- Headers: Should have `x-admin-token`

**If 401/403 Error:**
```javascript
// Check localStorage in console:
JSON.parse(localStorage.getItem('adminAuth'))
// Should show: { isAuthenticated: true, username: "admin" }
```

#### 4. ✅ Verify Orders Exist in Database
Run this locally:
```bash
node check-recent-orders.mjs
```

Should show your recent orders. If not, orders aren't being saved.

#### 5. ✅ Test Admin Login Again
1. Go to: https://www.freshsip.qikcart.in/admin/login
2. Clear localStorage first:
   ```javascript
   localStorage.clear()
   ```
3. Login with:
   - Username: `admin`
   - Password: `sanjeet@sau405`

#### 6. ✅ Check Render Logs
1. Go to: Render Dashboard → Your Service → Logs tab
2. Look for errors when accessing admin panel:
   ```
   ❌ Error fetching orders:
   ❌ Admin authentication required
   ❌ Invalid admin credentials
   ```

---

## Common Issues & Solutions:

### Issue: "401 Unauthorized"
**Cause:** Admin token not being sent or invalid

**Solution:**
1. Clear browser cache and localStorage
2. Login again to admin panel
3. Check that password in frontend matches: `sanjeet@sau405`

### Issue: "403 Forbidden" 
**Cause:** Password hash doesn't match

**Solution:**
1. On Render, verify `ADMIN_PASSWORD_HASH` environment variable
2. It should be bcrypt hash of `sanjeet@sau405`
3. Generate new hash if needed:
   ```bash
   node generate-admin-hash.mjs
   ```

### Issue: Empty Response `[]`
**Cause:** Orders exist but query returns empty

**Possible causes:**
1. Database connection issue
2. Query filtering all orders out
3. Payment status filtering (only shows "completed" payments)

**Check:** Are your orders paid or test orders? Admin panel might be filtering unpaid orders.

### Issue: CORS Error
**Cause:** ALLOWED_ORIGINS not set on Render

**Solution:**
Add to Render environment:
```
ALLOWED_ORIGINS=https://www.freshsip.qikcart.in,https://freshsip.qikcart.in
```

---

## Debug Steps for Production:

### Step 1: Open Browser Console on Admin Panel
```javascript
// Check authentication
const auth = localStorage.getItem('adminAuth');
console.log('Auth:', JSON.parse(auth));

// Check if tRPC is accessible
console.log('tRPC client:', window.trpc);
```

### Step 2: Manually Test API Call
```javascript
// Get admin token
const auth = JSON.parse(localStorage.getItem('adminAuth'));
const token = btoa(JSON.stringify({
  username: auth.username,
  password: 'sanjeet@sau405'
}));

// Test API call
fetch('https://www.freshsip.qikcart.in/api/trpc/admin.getAllOrders', {
  headers: {
    'x-admin-token': token
  }
})
.then(r => r.json())
.then(data => console.log('Orders:', data))
.catch(err => console.error('Error:', err));
```

### Step 3: Check WebSocket Connection
```javascript
// In browser console on admin panel
// Should see:
// ✅ [WebSocket] Connected to server
// ✅ [WebSocket] Joined admin-room
```

---

## If Nothing Works:

### Nuclear Option - Rebuild Everything:

1. **Clear Render Build Cache:**
   - Render Dashboard → Service → Settings
   - Click "Clear Build Cache & Deploy"

2. **Rebuild Database (if needed):**
   ```bash
   # Locally, backup first
   node check-recent-orders.mjs > orders-backup.txt
   
   # Then re-run migrations
   pnpm run db:push
   ```

3. **Force Redeploy on Render:**
   - Make any small change (add comment in README.md)
   - Git push
   - Render will redeploy

---

## Expected Working State:

### Admin Panel Should Show:
✅ List of all orders (oldest first)
✅ Real-time updates when new orders come in
✅ Order details when clicking on an order
✅ Ability to update order status
✅ WebSocket connected indicator

### If You See This:
- Empty page with "No orders" → Orders not in DB or query issue
- 401 error → Login again  
- CORS error → Add ALLOWED_ORIGINS
- Can't login → Check ADMIN_PASSWORD_HASH

---

## Contact Info for Debugging:

If issue persists, share:
1. Screenshot of browser console (F12)
2. Screenshot of Network tab showing admin.getAllOrders request
3. Render logs from the time you accessed admin panel
4. Output of: `node check-recent-orders.mjs`

This will help diagnose the exact issue!
