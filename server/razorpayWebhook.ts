import crypto from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { emitNewOrder, emitOrderUpdate } from "./websocket";

/**
 * Razorpay Webhook Handler
 * 
 * This handles payment confirmations from Razorpay.
 * It's more reliable than client-side verification because:
 * 1. It works even if user closes browser after payment
 * 2. It's a server-to-server call
 * 3. It has signature verification for security
 * 
 * Webhook URL to set in Razorpay Dashboard:
 * https://your-domain.com/api/razorpay/webhook
 */

interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  description?: string;
  email?: string;
  contact?: string;
  notes?: {
    orderId?: string;
    customerName?: string;
  };
}

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: any;
    };
  };
  created_at: number;
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Register Razorpay webhook routes
 */
export function registerRazorpayWebhook(app: Express) {
  // Webhook endpoint - must use raw body for signature verification
  app.post(
    "/api/razorpay/webhook",
    // Use raw body parser for this route
    (req: Request, res: Response) => {
      handleWebhook(req, res);
    }
  );

  console.log("[Razorpay] Webhook endpoint registered at /api/razorpay/webhook");
}

async function handleWebhook(req: Request, res: Response) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // If no webhook secret is configured, skip signature verification (dev mode)
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"] as string;
      
      if (!signature) {
        console.warn("[Razorpay Webhook] No signature found in headers");
        return res.status(400).json({ error: "Missing signature" });
      }

      // Get raw body for signature verification
      const rawBody = JSON.stringify(req.body);
      
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.warn("[Razorpay Webhook] Invalid signature");
        return res.status(400).json({ error: "Invalid signature" });
      }
    } else {
      console.warn("[Razorpay Webhook] No webhook secret configured - skipping signature verification");
    }

    const payload = req.body as RazorpayWebhookPayload;
    
    console.log(`[Razorpay Webhook] Received event: ${payload.event}`);

    // Handle different webhook events
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

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: "ok" });
    
  } catch (error) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ status: "error", message: "Internal error but acknowledged" });
  }
}

/**
 * Handle payment.captured event
 * This is the most reliable event - called when payment is successful
 */
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment?.entity;
  
  if (!payment) {
    console.warn("[Razorpay Webhook] No payment entity in payload");
    return;
  }

  console.log(`[Razorpay Webhook] Payment captured: ${payment.id} for order ${payment.order_id}`);

  // Find order by razorpayOrderId
  const order = await db.getOrderByRazorpayOrderId(payment.order_id);
  
  if (!order) {
    console.warn(`[Razorpay Webhook] Order not found for razorpay_order_id: ${payment.order_id}`);
    return;
  }

  // Update payment status
  await db.updateOrderPaymentStatus(order.id, "completed", payment.id);
  
  // Also update the order status to confirmed (auto-confirm paid orders)
  await db.updateOrderStatusOnly(order.id, "confirmed");

  console.log(`[Razorpay Webhook] Order ${order.orderNumber} marked as PAID and CONFIRMED`);

  // Emit real-time update to admin panel
  emitNewOrder({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    status: "confirmed",
    paymentStatus: "completed",
    createdAt: order.createdAt,
  });

  emitOrderUpdate(order.id, {
    paymentStatus: "completed",
    status: "confirmed",
    razorpayPaymentId: payment.id,
  });
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment?.entity;
  
  if (!payment) return;

  console.log(`[Razorpay Webhook] Payment failed: ${payment.id} for order ${payment.order_id}`);

  const order = await db.getOrderByRazorpayOrderId(payment.order_id);
  
  if (!order) return;

  // Update payment status to failed
  await db.updateOrderPaymentStatus(order.id, "failed", payment.id);

  console.log(`[Razorpay Webhook] Order ${order.orderNumber} marked as FAILED`);

  emitOrderUpdate(order.id, {
    paymentStatus: "failed",
  });
}

/**
 * Handle order.paid event (backup event)
 */
async function handleOrderPaid(payload: RazorpayWebhookPayload) {
  const orderEntity = payload.payload.order?.entity;
  
  if (!orderEntity) return;

  console.log(`[Razorpay Webhook] Order paid event: ${orderEntity.id}`);

  const order = await db.getOrderByRazorpayOrderId(orderEntity.id);
  
  if (!order) return;

  // Only update if not already completed
  if (order.paymentStatus !== "completed") {
    await db.updateOrderPaymentStatus(order.id, "completed");
    await db.updateOrderStatusOnly(order.id, "confirmed");

    emitNewOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: "confirmed",
      paymentStatus: "completed",
      createdAt: order.createdAt,
    });
  }
}
