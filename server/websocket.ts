import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || 
    (process.env.NODE_ENV === 'production' 
      ? [] 
      : ["http://localhost:5173", "http://localhost:3000"]);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Add connection timeout
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Handle admin connections
  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    // Join admin room for order updates (with basic validation)
    socket.on("join-admin", (data) => {
      // In production, verify admin token from handshake auth
      if (process.env.NODE_ENV === 'production') {
        const adminToken = socket.handshake.auth?.adminToken;
        if (!adminToken) {
          console.warn(`[WebSocket] Unauthorized admin join attempt from ${socket.id}`);
          socket.emit("error", { message: "Admin authentication required" });
          return;
        }
      }
      socket.join("admin-room");
      console.log(`[WebSocket] ${socket.id} joined admin-room`);
    });

    // Join customer room for order tracking
    socket.on("join-customer", (orderNumber) => {
      // Validate order number format (ORD-timestamp-random format)
      if (typeof orderNumber !== 'string' || !orderNumber.match(/^ORD-\d+-\d+$/)) {
        console.warn(`[WebSocket] Invalid order number from ${socket.id}: ${orderNumber}`);
        return;
      }
      socket.join(`order-${orderNumber}`);
      console.log(`[WebSocket] ${socket.id} joined order-${orderNumber}`);
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
