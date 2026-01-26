# 🔧 FreshSip Improvements Checklist

## Critical (Security & Functionality)

- [ ] **Fix WebSocket order tracking regex** 
  - File: `server/websocket.ts` line 43
  - Change: `/^FS-\d+$/` → `/^ORD-\d+-\d+$/`
  - Why: Customers can't track orders with current regex

- [ ] **Require Razorpay webhook secret in production**
  - File: `server/razorpayWebhook.ts` line 109
  - Add: Exit or throw error if `RAZORPAY_WEBHOOK_SECRET` is missing in production
  - Why: Prevents fake payment confirmations

- [ ] **Replace admin token with JWT or sessions**
  - File: `server/routers.ts` line 424
  - Current: Sends password in Base64 on every request
  - Better: Use JWT with expiry (jsonwebtoken package) or session cookies

## Medium (Performance & Reliability)

- [ ] **Validate database connection on startup**
  - File: `server/_core/index.ts`
  - Add health check before `server.listen()`
  - Exit with error message if DB unavailable

- [ ] **Add required environment variables check**
  - Create: `server/_core/validateEnv.ts`
  - Check: `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `RAZORPAY_KEY_ID` on startup
  - Exit early with clear error messages if missing

- [ ] **Replace in-memory rate limiter with Redis**
  - File: `server/routers.ts` line 24
  - Use: `rate-limit-redis` package
  - Why: Prevents memory leaks and works across multiple instances

- [ ] **Add database connection pool monitoring**
  - File: `server/db.ts`
  - Log pool stats (active/idle connections) every 5 minutes
  - Alert if pool is exhausted

## Low (Nice to Have)

- [ ] **Add request ID for tracing**
  - Add middleware to generate unique request ID
  - Include in all logs for easier debugging

- [ ] **Add structured logging**
  - Use `pino` or `winston` instead of `console.log`
  - Format: JSON for production, pretty for dev

- [ ] **Add health check for database**
  - Enhance `/health` endpoint to ping database
  - Return 503 if DB is down

- [ ] **Add API response caching**
  - Cache menu items, sizes, add-ons (rarely change)
  - Use in-memory cache with TTL

- [ ] **Add Razorpay payment retry logic**
  - If payment creation fails, retry 2-3 times
  - Improves success rate during network issues

## Environment Variables to Add

```env
# Add to .env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here  # REQUIRED for production
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here         # Generate with: node generate-admin-hash.mjs
ADMIN_USERNAME=admin                               # Set admin username

# Optional (for rate limiting with Redis)
REDIS_URL=redis://localhost:6379

# Optional (for monitoring)
LOG_LEVEL=info  # debug, info, warn, error
```

## Quick Wins (Can implement in 5 minutes)

1. **Fix WebSocket regex** - One line change
2. **Add startup env validation** - 10 lines of code
3. **Make webhook secret required** - 3 lines of code

---

## How to Generate Admin Password Hash

```bash
# Run this to generate a secure admin password hash
node generate-admin-hash.mjs
```

Then add to `.env`:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<paste_hash_here>
```

---

## Testing Checklist After Fixes

- [ ] Customer order tracking works via WebSocket
- [ ] Razorpay webhooks reject unsigned requests
- [ ] Admin login doesn't expose password in network requests
- [ ] Server exits gracefully if DATABASE_URL is missing
- [ ] Rate limiting doesn't consume excessive memory

---

**Priority**: Start with "Critical" items, then "Quick Wins", then "Medium".
