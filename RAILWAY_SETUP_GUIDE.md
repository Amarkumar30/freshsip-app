# FreshSip Juice Bar - Complete Railway Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step-by-Step Deployment](#step-by-step-deployment)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Database Configuration](#database-configuration)
5. [Razorpay Integration](#razorpay-integration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, ensure you have:
- A Railway account (https://railway.app)
- A GitHub account with the project repository
- Razorpay account for payment processing (https://razorpay.com)
- Basic understanding of Git and command line

---

## Step-by-Step Deployment

### Step 1: Create a New Railway Project

1. Go to https://railway.app and log in
2. Click **"Create a new project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account if not already connected
5. Select the `freshsip-app` repository
6. Click **"Deploy"**

### Step 2: Add MySQL Database Service

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. A MySQL service will be created automatically
4. The `DATABASE_URL` will be automatically added to your environment variables

### Step 3: Configure Environment Variables

1. Go to your project settings
2. Click on **"Variables"** tab
3. Add all required environment variables (see [Environment Variables Setup](#environment-variables-setup) section below)

### Step 4: Deploy the Application

1. The application will automatically start building after you add the MySQL service
2. Monitor the build logs in the **"Deployments"** tab
3. Once deployment is complete, you'll get a public URL

---

## Environment Variables Setup

Add these environment variables in Railway's Variables section:

### Required Variables (Auto-generated)
```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key-here
VITE_APP_ID=manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

### Razorpay Configuration (Get from https://dashboard.razorpay.com)
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Optional Variables
```
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-domain.railway.app
```

### How to Get Razorpay Keys:
1. Log in to https://dashboard.razorpay.com
2. Go to **Settings** → **API Keys**
3. Copy your **Key ID** and **Key Secret**
4. Add them to Railway environment variables

---

## Database Configuration

### Automatic Database Setup

The database will be automatically set up when:
1. MySQL service is added to Railway
2. The application starts and runs migrations

### Manual Database Setup (if needed)

If migrations don't run automatically:

1. Connect to your Railway MySQL instance using a MySQL client
2. Run the migration files from `drizzle/migrations/` directory
3. Or run the seed script to populate initial data

### Seed Initial Data

To populate the database with juice items, sizes, and add-ons:

```bash
# Run locally first to test
node seed-db.mjs

# Or in Railway, add this to your build script in package.json
```

---

## Razorpay Integration

### Setting Up Razorpay

1. **Create a Razorpay Account**: https://razorpay.com
2. **Get API Keys**:
   - Log in to Razorpay Dashboard
   - Go to Settings → API Keys
   - Copy Key ID and Key Secret
3. **Add to Railway**: Add these keys to your environment variables
4. **Enable UPI**: In Razorpay dashboard, enable UPI payment method

### Testing Razorpay Integration

Use these test credentials:
- **Test Key ID**: `rzp_test_1DP5MMOk94ghjj`
- **Test Key Secret**: `9ef4dffbfd84f1318f6739a3ce19f9d8`

Replace with your live keys when going to production.

---

## Post-Deployment Verification

### 1. Verify Application is Running

```bash
# Check the public URL provided by Railway
# Should show the FreshSip home page
```

### 2. Test Menu Loading

1. Navigate to `/menu`
2. Should display 8 juice items with images and prices

### 3. Test Order Creation

1. Add items to cart
2. Go to checkout
3. Enter customer details
4. Should create an order successfully

### 4. Test Admin Panel

1. Click "Admin" button in top right
2. Should redirect to admin login
3. After login, should show admin dashboard with orders

### 5. Test Real-Time Updates

1. Create an order as customer
2. In admin panel, change order status
3. Customer's order tracking page should update in real-time

---

## Troubleshooting

### Issue: Database Connection Error

**Solution:**
1. Verify `DATABASE_URL` is correctly set in Railway variables
2. Check MySQL service is running in Railway
3. Ensure database user has correct permissions
4. Try restarting the application

### Issue: Razorpay Payment Fails

**Solution:**
1. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
2. Check if you're using test or live keys
3. Ensure UPI payment method is enabled in Razorpay
4. Check browser console for error messages

### Issue: WebSocket Connection Fails

**Solution:**
1. Ensure your Railway domain supports WebSocket connections
2. Check CORS settings in `server/websocket.ts`
3. Verify `ALLOWED_ORIGINS` environment variable includes your domain
4. Check browser console for connection errors

### Issue: Build Fails on Railway

**Solution:**
1. Check build logs in Railway Deployments tab
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is compatible (v18+)
4. Try clearing Railway build cache and redeploying

### Issue: Admin Login Not Working

**Solution:**
1. Verify OAuth configuration is correct
2. Check `VITE_OAUTH_PORTAL_URL` is set correctly
3. Ensure user is promoted to admin role in database
4. Check browser console for OAuth errors

---

## Production Checklist

Before going live, ensure:

- [ ] Database backups are configured
- [ ] Razorpay is set to LIVE mode (not test)
- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled (Railway does this automatically)
- [ ] Admin user is created and promoted to admin role
- [ ] Email notifications are configured (optional)
- [ ] Order analytics are working
- [ ] Real-time updates are functioning
- [ ] Payment verification is working
- [ ] Customer support contact info is added

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Razorpay Docs**: https://razorpay.com/docs
- **Node.js Docs**: https://nodejs.org/docs
- **MySQL Docs**: https://dev.mysql.com/doc

---

## Quick Command Reference

### Local Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run database migrations
pnpm db:push

# Seed database
node seed-db.mjs

# Run tests
pnpm test

# Build for production
pnpm build
```

### Production Build
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

---

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (optional)
   - Go to Railway project settings
   - Add your custom domain
   - Update DNS records

2. **Set Up Monitoring**
   - Enable Railway's built-in monitoring
   - Set up alerts for errors

3. **Add More Features**
   - Email notifications
   - SMS alerts
   - Analytics dashboard
   - Delivery tracking

4. **Scale Your Application**
   - Monitor performance metrics
   - Upgrade Railway plan if needed
   - Add caching layer if necessary

---

## Support

For issues or questions:
1. Check Railway documentation
2. Review application logs in Railway dashboard
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

Good luck with your FreshSip deployment! 🎉
