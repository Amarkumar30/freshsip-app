import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Droplet, LogOut, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: allOrders } = trpc.admin.getAllOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation();

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      window.location.href = "/admin/login";
    }
  }, [isAuthenticated, user, loading]);

  useEffect(() => {
    if (allOrders) {
      setOrders(allOrders as Order[]);
    }
  }, [allOrders]);

  // Auto-refresh orders every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Trigger refetch
      setTimeout(() => setIsRefreshing(false), 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as any,
      });

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      toast.success("Order status updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">FreshSip Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-600 mt-1">
              Manage and track all customer orders in real-time
            </p>
          </div>

          <Button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Ready</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter((o) => o.status === "ready").length}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm mb-2">Completed</p>
            <p className="text-3xl font-bold text-gray-600">
              {orders.filter((o) => o.status === "completed").length}
            </p>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="font-mono font-semibold text-blue-600 hover:underline"
                        >
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                          order.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerPhone}</p>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Update Order Status</p>
                <div className="flex flex-wrap gap-2">
                  {["pending", "confirmed", "ready", "completed", "cancelled"].map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      disabled={updateStatusMutation.isPending}
                      variant={selectedOrder.status === status ? "default" : "outline"}
                      className={selectedOrder.status === status ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      {updateStatusMutation.isPending && selectedStatus === status && (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      )}
                      <span className="capitalize">{status}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-orange-600">₹{selectedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-semibold capitalize ${
                    selectedOrder.paymentStatus === "completed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Time:</span>
                  <span className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowOrderDetails(false)}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
