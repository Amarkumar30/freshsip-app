# Cron Job Debugging Guide (cron-job.org)

## Current Status
Your app has a `/health` endpoint at: `https://your-app.onrender.com/health` which returns `ok`.

---

## Common Issues & Solutions

### ❌ Issue 1: Cron Job Failing in Dashboard
**Symptoms**: Shows "failed" or "error" status in cron-job.org dashboard

**Debug Steps**:
1. **Check the exact error message** in cron-job.org:
   - Go to [cron-job.org](https://cron-job.org/)
   - Click on your job
   - Look at the **Execution History** tab
   - Click on a failed execution to see the **exact error**

2. **Common error messages & fixes**:

   | Error | Cause | Fix |
   |-------|-------|-----|
   | `HTTP 403` | Request blocked by CORS/firewall | Add User-Agent header (see below) |
   | `HTTP 404` | Wrong URL or endpoint doesn't exist | Verify `/health` endpoint exists |
   | `HTTP 500` | Server error | Check app logs on Render |
   | `Connection timeout` | App is sleeping/unreachable | Check if Render app is running |
   | `SSL certificate error` | HTTPS not configured | Check domain SSL settings |
   | `Cannot resolve host` | Domain doesn't exist | Verify domain is correct |

---

### ❌ Issue 2: Cron Job URL Configuration

**Current Setup**:
```
URL: https://your-app.onrender.com/health
Method: GET
Schedule: Every 14 minutes
```

**Required Headers** (if blocking):
- Add this header in cron-job.org settings:
  ```
  User-Agent: curl/7.68.0
  ```

**Correct URL formats**:
- ✅ `https://your-app.onrender.com/health` (with HTTPS)
- ❌ `http://your-app.onrender.com/health` (HTTP will fail)
- ❌ `your-app.onrender.com/health` (missing protocol)

---

### ❌ Issue 3: Health Endpoint Not Responding

**Check if endpoint works**:
```bash
# From terminal
curl -v https://your-app.onrender.com/health

# Should return:
# HTTP/1.1 200 OK
# ok
```

**If 404 or error**, check [server/_core/index.ts](server/_core/index.ts#L38-L40):
- Endpoint is properly configured
- Server is running
- No middleware blocking `/health`

---

### ❌ Issue 4: Cron Job Logs Not Showing

**Check Render App Logs**:
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click your app
3. Go to **Logs** tab
4. Search for "health" or filter by timestamp
5. Look for patterns:
   ```
   GET /health 200 - 2ms     ✅ Cron working
   GET /health 503           ❌ App issues
   [no logs]                 ❌ Endpoint not hit
   ```

---

### ❌ Issue 5: Schedule Not Executing

**Problems**:
- [ ] Cron job is **disabled** (toggle on)
- [ ] Wrong timezone settings
- [ ] Too frequent schedule (might be throttled)
- [ ] Account not verified in cron-job.org

**Fix**:
1. Verify job is **enabled** (green toggle)
2. Check timezone matches your deployment region
3. Set schedule to **Every 10-14 minutes** (safest range)
4. Verify email in cron-job.org account

---

## ✅ Step-by-Step Fix Checklist

1. **Verify cron-job.org account is active**
   - [ ] Email confirmed
   - [ ] Job is enabled (toggle ON)
   - [ ] Job has execution history

2. **Test URL directly**
   ```bash
   curl -I https://your-app.onrender.com/health
   # Should show: HTTP/1.1 200
   ```

3. **Check exact error in cron-job.org**
   - [ ] Look at "Execution History"
   - [ ] Click failed job to see error details

4. **Fix based on error type**:
   - **HTTP 403**: Add headers or check firewall
   - **HTTP 404**: Verify app domain is correct
   - **HTTP 500**: Check Render app logs
   - **Timeout**: Ensure Render app is running

5. **Monitor for 5-10 minutes**
   - [ ] At least 1 successful execution in history
   - [ ] Check Render logs for incoming requests

---

## 🔧 Alternative Fix: Update Health Endpoint (Optional)

If cron-job.org still fails, enhance the health endpoint:

**File**: [server/_core/index.ts](server/_core/index.ts#L38-L40)

```typescript
// Current (may be too simple)
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Enhanced version (handles more scenarios)
app.get("/health", (_req, res) => {
  try {
    // Add database check if needed
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});
```

---

## 🛠️ Debug Commands

Run these to verify your setup:

```bash
# 1. Test locally
curl -I http://localhost:3000/health

# 2. Check Render domain
curl -I https://your-app.onrender.com/health

# 3. Simulate cron job request with User-Agent
curl -I -H "User-Agent: curl/7.68.0" https://your-app.onrender.com/health

# 4. Check if app is running
ps aux | grep node

# 5. View recent logs
tail -f logs/*.log
```

---

## 📊 What Should Happen

**Correct flow**:
1. Cron-job.org sends GET request every 14 minutes
2. Request hits `/health` endpoint
3. Server returns `200 ok`
4. Render app stays "warm" (doesn't sleep)
5. App responds faster to user requests

**Signs it's working**:
- ✅ Cron job shows "Success" in execution history
- ✅ Render logs show periodic GET requests to `/health`
- ✅ No 503 errors on user requests
- ✅ App responds immediately (not warming up)

---

## 🆘 Still Failing?

**Try these additional steps**:

1. **Add logging to health endpoint**:
   ```typescript
   app.get("/health", (_req, res) => {
     console.log(`[HEALTH CHECK] ${new Date().toISOString()}`);
     res.status(200).send("ok");
   });
   ```

2. **Switch to different cron service**:
   - UptimeRobot (better UI for debugging)
   - easycron.com
   - health-check service

3. **Check Render settings**:
   - Ensure app is NOT set to Auto-Suspend
   - Check if there are build issues

4. **Review cron-job.org logs for patterns**:
   - Does it fail at specific times?
   - Only on certain days?
   - Always same error?

---

## 📝 Notes
- The `/health` endpoint is lightweight (no database queries)
- Placed BEFORE body parser to avoid conflicts
- Should handle aborted requests gracefully
- Timezone in cron-job.org should match deployment region

**Next Steps**: Share the exact error message from cron-job.org execution history for specific debugging.
