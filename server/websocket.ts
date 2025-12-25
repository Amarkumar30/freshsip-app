import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
      methods: ["GET", "POST"],
    },
  });

  // Handle admin connections
  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join admin room for order updates
    socket.on("join-admin", (data) => {
      socket.join("admin-room");
      console.log(`[WebSocket] Admin joined: ${socket.id}`);
    });

    // Join customer room for order tracking
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

export function getIO() {
  return io;
}

/**
 * Emit order status update to admin panel
 */
export function emitOrderUpdate(orderId: number, orderData: any) {
  if (io) {
    io.to("admin-room").emit("order-updated", {
      orderId,
      ...orderData,
      timestamp: new Date(),
    });
  }
}

/**
 * Emit order status change to customer tracking page
 */
export function emitOrderStatusChange(orderNumber: string, status: string) {
  if (io) {
    io.to(`order-${orderNumber}`).emit("status-changed", {
      orderNumber,
      status,
      timestamp: new Date(),
    });
  }
}

/**
 * Broadcast new order to admin panel
 */
export function emitNewOrder(orderData: any) {
  if (io) {
    io.to("admin-room").emit("new-order", {
      ...orderData,
      timestamp: new Date(),
    });
  }
}

/**
 * Broadcast order list refresh to admin panel
 */
export function emitOrderListRefresh() {
  if (io) {
    io.to("admin-room").emit("refresh-orders");
  }
}
