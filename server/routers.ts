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

// Helper to check if user is admin
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
              sizeId: z.number(),
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
      .mutation(async ({ input }) => {
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
              sizeId: item.sizeId,
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
              message: "Payment gateway not configured",
            });
          }

          const amountInPaisa = Math.round(parseFloat(input.amount) * 100);

          const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaisa,
            currency: "INR",
            receipt: `order_${input.orderId}`,
            notes: {
              orderId: input.orderId,
              customerName: input.customerName,
            },
          });

          return {
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaisa,
            currency: "INR",
            keyId: process.env.VITE_RAZORPAY_KEY_ID,
          };
        } catch (error) {
          console.error("Error creating Razorpay order:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create payment order",
          });
        }
      }),

    // Verify payment
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

          // Verify signature
          const crypto = await import("crypto");
          const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
            .digest("hex");

          if (expectedSignature !== input.razorpaySignature) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment verification failed",
            });
          }

          // Update order payment status
          await db.updateOrderPaymentStatus(input.orderId, "completed", input.razorpayPaymentId);

          // Emit payment update event
          emitOrderUpdate(input.orderId, {
            paymentStatus: "completed",
            razorpayPaymentId: input.razorpayPaymentId,
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
  }),

  // Admin procedures
  admin: router({
    getAllOrders: adminProcedure.query(async () => {
      try {
        return await db.getAllOrders();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

    getOrdersByStatus: adminProcedure
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

    getOrderDetails: adminProcedure
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

    updateOrderStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "confirmed", "ready", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const order = await db.getOrderById(input.orderId);
          if (!order) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Order not found",
            });
          }

          // Update order status (this also records history)
          await db.updateOrderStatus(input.orderId, input.status, ctx.user?.id);

          // Emit update event to admin panel
          emitOrderUpdate(input.orderId, {
            status: input.status,
            updatedAt: new Date(),
          });

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
  }),
});

export type AppRouter = typeof appRouter;
