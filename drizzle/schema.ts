import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for admin/user distinction.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  openIdIdx: index("idx_users_openId").on(table.openId),
  roleIdx: index("idx_users_role").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Menu items table - stores juice products
 */
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  image: text("image"), // URL to fruit image
  category: varchar("category", { length: 100 }), // e.g., "Orange Juice", "Mixed Fruit"
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("idx_menuItems_category").on(table.category),
  availableIdx: index("idx_menuItems_isAvailable").on(table.isAvailable),
}));

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Size options table - stores available sizes (Small, Medium, Large)
 */
export const sizes = mysqlTable("sizes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // Small, Medium, Large
  priceMultiplier: decimal("priceMultiplier", { precision: 5, scale: 2 }).notNull(), // 1.0, 1.3, 1.6
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Size = typeof sizes.$inferSelect;
export type InsertSize = typeof sizes.$inferInsert;

/**
 * Add-ons table - stores optional items like ice cream, extra fruit, etc.
 */
export const addOns = mysqlTable("addOns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ice Cream, Extra Fruit, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = typeof addOns.$inferInsert;

/**
 * Orders table - stores customer orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(), // e.g., ORD-20250101-001
  userId: int("userId"), // Can be null for guest orders
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "ready", "completed", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // razorpay, upi, etc.
  razorpayOrderId: varchar("razorpayOrderId", { length: 255 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  orderNumberIdx: index("idx_orders_orderNumber").on(table.orderNumber),
  statusIdx: index("idx_orders_status").on(table.status),
  paymentStatusIdx: index("idx_orders_paymentStatus").on(table.paymentStatus),
  createdAtIdx: index("idx_orders_createdAt").on(table.createdAt),
  customerPhoneIdx: index("idx_orders_customerPhone").on(table.customerPhone),
  updatedAtIdx: index("idx_orders_updatedAt").on(table.updatedAt),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items table - stores individual juice items in an order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  sizeId: int("sizeId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  itemPrice: decimal("itemPrice", { precision: 10, scale: 2 }).notNull(), // Price at time of order
  addOnsData: json("addOnsData").$type<Array<{ id: number; name: string; price: string }>>(), // JSON array of selected add-ons
  addOnsTotal: decimal("addOnsTotal", { precision: 10, scale: 2 }).default("0").notNull(),
  specialInstructions: text("specialInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index("idx_orderItems_orderId").on(table.orderId),
  menuItemIdIdx: index("idx_orderItems_menuItemId").on(table.menuItemId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Order status history table - tracks status changes for real-time updates
 */
export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: int("changedBy"), // Admin user ID who made the change
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index("idx_orderStatusHistory_orderId").on(table.orderId),
  timestampIdx: index("idx_orderStatusHistory_timestamp").on(table.timestamp),
}));

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
