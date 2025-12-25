import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface RealtimeOrderUpdate {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useRealtimeOrders() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newOrders, setNewOrders] = useState<RealtimeOrderUpdate[]>([]);
  const [updatedOrders, setUpdatedOrders] = useState<RealtimeOrderUpdate[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);
      // Join admin room
      newSocket.emit("join-admin", {});
    });

    newSocket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    // Listen for new orders
    newSocket.on("new-order", (data: RealtimeOrderUpdate) => {
      console.log("[WebSocket] New order received:", data);
      setNewOrders((prev) => [data, ...prev]);
    });

    // Listen for order updates
    newSocket.on("order-updated", (data: RealtimeOrderUpdate) => {
      console.log("[WebSocket] Order updated:", data);
      setUpdatedOrders((prev) => [data, ...prev]);
    });

    // Listen for refresh signal
    newSocket.on("refresh-orders", () => {
      console.log("[WebSocket] Refresh orders signal received");
      // Trigger a refresh in the component using this hook
    });

    newSocket.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinOrderTracking = useCallback(
    (orderNumber: string) => {
      if (socket) {
        socket.emit("join-customer", orderNumber);
      }
    },
    [socket]
  );

  const leaveOrderTracking = useCallback(
    (orderNumber: string) => {
      if (socket) {
        socket.emit("leave-customer", orderNumber);
      }
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    newOrders,
    updatedOrders,
    joinOrderTracking,
    leaveOrderTracking,
    clearNewOrders: () => setNewOrders([]),
    clearUpdatedOrders: () => setUpdatedOrders([]),
  };
}

export function useOrderTracking(orderNumber: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<{
    status: string;
    timestamp: Date;
  } | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection for customer tracking
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Customer connected");
      setIsConnected(true);
      // Join customer room for this order
      newSocket.emit("join-customer", orderNumber);
    });

    newSocket.on("disconnect", () => {
      console.log("[WebSocket] Customer disconnected");
      setIsConnected(false);
    });

    // Listen for status changes
    newSocket.on("status-changed", (data: { orderNumber: string; status: string; timestamp: Date }) => {
      if (data.orderNumber === orderNumber) {
        console.log("[WebSocket] Order status changed:", data);
        setStatusUpdate({
          status: data.status,
          timestamp: new Date(data.timestamp),
        });
      }
    });

    newSocket.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit("leave-customer", orderNumber);
        newSocket.disconnect();
      }
    };
  }, [orderNumber]);

  return {
    socket,
    isConnected,
    statusUpdate,
  };
}
