# 🚀 Render Deployment Guide - FreshSip

Deploy FreshSip for **FREE** on Render with PostgreSQL database.

## 📋 What You Get (Free)

| Feature | Render Free Tier |
|---------|-----------------|
| Web Service | ✅ 750 hours/month |
| PostgreSQL | ✅ 90 days free |
| Custom Domain | ✅ FREE |
| SSL Certificate | ✅ FREE (auto) |
| Auto-Deploy from Git | ✅ Yes |

---

## 🔄 Step 1: Push Code to GitHub

Make sure your code is pushed to GitHub:

```bash
git add -A
git commit -m "Convert to PostgreSQL for Render"
git push origin main
```

---

## 🗄️ Step 2: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `freshsip-db`
   - **Region**: `Singapore` (closest to India)
   - **Plan**: `Free`
4. Click **Create Database**
5. ⚠️ **Copy the "External Database URL"** - you'll need this!

---

## 🌐 Step 3: Create Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `freshsip` (or your preferred name)
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`
   - **Plan**: `Free`

---

## 🔐 Step 4: Add Environment Variables

In the web service settings, add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (paste the External Database URL from Step 2) |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Your Razorpay Webhook Secret |
| `VITE_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID |
| `OWNER_OPEN_ID` | Your Google ID (for admin access) |

### 💡 How to get your Google Open ID:
1. Deploy the app first
2. Login with Google
3. Check the server logs - it will show your `openId`
4. Add that value to `OWNER_OPEN_ID`
5. Re-deploy

---

## 🔧 Step 5: Configure Health Check

In **Settings** → **Health Check Path**:
- Set to `/health`

This helps Render know your app is running.

---

## ⏰ Step 6: Prevent Cold Starts (Important!)

Render free tier spins down after 15 minutes of inactivity. Use a free cron service to ping your app:

### Option A: cron-job.org (Recommended)
1. Go to [cron-job.org](https://cron-job.org/)
2. Create free account
3. Create new cron job:
   - **URL**: `https://your-app.onrender.com/health`
   - **Schedule**: Every 14 minutes
   - **Request Method**: GET

### Option B: UptimeRobot
1. Go to [uptimerobot.com](https://uptimerobot.com/)
2. Create free account
3. Add monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://your-app.onrender.com/health`
   - **Interval**: 5 minutes

---

## 🌍 Step 7: Add Custom Domain (Free!)

1. Go to your web service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter your domain: `freshsip.yourdomain.com`
4. Add the DNS records shown to your domain registrar
5. Wait for SSL certificate (automatic, ~5 minutes)

### DNS Records Example:
```
Type: CNAME
Name: freshsip (or @ for root)
Value: your-app.onrender.com
```

---

## 💳 Step 8: Update Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Settings → Webhooks
3. Update webhook URL to: `https://your-domain.com/api/razorpay-webhook`
4. Keep the same secret

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Web service created and connected to repo
- [ ] All environment variables added
- [ ] Health check configured
- [ ] Cron job set up (cron-job.org or UptimeRobot)
- [ ] Custom domain added (optional)
- [ ] Razorpay webhook URL updated
- [ ] Admin login tested

---

## 🔄 Before PostgreSQL Expires (Day 80)

Render's free PostgreSQL expires after 90 days. Migrate to Supabase before then:

### Migration Steps:
1. Create free Supabase project at [supabase.com](https://supabase.com/)
2. Get the PostgreSQL connection string
3. Export data from Render PostgreSQL (if needed)
4. Update `DATABASE_URL` in Render to Supabase URL
5. Re-deploy

Supabase free tier: **500MB forever** - no expiry!

---

## 🐛 Troubleshooting

### App won't start?
- Check the **Logs** tab in Render dashboard
- Make sure all environment variables are set
- Verify DATABASE_URL is correct

### Database connection failed?
- Use **External Database URL** (not Internal)
- Check if database is still active (free tier expires in 90 days)

### Cold start taking too long?
- First request after sleep takes 30-60 seconds
- Use cron job to prevent sleep
- This is normal for free tier

### Admin panel not accessible?
- Add your Google Open ID to `OWNER_OPEN_ID`
- Re-deploy after adding

---

## 🎉 You're Done!

Your FreshSip app is now running for FREE on Render!

**Your URLs:**
- App: `https://your-app.onrender.com`
- Custom Domain: `https://freshsip.yourdomain.com`

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
