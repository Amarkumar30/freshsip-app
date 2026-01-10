// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc, asc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// drizzle/schema.ts
import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, json, boolean, index, serial } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]);
var paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
}, (table) => ({
  openIdIdx: index("idx_users_openId").on(table.openId),
  roleIdx: index("idx_users_role").on(table.role)
}));
var menuItems = pgTable("menuItems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  // URL to fruit image
  category: varchar("category", { length: 100 }),
  // e.g., "Orange Juice", "Mixed Fruit"
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => ({
  categoryIdx: index("idx_menuItems_category").on(table.category),
  availableIdx: index("idx_menuItems_isAvailable").on(table.isAvailable)
}));
var sizes = pgTable("sizes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  // Small, Medium, Large, Ex-Large
  priceMultiplier: decimal("priceMultiplier", { precision: 5, scale: 2 }).notNull(),
  // 1.0, 1.3, 1.6, 2.0
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var menuItemPrices = pgTable("menuItemPrices", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menuItemId").notNull(),
  sizeId: integer("sizeId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull()
}, (table) => ({
  menuItemIdIdx: index("idx_menuItemPrices_menuItemId").on(table.menuItemId),
  uniqueItemSize: index("idx_menuItemPrices_unique").on(table.menuItemId, table.sizeId)
}));
var addOns = pgTable("addOns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // Ice Cream, Extra Fruit, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  // e.g., ORD-20250101-001
  userId: integer("userId"),
  // Can be null for guest orders
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  // razorpay, upi, etc.
  razorpayOrderId: varchar("razorpayOrderId", { length: 255 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt")
}, (table) => ({
  orderNumberIdx: index("idx_orders_orderNumber").on(table.orderNumber),
  statusIdx: index("idx_orders_status").on(table.status),
  paymentStatusIdx: index("idx_orders_paymentStatus").on(table.paymentStatus),
  createdAtIdx: index("idx_orders_createdAt").on(table.createdAt),
  customerPhoneIdx: index("idx_orders_customerPhone").on(table.customerPhone),
  updatedAtIdx: index("idx_orders_updatedAt").on(table.updatedAt)
}));
var orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  menuItemId: integer("menuItemId").notNull(),
  menuItemName: varchar("menuItemName", { length: 255 }),
  // Store name directly for display
  sizeId: integer("sizeId").notNull(),
  sizeName: varchar("sizeName", { length: 50 }),
  // Store size name directly for display
  quantity: integer("quantity").default(1).notNull(),
  itemPrice: decimal("itemPrice", { precision: 10, scale: 2 }).notNull(),
  // Price at time of order
  addOnsData: json("addOnsData").$type(),
  // JSON array of selected add-ons
  addOnsTotal: decimal("addOnsTotal", { precision: 10, scale: 2 }).default("0").notNull(),
  specialInstructions: text("specialInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  orderIdIdx: index("idx_orderItems_orderId").on(table.orderId),
  menuItemIdIdx: index("idx_orderItems_menuItemId").on(table.menuItemId)
}));
var orderStatusHistory = pgTable("orderStatusHistory", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: integer("changedBy"),
  // Admin user ID who made the change
  timestamp: timestamp("timestamp").defaultNow().notNull()
}, (table) => ({
  orderIdIdx: index("idx_orderStatusHistory_orderId").on(table.orderId),
  timestampIdx: index("idx_orderStatusHistory_timestamp").on(table.timestamp)
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var { Pool } = pg;
var _db = null;
var _pool = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        // Max 10 concurrent connections
        idleTimeoutMillis: 6e4,
        // Close idle connections after 60s
        connectionTimeoutMillis: 1e4,
        // Connection timeout
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : void 0
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.isAvailable, true));
}
async function getAllSizes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sizes);
}
async function getAllAddOns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addOns).where(eq(addOns.isAvailable, true));
}
async function getMenuItemPrices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItemPrices).where(eq(menuItemPrices.isAvailable, true));
}
async function createOrder(orderData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = {
    orderNumber: orderData.orderNumber,
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount
  };
  if (orderData.customerPhone) insertData.customerPhone = orderData.customerPhone;
  if (orderData.userId) insertData.userId = orderData.userId;
  await db.insert(orders).values(insertData);
  const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderData.orderNumber)).limit(1);
  return createdOrder.length > 0 ? createdOrder[0] : null;
}
async function getOrderById(orderId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getOrderByNumber(orderNumber) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}
async function getAllOrdersWithItems() {
  const db = await getDb();
  if (!db) return [];
  const allOrders = await db.select().from(orders).orderBy(asc(orders.createdAt));
  const ordersWithItems = await Promise.all(
    allOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        menuItemId: orderItems.menuItemId,
        sizeId: orderItems.sizeId,
        quantity: orderItems.quantity,
        itemPrice: orderItems.itemPrice,
        addOnsData: orderItems.addOnsData,
        addOnsTotal: orderItems.addOnsTotal,
        specialInstructions: orderItems.specialInstructions,
        storedMenuItemName: orderItems.menuItemName,
        storedSizeName: orderItems.sizeName,
        joinedMenuItemName: menuItems.name,
        joinedSizeName: sizes.name
      }).from(orderItems).leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id)).leftJoin(sizes, eq(orderItems.sizeId, sizes.id)).where(eq(orderItems.orderId, order.id));
      const mappedItems = items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        itemPrice: item.itemPrice,
        addOnsData: item.addOnsData,
        addOnsTotal: item.addOnsTotal,
        specialInstructions: item.specialInstructions,
        menuItemName: item.storedMenuItemName || item.joinedMenuItemName || `Item #${item.menuItemId}`,
        sizeName: item.storedSizeName || item.joinedSizeName || `Size #${item.sizeId}`
      }));
      return {
        ...order,
        items: mappedItems
      };
    })
  );
  return ordersWithItems;
}
async function updateOrderStatus(orderId, newStatus, adminId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");
  const oldStatus = order.status;
  await db.update(orders).set({ status: newStatus, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, orderId));
  await db.insert(orderStatusHistory).values({
    orderId,
    oldStatus,
    newStatus,
    changedBy: adminId
  });
}
async function updateOrderPaymentStatus(orderId, paymentStatus, razorpayPaymentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {
    paymentStatus,
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (razorpayPaymentId) {
    updateData.razorpayPaymentId = razorpayPaymentId;
  }
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  console.log(`[DB] Updated payment status for order ${orderId}: ${paymentStatus}`);
}
async function updateOrderStatusOnly(orderId, newStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({
    status: newStatus,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(orders.id, orderId));
}
async function updateOrderRazorpayId(orderId, razorpayOrderId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({
    razorpayOrderId,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(orders.id, orderId));
  console.log(`[DB] Updated razorpayOrderId for order ${orderId}: ${razorpayOrderId}`);
}
async function getOrderByRazorpayOrderId(razorpayOrderId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.razorpayOrderId, razorpayOrderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function addOrderItem(orderItemData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orderItems).values({
    orderId: orderItemData.orderId,
    menuItemId: orderItemData.menuItemId,
    menuItemName: orderItemData.menuItemName,
    sizeId: orderItemData.sizeId,
    sizeName: orderItemData.sizeName,
    quantity: orderItemData.quantity,
    itemPrice: orderItemData.itemPrice,
    addOnsData: orderItemData.addOnsData,
    addOnsTotal: orderItemData.addOnsTotal || "0",
    specialInstructions: orderItemData.specialInstructions
  });
}
async function getOrderItemsByOrderId(orderId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}
async function getOrderStatusHistory(orderId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(desc(orderStatusHistory.timestamp));
}
async function getOrdersByStatus(status) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    if (ENV.oAuthServerUrl) {
      console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    } else {
      console.log("[OAuth] Skipped initialization - OAUTH_SERVER_URL not configured");
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  if (!process.env.OAUTH_SERVER_URL) {
    console.log("[OAuth] Skipping OAuth routes - OAUTH_SERVER_URL not configured");
    return;
  }
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/websocket.ts
import { Server as SocketIOServer } from "socket.io";
var io = null;
function initializeWebSocket(httpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    socket.on("join-admin", (data) => {
      socket.join("admin-room");
    });
    socket.on("join-customer", (orderNumber) => {
      socket.join(`order-${orderNumber}`);
    });
    socket.on("disconnect", () => {
    });
  });
  return io;
}
function emitOrderUpdate(orderId, orderData) {
  if (io) {
    io.to("admin-room").emit("order-updated", {
      orderId,
      ...orderData,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
}
function emitOrderStatusChange(orderNumber, status) {
  if (io) {
    io.to(`order-${orderNumber}`).emit("status-changed", {
      orderNumber,
      status,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
}
function emitNewOrder(orderData) {
  if (io) {
    io.to("admin-room").emit("new-order", {
      ...orderData,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
}

// server/routers.ts
import Razorpay from "razorpay";
var razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW = 60 * 60 * 1e3;
var getClientIP = (req) => {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.connection?.remoteAddress || req.socket?.remoteAddress || "unknown";
};
var checkRateLimit = (ip) => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (rateLimitMap.size > 1e4) {
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, value] of entries) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetTime - now };
};
var ADMIN_USERNAME = process.env.ADMIN_USERNAME || "sanjeet";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sanjeet@sau405";
var simpleAdminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminToken = ctx.req.headers["x-admin-token"];
  if (!adminToken) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  try {
    const decoded = JSON.parse(Buffer.from(adminToken, "base64").toString());
    if (decoded.username !== ADMIN_USERNAME || decoded.password !== ADMIN_PASSWORD) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Invalid admin credentials" });
    }
  } catch (e) {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Invalid admin token" });
  }
  return next({ ctx });
});
var adminProcedure2 = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Menu procedures
  menu: router({
    getItems: publicProcedure.query(() => getAllMenuItems()),
    getSizes: publicProcedure.query(() => getAllSizes()),
    getAddOns: publicProcedure.query(() => getAllAddOns()),
    getItemPrices: publicProcedure.query(() => getMenuItemPrices())
  }),
  // Order procedures
  orders: router({
    create: publicProcedure.input(
      z2.object({
        customerName: z2.string(),
        customerPhone: z2.string().optional(),
        items: z2.array(
          z2.object({
            menuItemId: z2.number(),
            menuItemName: z2.string().optional(),
            sizeId: z2.number(),
            sizeName: z2.string().optional(),
            quantity: z2.number(),
            itemPrice: z2.number(),
            addOnsData: z2.array(z2.any()).optional(),
            addOnsTotal: z2.number(),
            specialInstructions: z2.string().optional()
          })
        ),
        totalAmount: z2.number()
      })
    ).mutation(async ({ input, ctx }) => {
      const clientIP = getClientIP(ctx.req);
      const rateLimit = checkRateLimit(clientIP);
      if (!rateLimit.allowed) {
        const minutesLeft = Math.ceil(rateLimit.resetIn / 6e4);
        throw new TRPCError3({
          code: "TOO_MANY_REQUESTS",
          message: `Too many orders. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`
        });
      }
      try {
        const timestamp2 = Date.now();
        const random = Math.floor(Math.random() * 1e3);
        const orderNumber = `ORD-${timestamp2}-${random}`;
        const savedOrder = await createOrder({
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          totalAmount: input.totalAmount.toFixed(2),
          userId: void 0
        });
        if (!savedOrder) {
          throw new TRPCError3({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order"
          });
        }
        const orderId = savedOrder.id;
        if (savedOrder) {
          emitNewOrder({
            id: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            customerName: savedOrder.customerName,
            totalAmount: savedOrder.totalAmount,
            status: savedOrder.status,
            createdAt: savedOrder.createdAt
          });
        }
        for (const item of input.items) {
          await addOrderItem({
            orderId,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            sizeId: item.sizeId,
            sizeName: item.sizeName,
            quantity: item.quantity,
            itemPrice: item.itemPrice.toFixed(2),
            addOnsData: item.addOnsData,
            addOnsTotal: item.addOnsTotal.toFixed(2),
            specialInstructions: item.specialInstructions
          });
        }
        if (!savedOrder) {
          throw new TRPCError3({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve created order"
          });
        }
        return {
          success: true,
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber
        };
      } catch (error) {
        console.error("Error creating order:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order"
        });
      }
    }),
    getByNumber: publicProcedure.input(z2.object({ orderNumber: z2.string() })).query(async ({ input }) => {
      try {
        const order = await getOrderByNumber(input.orderNumber);
        if (!order) {
          return null;
        }
        const items = await getOrderItemsByOrderId(order.id);
        return {
          order,
          items
        };
      } catch (error) {
        console.error("Error fetching order:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order"
        });
      }
    })
  }),
  // Payment procedures
  payment: router({
    // Create Razorpay order
    createRazorpayOrder: publicProcedure.input(
      z2.object({
        orderId: z2.number(),
        amount: z2.string(),
        customerName: z2.string(),
        customerEmail: z2.string().optional(),
        customerPhone: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      try {
        if (!razorpay) {
          throw new TRPCError3({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
          });
        }
        const amountInPaisa = Math.round(parseFloat(input.amount) * 100);
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaisa,
          currency: "INR",
          receipt: `order_${input.orderId}`,
          notes: {
            orderId: String(input.orderId),
            customerName: input.customerName
          }
        });
        await updateOrderRazorpayId(input.orderId, razorpayOrder.id);
        console.log(`[Payment] Razorpay order created: ${razorpayOrder.id} for order ${input.orderId}`);
        return {
          razorpayOrderId: razorpayOrder.id,
          amount: amountInPaisa,
          currency: "INR",
          keyId: process.env.RAZORPAY_KEY_ID
        };
      } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment order"
        });
      }
    }),
    // Verify payment (client-side verification - backup to webhook)
    verifyPayment: publicProcedure.input(
      z2.object({
        razorpayOrderId: z2.string(),
        razorpayPaymentId: z2.string(),
        razorpaySignature: z2.string(),
        orderId: z2.number()
      })
    ).mutation(async ({ input }) => {
      try {
        if (!razorpay) {
          throw new TRPCError3({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment gateway not configured"
          });
        }
        const crypto2 = await import("crypto");
        const expectedSignature = crypto2.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`).digest("hex");
        if (expectedSignature !== input.razorpaySignature) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Payment verification failed - invalid signature"
          });
        }
        await Promise.all([
          updateOrderPaymentStatus(input.orderId, "completed", input.razorpayPaymentId),
          updateOrderStatusOnly(input.orderId, "confirmed")
        ]);
        console.log(`[Payment] Payment verified for order ${input.orderId}, payment ID: ${input.razorpayPaymentId}`);
        getOrderById(input.orderId).then((order) => {
          if (order) {
            emitNewOrder({
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              totalAmount: order.totalAmount,
              status: "confirmed",
              paymentStatus: "completed",
              createdAt: order.createdAt
            });
            emitOrderUpdate(input.orderId, {
              paymentStatus: "completed",
              status: "confirmed",
              razorpayPaymentId: input.razorpayPaymentId
            });
          }
        });
        return {
          success: true,
          message: "Payment verified successfully"
        };
      } catch (error) {
        console.error("Error verifying payment:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment verification failed"
        });
      }
    }),
    // Get payment status for an order
    getPaymentStatus: publicProcedure.input(z2.object({ orderId: z2.number() })).query(async ({ input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Order not found" });
      }
      return {
        paymentStatus: order.paymentStatus,
        razorpayPaymentId: order.razorpayPaymentId
      };
    })
  }),
  // Admin procedures
  admin: router({
    // Verify admin credentials
    login: publicProcedure.input(z2.object({
      username: z2.string(),
      password: z2.string()
    })).mutation(async ({ input }) => {
      if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
        return {
          success: true,
          token: Buffer.from(JSON.stringify({ username: input.username, password: input.password })).toString("base64")
        };
      }
      throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }),
    getAllOrders: simpleAdminProcedure.query(async () => {
      try {
        return await getAllOrdersWithItems();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders"
        });
      }
    }),
    // Get all orders including unpaid (for debugging)
    getAllOrdersIncludingUnpaid: simpleAdminProcedure.query(async () => {
      try {
        return await getAllOrders();
      } catch (error) {
        console.error("Error fetching all orders:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders"
        });
      }
    }),
    getOrdersByStatus: simpleAdminProcedure.input(z2.object({ status: z2.string() })).query(async ({ input }) => {
      try {
        return await getOrdersByStatus(input.status);
      } catch (error) {
        console.error("Error fetching orders by status:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders"
        });
      }
    }),
    getOrderDetails: simpleAdminProcedure.input(z2.object({ orderId: z2.number() })).query(async ({ input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Order not found"
          });
        }
        const items = await getOrderItemsByOrderId(input.orderId);
        const statusHistory = await getOrderStatusHistory(input.orderId);
        return {
          order,
          items,
          statusHistory
        };
      } catch (error) {
        console.error("Error fetching order details:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order details"
        });
      }
    }),
    updateOrderStatus: simpleAdminProcedure.input(
      z2.object({
        orderId: z2.number(),
        status: z2.enum(["pending", "confirmed", "ready", "completed", "cancelled"])
      })
    ).mutation(async ({ input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Order not found"
          });
        }
        await updateOrderStatus(input.orderId, input.status);
        emitOrderUpdate(input.orderId, {
          status: input.status,
          updatedAt: /* @__PURE__ */ new Date()
        });
        emitOrderStatusChange(order.orderNumber, input.status);
        return {
          success: true,
          message: `Order status updated to ${input.status}`
        };
      } catch (error) {
        console.error("Error updating order status:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status"
        });
      }
    }),
    // Analytics endpoints
    getMenuItems: simpleAdminProcedure.query(async () => {
      try {
        return await getAllMenuItems();
      } catch (error) {
        console.error("Error fetching menu items:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch menu items"
        });
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip"],
          router: ["wouter"]
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="./src/main.tsx"`,
        `src="./src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(__dirname, "../..", "dist", "public") : path2.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/razorpayWebhook.ts
import crypto from "crypto";
function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
function registerRazorpayWebhook(app) {
  app.post(
    "/api/razorpay/webhook",
    // Use raw body parser for this route
    (req, res) => {
      handleWebhook(req, res);
    }
  );
  console.log("[Razorpay] Webhook endpoint registered at /api/razorpay/webhook");
}
async function handleWebhook(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature) {
        console.warn("[Razorpay Webhook] No signature found in headers");
        return res.status(400).json({ error: "Missing signature" });
      }
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn("[Razorpay Webhook] Invalid signature");
        return res.status(400).json({ error: "Invalid signature" });
      }
    } else {
      console.warn("[Razorpay Webhook] No webhook secret configured - skipping signature verification");
    }
    const payload = req.body;
    console.log(`[Razorpay Webhook] Received event: ${payload.event}`);
    switch (payload.event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      case "order.paid":
        await handleOrderPaid(payload);
        break;
      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${payload.event}`);
    }
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    res.status(200).json({ status: "error", message: "Internal error but acknowledged" });
  }
}
async function handlePaymentCaptured(payload) {
  const payment = payload.payload.payment?.entity;
  if (!payment) {
    console.warn("[Razorpay Webhook] No payment entity in payload");
    return;
  }
  console.log(`[Razorpay Webhook] Payment captured: ${payment.id} for order ${payment.order_id}`);
  const order = await getOrderByRazorpayOrderId(payment.order_id);
  if (!order) {
    console.warn(`[Razorpay Webhook] Order not found for razorpay_order_id: ${payment.order_id}`);
    return;
  }
  await updateOrderPaymentStatus(order.id, "completed", payment.id);
  await updateOrderStatusOnly(order.id, "confirmed");
  console.log(`[Razorpay Webhook] Order ${order.orderNumber} marked as PAID and CONFIRMED`);
  emitNewOrder({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    status: "confirmed",
    paymentStatus: "completed",
    createdAt: order.createdAt
  });
  emitOrderUpdate(order.id, {
    paymentStatus: "completed",
    status: "confirmed",
    razorpayPaymentId: payment.id
  });
}
async function handlePaymentFailed(payload) {
  const payment = payload.payload.payment?.entity;
  if (!payment) return;
  console.log(`[Razorpay Webhook] Payment failed: ${payment.id} for order ${payment.order_id}`);
  const order = await getOrderByRazorpayOrderId(payment.order_id);
  if (!order) return;
  await updateOrderPaymentStatus(order.id, "failed", payment.id);
  console.log(`[Razorpay Webhook] Order ${order.orderNumber} marked as FAILED`);
  emitOrderUpdate(order.id, {
    paymentStatus: "failed"
  });
}
async function handleOrderPaid(payload) {
  const orderEntity = payload.payload.order?.entity;
  if (!orderEntity) return;
  console.log(`[Razorpay Webhook] Order paid event: ${orderEntity.id}`);
  const order = await getOrderByRazorpayOrderId(orderEntity.id);
  if (!order) return;
  if (order.paymentStatus !== "completed") {
    await updateOrderPaymentStatus(order.id, "completed");
    await updateOrderStatusOnly(order.id, "confirmed");
    emitNewOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: "confirmed",
      paymentStatus: "completed",
      createdAt: order.createdAt
    });
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  initializeWebSocket(server);
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });
  app.use((req, res, next) => {
    express2.json({ limit: "50mb" })(req, res, (err) => {
      if (err && (err.type === "request.aborted" || err.message === "request aborted")) {
        return;
      }
      if (err) return next(err);
      next();
    });
  });
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerRazorpayWebhook(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use((err, _req, res, _next) => {
    if (err.type === "request.aborted" || err.code === "ECONNRESET" || err.message === "request aborted") {
      return;
    }
    console.error("[Server Error]", err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
    console.log(`WebSocket server initialized for real-time updates`);
  });
}
startServer().catch(console.error);
