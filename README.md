# FreshSip Juice Bar - Web Application

A modern, full-stack web application for managing a juice bar business. Customers can browse the menu, customize their orders, and pay via Razorpay UPI integration. Shop owners can manage orders through an admin dashboard with real-time status updates.

## Features

### Customer Features
- 🍊 **Interactive Menu**: Browse juices with high-quality fruit images
- 🎯 **Customization**: Choose size (Small/Medium/Large) and add-ons (Ice Cream, etc.)
- 💰 **Dynamic Pricing**: Automatic price calculation based on selections
- 💳 **Razorpay Payment**: Seamless UPI payment integration
- 📱 **Order Tracking**: Real-time order status updates
- ✅ **Order Confirmation**: Order number and payment confirmation

### Admin Features
- 🔐 **Gmail OAuth Login**: Secure admin authentication
- 📊 **Order Dashboard**: View all orders with real-time updates
- 🔄 **Status Management**: Update order status (Pending → Confirmed → Ready → Completed)
- 👁️ **Real-time Sync**: Status changes reflect immediately on customer screens
- 📈 **Order Analytics**: Dashboard with order statistics

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL with Drizzle ORM
- **Payment**: Razorpay API
- **Authentication**: Manus OAuth (for admin), Gmail OAuth
- **Deployment**: Docker, Railway

## Project Structure

```
freshsip-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities (tRPC client)
│   │   └── App.tsx        # Main router
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Framework plumbing
├── drizzle/               # Database schema & migrations
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Local development setup
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+
- MySQL 8.0+

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freshsip-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MySQL (using Docker)**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   pnpm db:push
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/freshsip

# JWT Secret
JWT_SECRET=your-secret-key-here

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=rzp_test_your_key_secret
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=freshsip-juice-bar

# Application
NODE_ENV=development
PORT=3000
```

### Database Setup

1. **Create initial tables**
   ```bash
   pnpm db:push
   ```

2. **Add menu items** (optional)
   - Use the admin dashboard to add juices and add-ons

## API Routes

### Customer Routes
- `GET /api/trpc/menu.getItems` - Get all menu items
- `GET /api/trpc/menu.getSizes` - Get available sizes
- `GET /api/trpc/menu.getAddOns` - Get available add-ons
- `POST /api/trpc/orders.create` - Create new order
- `GET /api/trpc/orders.getByNumber` - Get order by number
- `POST /api/trpc/payment.createRazorpayOrder` - Create payment order
- `POST /api/trpc/payment.verifyPayment` - Verify payment

### Admin Routes (Protected)
- `GET /api/trpc/admin.getAllOrders` - Get all orders
- `GET /api/trpc/admin.getOrdersByStatus` - Get orders by status
- `GET /api/trpc/admin.getOrderDetails` - Get order details
- `POST /api/trpc/admin.updateOrderStatus` - Update order status

## Deployment

### Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Push code to GitHub
2. Connect GitHub repository to Railway
3. Add MySQL service
4. Set environment variables
5. Deploy

### Docker Deployment

```bash
# Build image
docker build -t freshsip-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:password@db:3306/freshsip \
  -e RAZORPAY_KEY_ID=your_key \
  -e RAZORPAY_KEY_SECRET=your_secret \
  freshsip-app
```

## Database Schema

### Tables
- **users**: User accounts and roles
- **menuItems**: Juice products
- **sizes**: Size options (Small, Medium, Large)
- **addOns**: Optional add-ons (Ice Cream, etc.)
- **orders**: Customer orders
- **orderItems**: Individual items in orders
- **orderStatusHistory**: Order status change tracking

## Payment Integration

### Razorpay Setup

1. Create Razorpay account at https://razorpay.com
2. Get API keys from dashboard
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in environment
4. Test with sandbox credentials first

### Payment Flow

1. Customer adds items to cart
2. Proceeds to checkout
3. Enters name and phone
4. Clicks "Pay with Razorpay"
5. Redirected to Razorpay checkout
6. Selects UPI payment method
7. Completes payment in UPI app
8. Returns to order success page

## Admin Authentication

The admin panel uses Gmail OAuth authentication through Manus. Only users with admin role can access the dashboard.

To make a user admin:
1. Access the database
2. Update the `role` field in `users` table to `"admin"`
3. User can now access admin dashboard

## Development

### Running Tests

```bash
pnpm test
```

### Code Formatting

```bash
pnpm format
```

### Type Checking

```bash
pnpm check
```

### Building for Production

```bash
pnpm build
```

### Starting Production Server

```bash
pnpm start
```

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check DATABASE_URL is correct
- Ensure database user has proper permissions

### Payment Gateway Error
- Verify Razorpay credentials
- Check CORS settings
- Test with sandbox credentials first

### Admin Login Not Working
- Ensure user has admin role in database
- Check OAuth configuration
- Verify session cookie settings

## Performance Optimization

- Images are optimized for web
- Database queries use indexes
- Frontend uses code splitting
- Caching headers configured
- Rate limiting enabled

## Security

- JWT tokens for session management
- CORS protection
- SQL injection prevention (Drizzle ORM)
- XSS protection (React)
- HTTPS enforced in production
- Sensitive data not logged

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Email: support@freshsip.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] SMS order updates
- [ ] Loyalty program
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Multi-location support

---

**FreshSip Juice Bar** - Fresh Juices, Fresh Energy! 🍊
