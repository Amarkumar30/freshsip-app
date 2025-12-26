import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, menuItems, sizes, addOns, orders, orderItems, orderStatusHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Menu Queries ============

export async function getAllMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.isAvailable, true));
}

export async function getAllSizes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sizes);
}

export async function getAllAddOns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addOns).where(eq(addOns.isAvailable, true));
}

// ============ Order Queries ============

export async function createOrder(orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: any = {
    orderNumber: orderData.orderNumber,
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount,
  };

  if (orderData.customerPhone) insertData.customerPhone = orderData.customerPhone;
  if (orderData.userId) insertData.userId = orderData.userId;

  await db.insert(orders).values(insertData);

  // Fetch and return the created order
  const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderData.orderNumber)).limit(1);
  return createdOrder.length > 0 ? createdOrder[0] : null;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, newStatus: string, adminId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");

  const oldStatus = order.status;

  // Update order status
  await db.update(orders).set({ status: newStatus as any, updatedAt: new Date() }).where(eq(orders.id, orderId));

  // Record status change in history
  await db.insert(orderStatusHistory).values({
    orderId,
    oldStatus,
    newStatus,
    changedBy: adminId,
  });
}

export async function updateOrderPaymentStatus(orderId: number, paymentStatus: string, razorpayPaymentId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    paymentStatus: paymentStatus as any,
    updatedAt: new Date(),
  };

  if (razorpayPaymentId) {
    updateData.razorpayPaymentId = razorpayPaymentId;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

// Update order status without recording history (used by webhook)
export async function updateOrderStatusOnly(orderId: number, newStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({
    status: newStatus as any,
    updatedAt: new Date(),
  }).where(eq(orders.id, orderId));
}

// Update razorpay order ID on order
export async function updateOrderRazorpayId(orderId: number, razorpayOrderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(orders).set({
      razorpayOrderId,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));
  } catch (error) {
    // If the column doesn't exist (migration not run), log warning but don't fail
    console.warn(`[DB] Could not update razorpayOrderId for order ${orderId}:`, error);
    console.warn("[DB] You may need to run migrations: npm run db:migrate");
  }
}

// Get order by Razorpay order ID (for webhooks)
export async function getOrderByRazorpayOrderId(razorpayOrderId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(orders).where(eq(orders.razorpayOrderId, razorpayOrderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Get only paid orders (for admin panel)
export async function getPaidOrders() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders)
    .where(eq(orders.paymentStatus, "completed"))
    .orderBy(desc(orders.createdAt));
}

export async function addOrderItem(orderItemData: {
  orderId: number;
  menuItemId: number;
  sizeId: number;
  quantity: number;
  itemPrice: string;
  addOnsData?: Array<{ id: number; name: string; price: string }>;
  addOnsTotal?: string;
  specialInstructions?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(orderItems).values({
    orderId: orderItemData.orderId,
    menuItemId: orderItemData.menuItemId,
    sizeId: orderItemData.sizeId,
    quantity: orderItemData.quantity,
    itemPrice: orderItemData.itemPrice,
    addOnsData: orderItemData.addOnsData,
    addOnsTotal: orderItemData.addOnsTotal || "0",
    specialInstructions: orderItemData.specialInstructions,
  });
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrderStatusHistory(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(desc(orderStatusHistory.timestamp));
}

// ============ Admin Queries ============

export async function getRecentOrders(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function getOrdersByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(orders).where(eq(orders.status, status as any)).orderBy(desc(orders.createdAt));
}
