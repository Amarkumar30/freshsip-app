# FreshSip Juice Bar - Complete Project Documentation

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [File Structure](#file-structure)
7. [Features](#features)
8. [Development Guide](#development-guide)
9. [Deployment](#deployment)
10. [API Documentation](#api-documentation)

---

## Project Overview

**FreshSip Juice Bar** is a complete full-stack web application for ordering fresh juices online. It features:

- 🛒 Customer ordering system with menu browsing
- 💳 Razorpay payment integration with UPI support
- 📊 Real-time admin dashboard
- 🔄 Real-time order status updates via WebSocket
- 📱 Order tracking for customers
- 🗄️ MySQL database with optimized queries
- 🔐 Role-based access control

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  - Menu browsing, cart management, checkout, order tracking │
│  - Real-time WebSocket listeners for order updates           │
└────────────────────┬────────────────────────────────────────┘
                     │ tRPC + WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                 Backend (Express + tRPC)                     │
│  - Order management, payment processing, admin operations   │
│  - WebSocket server for real-time updates                   │
│  - Razorpay integration                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────────────────┐
│              Database (MySQL + Drizzle ORM)                 │
│  - Users, Menu Items, Orders, Order Items, Status History  │
│  - 6 optimized indexes for fast queries                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Customer Orders**: Customer → Frontend → tRPC → Database
2. **Payment**: Customer → Razorpay → Backend Verification → Database
3. **Admin Updates**: Admin → WebSocket → All Connected Clients
4. **Real-time Tracking**: Customer → WebSocket Listener → Status Updates

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **tRPC** - Type-safe API calls
- **Socket.IO Client** - Real-time updates
- **Wouter** - Routing
- **Zod** - Data validation

### Backend
- **Express 4** - Web server
- **Node.js** - Runtime
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database ORM
- **Socket.IO** - WebSocket server
- **Razorpay** - Payment gateway
- **JWT** - Authentication

### Database
- **MySQL** - Relational database
- **Drizzle Kit** - Migration tool

### Development
- **Vite** - Build tool
- **TypeScript** - Type checking
- **Vitest** - Testing framework
- **ESBuild** - Bundler

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_openId (openId),
  INDEX idx_users_role (role)
);
```

### Menu Items Table
```sql
CREATE TABLE menuItems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basePrice DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category VARCHAR(100),
  isAvailable BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menuItems_category (category),
  INDEX idx_menuItems_isAvailable (isAvailable)
);
```

### Sizes Table
```sql
CREATE TABLE sizes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  priceMultiplier DECIMAL(5, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Add-ons Table
```sql
CREATE TABLE addOns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  isAvailable BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  userId INT,
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(20),
  totalAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  paymentStatus ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  paymentMethod VARCHAR(50),
  razorpayOrderId VARCHAR(255),
  razorpayPaymentId VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  INDEX idx_orders_orderNumber (orderNumber),
  INDEX idx_orders_status (status),
  INDEX idx_orders_paymentStatus (paymentStatus),
  INDEX idx_orders_createdAt (createdAt),
  INDEX idx_orders_customerPhone (customerPhone),
  INDEX idx_orders_updatedAt (updatedAt)
);
```

### Order Items Table
```sql
CREATE TABLE orderItems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  menuItemId INT NOT NULL,
  sizeId INT NOT NULL,
  quantity INT DEFAULT 1,
  itemPrice DECIMAL(10, 2) NOT NULL,
  addOnsData JSON,
  addOnsTotal DECIMAL(10, 2) DEFAULT 0,
  specialInstructions TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orderItems_orderId (orderId),
  INDEX idx_orderItems_menuItemId (menuItemId)
);
```

### Order Status History Table
```sql
CREATE TABLE orderStatusHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  oldStatus VARCHAR(50),
  newStatus VARCHAR(50) NOT NULL,
  changedBy INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orderStatusHistory_orderId (orderId),
  INDEX idx_orderStatusHistory_timestamp (timestamp)
);
```

---

## API Endpoints

### Menu Endpoints

**Get All Menu Items**
```
GET /api/trpc/menu.getItems
Response: Array<MenuItem>
```

**Get All Sizes**
```
GET /api/trpc/menu.getSizes
Response: Array<Size>
```

**Get All Add-ons**
```
GET /api/trpc/menu.getAddOns
Response: Array<AddOn>
```

### Order Endpoints

**Create Order**
```
POST /api/trpc/orders.create
Body: {
  customerName: string,
  customerPhone?: string,
  items: Array<{
    menuItemId: number,
    sizeId: number,
    quantity: number,
    itemPrice: number,
    addOnsData?: Array,
    addOnsTotal: number,
    specialInstructions?: string
  }>,
  totalAmount: number
}
Response: { success: boolean, orderId: number, orderNumber: string }
```

**Get Order by Number**
```
GET /api/trpc/orders.getByNumber?input={"orderNumber":"ORD-123456"}
Response: { order: Order, items: Array<OrderItem> }
```

### Payment Endpoints

**Create Razorpay Order**
```
POST /api/trpc/payment.createRazorpayOrder
Body: {
  orderId: number,
  amount: string,
  customerName: string,
  customerEmail?: string,
  customerPhone?: string
}
Response: { razorpayOrderId: string, amount: number, currency: string, keyId: string }
```

**Verify Payment**
```
POST /api/trpc/payment.verifyPayment
Body: {
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  orderId: number
}
Response: { success: boolean, message: string }
```

### Admin Endpoints (Protected)

**Get All Orders**
```
GET /api/trpc/admin.getAllOrders
Response: Array<Order>
```

**Get Orders by Status**
```
GET /api/trpc/admin.getOrdersByStatus?input={"status":"pending"}
Response: Array<Order>
```

**Get Order Details**
```
GET /api/trpc/admin.getOrderDetails?input={"orderId":1}
Response: { order: Order, items: Array<OrderItem>, statusHistory: Array }
```

**Update Order Status**
```
POST /api/trpc/admin.updateOrderStatus
Body: {
  orderId: number,
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled"
}
Response: { success: boolean, message: string }
```

---

## File Structure

```
freshsip-app/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Landing page
│   │   │   ├── Menu.tsx              # Menu browsing
│   │   │   ├── Checkout.tsx          # Order checkout
│   │   │   ├── OrderSuccess.tsx      # Order confirmation
│   │   │   ├── OrderTracking.tsx     # Customer order tracking
│   │   │   ├── AdminLogin.tsx        # Admin login
│   │   │   └── AdminDashboard.tsx    # Admin dashboard
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── hooks/
│   │   │   └── useRealtimeOrders.ts  # WebSocket hooks
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── lib/
│   │   │   └── trpc.ts              # tRPC client
│   │   ├── App.tsx                  # Routes
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── public/                       # Static assets
│   └── index.html
├── server/
│   ├── db.ts                        # Database queries
│   ├── routers.ts                   # tRPC procedures
│   ├── websocket.ts                 # WebSocket server
│   ├── _core/
│   │   ├── index.ts                 # Server entry point
│   │   ├── context.ts               # tRPC context
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── oauth.ts                 # OAuth routes
│   │   ├── cookies.ts               # Cookie handling
│   │   └── vite.ts                  # Vite integration
│   └── auth.logout.test.ts          # Test example
├── drizzle/
│   ├── schema.ts                    # Database schema
│   └── migrations/                  # Migration files
├── shared/
│   └── const.ts                     # Shared constants
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
├── drizzle.config.ts                # Drizzle config
├── seed-db.mjs                      # Database seeding
├── README.md                        # Project overview
├── RAILWAY_SETUP_GUIDE.md           # Deployment guide
├── QUICK_START.md                   # Quick start
└── PROJECT_DOCUMENTATION.md         # This file
```

---

## Features

### Customer Features
- ✅ Browse juice menu with images and descriptions
- ✅ Select size (Small, Medium, Large) with dynamic pricing
- ✅ Add optional items (ice cream, honey, etc.)
- ✅ Add special instructions
- ✅ View cart with total calculation
- ✅ Checkout with customer details
- ✅ Razorpay payment with UPI support
- ✅ Order confirmation with order number
- ✅ Real-time order tracking
- ✅ See when order is ready

### Admin Features
- ✅ View all orders in real-time
- ✅ Filter orders by status
- ✅ View detailed order information
- ✅ Update order status
- ✅ See order history and timeline
- ✅ Real-time notifications of new orders
- ✅ Track order completion

### Technical Features
- ✅ Real-time WebSocket updates
- ✅ Optimized database with 6 indexes
- ✅ Type-safe API with tRPC
- ✅ Responsive design
- ✅ Error handling and validation
- ✅ Production-ready code
- ✅ Comprehensive logging

---

## Development Guide

### Local Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Seed database with sample data
node seed-db.mjs

# Start development server
pnpm dev
```

### Development Commands

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Format code
pnpm format

# Type check
pnpm check

# Database migration
pnpm db:push
```

### Adding New Features

1. **Update Database Schema** (if needed)
   - Edit `drizzle/schema.ts`
   - Run `pnpm db:push`

2. **Add Database Queries**
   - Add functions in `server/db.ts`

3. **Create tRPC Procedures**
   - Add router in `server/routers.ts`

4. **Build Frontend UI**
   - Create component in `client/src/pages/` or `client/src/components/`
   - Use tRPC hooks to call backend

5. **Test**
   - Write tests in `server/*.test.ts`
   - Run `pnpm test`

---

## Deployment

### Railway Deployment

See `RAILWAY_SETUP_GUIDE.md` for complete instructions.

Quick steps:
1. Push to GitHub
2. Connect to Railway
3. Add MySQL database
4. Set environment variables
5. Deploy!

### Environment Variables Required

```
DATABASE_URL=mysql://...
JWT_SECRET=your-secret
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
VITE_RAZORPAY_KEY_ID=your-key
```

---

## API Documentation

### WebSocket Events

**Admin Events**
- `join-admin` - Admin joins admin room
- `new-order` - New order created
- `order-updated` - Order details updated
- `refresh-orders` - Refresh orders list

**Customer Events**
- `join-customer` - Customer joins order tracking
- `status-changed` - Order status changed

### Example WebSocket Usage

```typescript
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

export function AdminDashboard() {
  const { isConnected, newOrders, updatedOrders } = useRealtimeOrders();
  
  return (
    <div>
      {isConnected && <p>Connected to real-time updates</p>}
      {newOrders.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

---

## Performance Optimization

### Database Optimization
- 6 strategic indexes on frequently queried columns
- Efficient query patterns with Drizzle ORM
- Connection pooling with MySQL

### Frontend Optimization
- Code splitting with Vite
- Image lazy loading
- Component memoization
- Efficient state management

### Backend Optimization
- tRPC automatic batching
- WebSocket connection pooling
- Efficient JSON serialization
- Error handling and logging

---

## Security

### Implemented Security Measures
- ✅ HTTPS/TLS encryption
- ✅ CORS protection
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Role-based access control
- ✅ Secure password handling
- ✅ Environment variable protection

---

## Monitoring & Logging

### Logs Available
- Application logs in Railway dashboard
- Database query logs
- WebSocket connection logs
- Error logs with stack traces

### Monitoring
- Railway built-in monitoring
- Error tracking
- Performance metrics
- Database performance

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Razorpay Docs**: https://razorpay.com/docs
- **tRPC Docs**: https://trpc.io
- **Drizzle Docs**: https://orm.drizzle.team
- **React Docs**: https://react.dev

---

## License

This project is provided as-is for the FreshSip Juice Bar.

---

## Version History

- **v1.0.0** (Dec 25, 2025) - Initial release with complete features
  - Customer ordering system
  - Real-time admin dashboard
  - Razorpay integration
  - WebSocket real-time updates
  - Production-ready deployment

---

**Last Updated**: December 25, 2025
**Status**: Production Ready ✅
