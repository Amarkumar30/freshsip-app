import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { emitOrderUpdate, emitNewOrder, emitOrderStatusChange } from "./websocket";
import Razorpay from "razorpay";

// Initialize Razorpay instance only if keys are provided
let razorpay: any = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Rate limiting for checkout - 5 orders per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

const getClientIP = (req: any): string => {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
         req.headers["x-real-ip"] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         "unknown";
};

const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, value] of entries) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }
  
  if (!record || now > record.resetTime) {
    // First request or window expired - reset
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  // Increment count
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetTime - now };
};

// Simple admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "sanjeet";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sanjeet@sau405";

// Simple admin auth procedure - validates adminToken header
const simpleAdminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminToken = ctx.req.headers["x-admin-token"] as string;
  
  if (!adminToken) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString());
    if (decoded.username !== ADMIN_USERNAME || decoded.password !== ADMIN_PASSWORD) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin credentials" });
    }
  } catch (e) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Invalid admin token" });
  }
  
  return next({ ctx });
});

// Legacy OAuth admin procedure (kept for compatibility)
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Menu procedures
  menu: router({
    getItems: publicProcedure.query(() => db.getAllMenuItems()),
    getSizes: publicProcedure.query(() => db.getAllSizes()),
    getAddOns: publicProcedure.query(() => db.getAllAddOns()),
    getItemPrices: publicProcedure.query(() => db.getMenuItemPrices()),
  }),

  // Order procedures
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string(),
          customerPhone: z.string().optional(),
          items: z.array(
            z.object({
              menuItemId: z.number(),
              menuItemName: z.string().optional(),
              sizeId: z.number(),
              sizeName: z.string().optional(),
              quantity: z.number(),
              itemPrice: z.number(),
              addOnsData: z.array(z.any()).optional(),
              addOnsTotal: z.number(),
              specialInstructions: z.string().optional(),
            })
          ),
          totalAmount: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Rate limit check
        const clientIP = getClientIP(ctx.req);
        const rateLimit = checkRateLimit(clientIP);
        
        if (!rateLimit.allowed) {
          const minutesLeft = Math.ceil(rateLimit.resetIn / 60000);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many orders. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          });
        }
        
        try {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          const orderNumber = `ORD-${timestamp}-${random}`;

          // Save order to database
          const savedOrder = await db.createOrder({
            orderNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            totalAmount: input.totalAmount.toFixed(2),
            userId: undefined,
          });

          // Get the created order ID
          if (!savedOrder) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create order",
            });
          }
          const orderId = savedOrder.id;

          // Emit new order event to admin panel
          if (savedOrder) {
            emitNewOrder({
              id: savedOrder.id,
              orderNumber: savedOrder.orderNumber,
              customerName: savedOrder.customerName,
              totalAmount: savedOrder.totalAmount,
              status: savedOrder.status,
              createdAt: savedOrder.createdAt,
            });
          }

          // Add order items
          for (const item of input.items) {
            await db.addOrderItem({
              orderId,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              sizeId: item.sizeId,
              sizeName: item.sizeName,
              quantity: item.quantity,
              itemPrice: item.itemPrice.toFixed(2),
              addOnsData: item.addOnsData,
              addOnsTotal: item.addOnsTotal.toFixed(2),
              specialInstructions: item.specialInstructions,
            });
          }

          if (!savedOrder) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve created order",
            });
          }

          return {
            success: true,
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
          };
        } catch (error) {
          console.error("Error creating order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order",
          });
        }
      }),

    getByNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        try {
          const order = await db.getOrderByNumber(input.orderNumber);
          if (!order) {
            return null;
          }

          const items = await db.getOrderItemsByOrderId(order.id);
          return {
            order,
            items,
          };
        } catch (error) {
          console.error("Error fetching order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch order",
          });
        }
      }),
  }),

  // Payment procedures
  payment: router({
    // Create Razorpay order
    createRazorpayOrder: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          amount: z.string(),
          customerName: z.string(),
          customerEmail: z.string().optional(),
          customerPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          if (!razorpay) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
            });
          }

          const amountInPaisa = Math.round(parseFloat(input.amount) * 100);

          const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaisa,
            currency: "INR",
            receipt: `order_${input.orderId}`,
            notes: {
              orderId: String(input.orderId),
              customerName: input.customerName,
            },
          });

          // Save the razorpay order ID to our database for webhook matching
          await db.updateOrderRazorpayId(input.orderId, razorpayOrder.id);

          console.log(`[Payment] Razorpay order created: ${razorpayOrder.id} for order ${input.orderId}`);

          return {
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaisa,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
          };
        } catch (error) {
          console.error("Error creating Razorpay order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create payment order",
          });
        }
      }),

    // Verify payment (client-side verification - backup to webhook)
    verifyPayment: publicProcedure
      .input(
        z.object({
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
          orderId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          if (!razorpay) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Payment gateway not configured",
            });
          }

          // Verify signature (fast - no I/O)
          const crypto = await import("crypto");
          const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
            .digest("hex");

          if (expectedSignature !== input.razorpaySignature) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment verification failed - invalid signature",
            });
          }

          // Update payment status and order status in parallel for speed
          await Promise.all([
            db.updateOrderPaymentStatus(input.orderId, "completed", input.razorpayPaymentId),
            db.updateOrderStatusOnly(input.orderId, "confirmed"),
          ]);

          console.log(`[Payment] Payment verified for order ${input.orderId}, payment ID: ${input.razorpayPaymentId}`);

          // Emit events in background (non-blocking)
          db.getOrderById(input.orderId).then(order => {
            if (order) {
              emitNewOrder({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                totalAmount: order.totalAmount,
                status: "confirmed",
                paymentStatus: "completed",
                createdAt: order.createdAt,
              });
              emitOrderUpdate(input.orderId, {
                paymentStatus: "completed",
                status: "confirmed",
                razorpayPaymentId: input.razorpayPaymentId,
              });
            }
          });

          return {
            success: true,
            message: "Payment verified successfully",
          };
        } catch (error) {
          console.error("Error verifying payment:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Payment verification failed",
          });
        }
      }),

    // Get payment status for an order
    getPaymentStatus: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        return {
          paymentStatus: order.paymentStatus,
          razorpayPaymentId: order.razorpayPaymentId,
        };
      }),
  }),

  // Admin procedures
  admin: router({
    // Verify admin credentials
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
          return {
            success: true,
            token: Buffer.from(JSON.stringify({ username: input.username, password: input.password })).toString('base64'),
          };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }),

    getAllOrders: simpleAdminProcedure.query(async () => {
      try {
        // Return all orders with items for admin panel
        return await db.getAllOrdersWithItems();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

    // Get all orders including unpaid (for debugging)
    getAllOrdersIncludingUnpaid: simpleAdminProcedure.query(async () => {
      try {
        return await db.getAllOrders();
      } catch (error) {
        console.error("Error fetching all orders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

    getOrdersByStatus: simpleAdminProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        try {
          return await db.getOrdersByStatus(input.status as any);
        } catch (error) {
          console.error("Error fetching orders by status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch orders",
          });
        }
      }),

    getOrderDetails: simpleAdminProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        try {
          const order = await db.getOrderById(input.orderId);
          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order not found",
            });
          }

          const items = await db.getOrderItemsByOrderId(input.orderId);
          const statusHistory = await db.getOrderStatusHistory(input.orderId);

          return {
            order,
            items,
            statusHistory,
          };
        } catch (error) {
          console.error("Error fetching order details:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch order details",
          });
        }
      }),

    updateOrderStatus: simpleAdminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "confirmed", "ready", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const order = await db.getOrderById(input.orderId);
          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order not found",
            });
          }

          // Update order status (this also records history)
          await db.updateOrderStatus(input.orderId, input.status);

          // Emit update event to admin panel and customer tracking
          emitOrderUpdate(input.orderId, {
            status: input.status,
            updatedAt: new Date(),
          });
          
          // Also emit status change for customer order tracking
          emitOrderStatusChange(order.orderNumber, input.status);

          return {
            success: true,
            message: `Order status updated to ${input.status}`,
          };
        } catch (error) {
          console.error("Error updating order status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update order status",
          });
        }
      }),
      
    // Analytics endpoints
    getMenuItems: simpleAdminProcedure.query(async () => {
      try {
        return await db.getAllMenuItems();
      } catch (error) {
        console.error("Error fetching menu items:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch menu items",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
