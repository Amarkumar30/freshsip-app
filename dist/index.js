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
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, index } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
}, (table) => ({
  openIdIdx: index("idx_users_openId").on(table.openId),
  roleIdx: index("idx_users_role").on(table.role)
}));
var menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  // URL to fruit image
  category: varchar("category", { length: 100 }),
  // e.g., "Orange Juice", "Mixed Fruit"
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  categoryIdx: index("idx_menuItems_category").on(table.category),
  availableIdx: index("idx_menuItems_isAvailable").on(table.isAvailable)
}));
var sizes = mysqlTable("sizes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  // Small, Medium, Large
  priceMultiplier: decimal("priceMultiplier", { precision: 5, scale: 2 }).notNull(),
  // 1.0, 1.3, 1.6
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var addOns = mysqlTable("addOns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // Ice Cream, Extra Fruit, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  // e.g., ORD-20250101-001
  userId: int("userId"),
  // Can be null for guest orders
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "ready", "completed", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  // razorpay, upi, etc.
  razorpayOrderId: varchar("razorpayOrderId", { length: 255 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt")
}, (table) => ({
  orderNumberIdx: index("idx_orders_orderNumber").on(table.orderNumber),
  statusIdx: index("idx_orders_status").on(table.status),
  paymentStatusIdx: index("idx_orders_paymentStatus").on(table.paymentStatus),
  createdAtIdx: index("idx_orders_createdAt").on(table.createdAt),
  customerPhoneIdx: index("idx_orders_customerPhone").on(table.customerPhone),
  updatedAtIdx: index("idx_orders_updatedAt").on(table.updatedAt)
}));
var orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  sizeId: int("sizeId").notNull(),
  quantity: int("quantity").default(1).notNull(),
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
var orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: int("changedBy"),
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
var _db = null;
async function getDb() {
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
    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  await db.update(orders).set({
    paymentStatus,
    razorpayPaymentId,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(orders.id, orderId));
}
async function addOrderItem(orderItemData) {
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
  client;
  oauthService;
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
      console.warn("[Auth] Missing session cookie");
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
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    socket.on("join-admin", (data) => {
      socket.join("admin-room");
      console.log(`[WebSocket] Admin joined: ${socket.id}`);
    });
    socket.on("join-customer", (orderNumber) => {
      socket.join(`order-${orderNumber}`);
      console.log(`[WebSocket] Customer joined tracking for order: ${orderNumber}`);
    });
    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
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
    getAddOns: publicProcedure.query(() => getAllAddOns())
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
            sizeId: z2.number(),
            quantity: z2.number(),
            itemPrice: z2.number(),
            addOnsData: z2.array(z2.any()).optional(),
            addOnsTotal: z2.number(),
            specialInstructions: z2.string().optional()
          })
        ),
        totalAmount: z2.number()
      })
    ).mutation(async ({ input }) => {
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
            sizeId: item.sizeId,
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
            message: "Payment gateway not configured"
          });
        }
        const amountInPaisa = Math.round(parseFloat(input.amount) * 100);
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaisa,
          currency: "INR",
          receipt: `order_${input.orderId}`,
          notes: {
            orderId: input.orderId,
            customerName: input.customerName
          }
        });
        return {
          razorpayOrderId: razorpayOrder.id,
          amount: amountInPaisa,
          currency: "INR",
          keyId: process.env.VITE_RAZORPAY_KEY_ID
        };
      } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment order"
        });
      }
    }),
    // Verify payment
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
        const crypto = await import("crypto");
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`).digest("hex");
        if (expectedSignature !== input.razorpaySignature) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Payment verification failed"
          });
        }
        await updateOrderPaymentStatus(input.orderId, "completed", input.razorpayPaymentId);
        emitOrderUpdate(input.orderId, {
          paymentStatus: "completed",
          razorpayPaymentId: input.razorpayPaymentId
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
    })
  }),
  // Admin procedures
  admin: router({
    getAllOrders: adminProcedure2.query(async () => {
      try {
        return await getAllOrders();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders"
        });
      }
    }),
    getOrdersByStatus: adminProcedure2.input(z2.object({ status: z2.string() })).query(async ({ input }) => {
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
    getOrderDetails: adminProcedure2.input(z2.object({ orderId: z2.number() })).query(async ({ input }) => {
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
    updateOrderStatus: adminProcedure2.input(
      z2.object({
        orderId: z2.number(),
        status: z2.enum(["pending", "confirmed", "ready", "completed", "cancelled"])
      })
    ).mutation(async ({ input, ctx }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError3({
            code: "NOT_FOUND",
            message: "Order not found"
          });
        }
        await updateOrderStatus(input.orderId, input.status, ctx.user?.id);
        emitOrderUpdate(input.orderId, {
          status: input.status,
          updatedAt: /* @__PURE__ */ new Date()
        });
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
    emptyOutDir: true
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
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
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
