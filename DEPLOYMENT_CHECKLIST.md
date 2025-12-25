# FreshSip Deployment Checklist

## Pre-Deployment (Before Going Live)

### Code Preparation
- [ ] All code is committed to GitHub
- [ ] No sensitive data in code (check .env files)
- [ ] All dependencies are in package.json
- [ ] Build completes without errors locally
- [ ] Tests pass locally

### Database Preparation
- [ ] Database schema is finalized
- [ ] All migrations are created
- [ ] Sample data is seeded
- [ ] Indexes are properly configured
- [ ] Backup strategy is planned

### Razorpay Setup
- [ ] Razorpay account is created
- [ ] API keys are obtained
- [ ] Test keys are verified working
- [ ] Live keys are ready (don't add yet)
- [ ] UPI payment method is enabled
- [ ] Webhook configuration is planned

### Railway Setup
- [ ] Railway account is created
- [ ] GitHub is connected to Railway
- [ ] Project is created in Railway
- [ ] MySQL service is added
- [ ] Environment variables template is prepared

---

## Deployment Steps

### Step 1: Initial Railway Setup
- [ ] Create new project in Railway
- [ ] Connect GitHub repository
- [ ] Select main branch
- [ ] Wait for initial build

### Step 2: Add Database Service
- [ ] Add MySQL service to Railway
- [ ] Wait for database to initialize
- [ ] Copy DATABASE_URL from Railway
- [ ] Add DATABASE_URL to environment variables

### Step 3: Configure Environment Variables
- [ ] Add JWT_SECRET
- [ ] Add RAZORPAY_KEY_ID (use test keys first)
- [ ] Add RAZORPAY_KEY_SECRET (use test keys first)
- [ ] Add VITE_RAZORPAY_KEY_ID (use test keys first)
- [ ] Add NODE_ENV=production
- [ ] Add ALLOWED_ORIGINS with Railway domain

### Step 4: Deploy Application
- [ ] Trigger deployment in Railway
- [ ] Monitor build logs
- [ ] Wait for deployment to complete
- [ ] Check deployment status shows "Success"

### Step 5: Verify Deployment
- [ ] Visit public URL
- [ ] Check home page loads
- [ ] Navigate to /menu
- [ ] Verify 8 juices are displayed
- [ ] Check admin button is visible

---

## Post-Deployment Testing

### Customer Flow Testing
- [ ] Home page loads correctly
- [ ] Menu page shows all items
- [ ] Can add items to cart
- [ ] Can view cart
- [ ] Can proceed to checkout
- [ ] Can enter customer details
- [ ] Payment button appears
- [ ] Razorpay payment works
- [ ] Order confirmation shows
- [ ] Order number is displayed

### Admin Flow Testing
- [ ] Admin button is clickable
- [ ] Admin login redirects correctly
- [ ] After login, admin dashboard loads
- [ ] Can see orders in dashboard
- [ ] Can change order status
- [ ] Status change is reflected

### Real-Time Testing
- [ ] Create order as customer
- [ ] Check admin dashboard receives notification
- [ ] Change status in admin panel
- [ ] Verify customer sees update in real-time
- [ ] WebSocket connection is stable

### Database Testing
- [ ] Menu items are loaded from database
- [ ] Orders are saved to database
- [ ] Order items are saved correctly
- [ ] Status history is recorded
- [ ] Queries are fast (check logs)

---

## Performance Verification

### Response Times
- [ ] Home page loads in < 2 seconds
- [ ] Menu page loads in < 1 second
- [ ] Order creation completes in < 1 second
- [ ] Admin dashboard loads in < 2 seconds
- [ ] WebSocket connection established in < 1 second

### Database Performance
- [ ] Menu queries use indexes
- [ ] Order queries are optimized
- [ ] No N+1 query problems
- [ ] Database connections are pooled

### Frontend Performance
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Responsive design works on mobile

---

## Security Verification

### HTTPS/TLS
- [ ] Site is served over HTTPS
- [ ] SSL certificate is valid
- [ ] No mixed content warnings

### API Security
- [ ] Admin endpoints require authentication
- [ ] CORS is properly configured
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internals

### Data Security
- [ ] Passwords are hashed
- [ ] Payment data is not logged
- [ ] Database connections are encrypted
- [ ] Environment variables are secured

---

## Monitoring Setup

### Logging
- [ ] Application logs are visible in Railway
- [ ] Error logs are captured
- [ ] Database logs are available
- [ ] WebSocket logs are recorded

### Alerts
- [ ] High error rate alert is configured
- [ ] Database connection alert is set
- [ ] Deployment failure alert is enabled
- [ ] Performance degradation alert is set

### Backups
- [ ] Database backups are scheduled
- [ ] Backup retention is configured
- [ ] Backup restoration is tested
- [ ] Backup location is secure

---

## Going Live with Real Razorpay Keys

### Before Switching to Live Keys
- [ ] All testing is complete with test keys
- [ ] Payment flow works end-to-end
- [ ] Admin dashboard is functional
- [ ] Real-time updates are working
- [ ] No errors in logs

### Switch to Live Keys
- [ ] Get live Razorpay keys from dashboard
- [ ] Update RAZORPAY_KEY_ID in Railway
- [ ] Update RAZORPAY_KEY_SECRET in Railway
- [ ] Update VITE_RAZORPAY_KEY_ID in Railway
- [ ] Verify keys are correct (don't typo!)
- [ ] Test payment with small amount
- [ ] Verify payment is received in Razorpay

### Post-Live Verification
- [ ] First real payment completes successfully
- [ ] Order is created in database
- [ ] Admin receives notification
- [ ] Customer can track order
- [ ] Payment appears in Razorpay dashboard

---

## Ongoing Maintenance

### Daily Checks
- [ ] Application is running
- [ ] No error spikes in logs
- [ ] Database is responsive
- [ ] WebSocket connections are stable

### Weekly Checks
- [ ] Review error logs
- [ ] Check database performance
- [ ] Verify backups are running
- [ ] Review user feedback

### Monthly Checks
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Analyze usage patterns
- [ ] Plan feature improvements

---

## Rollback Plan

If something goes wrong:

1. **Immediate Rollback**
   - [ ] Go to Railway Deployments
   - [ ] Select previous successful deployment
   - [ ] Click "Redeploy"

2. **Database Rollback** (if needed)
   - [ ] Restore from latest backup
   - [ ] Verify data integrity
   - [ ] Test application

3. **Communication**
   - [ ] Notify users of issue
   - [ ] Provide status updates
   - [ ] Apologize for inconvenience

---

## Success Criteria

✅ Application is live and accessible
✅ All pages load without errors
✅ Menu displays all items correctly
✅ Orders can be created and paid for
✅ Admin dashboard shows orders in real-time
✅ Order status updates are reflected in real-time
✅ Database is optimized and responsive
✅ HTTPS is enabled
✅ No console errors
✅ Performance is acceptable
✅ Monitoring and alerts are set up
✅ Backups are running
✅ Live Razorpay keys are working

---

## Support Resources

- Railway Documentation: https://docs.railway.app
- Razorpay Documentation: https://razorpay.com/docs
- Application Logs: Railway Dashboard → Logs
- Database Logs: Railway Dashboard → Database → Logs
- Deployment Status: Railway Dashboard → Deployments

---

## Notes

- Keep this checklist for future deployments
- Update with any issues encountered
- Share with team members
- Review before each deployment

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Status**: ☐ Pending ☐ In Progress ☐ Complete ☐ Issues

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
