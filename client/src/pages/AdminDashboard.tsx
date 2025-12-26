import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Droplet,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle,
  Loader2,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  Phone,
  Package,
  Coffee,
  Bell,
  ArrowRight,
  Timer,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItemWithDetails {
  id: number;
  menuItemId: number;
  sizeId: number;
  quantity: number;
  itemPrice: string;
  addOnsData?: any;
  addOnsTotal?: string;
  specialInstructions?: string;
  menuItemName?: string;
  sizeName?: string;
}

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
  items?: OrderItemWithDetails[];
}

interface OrderItem {
  id: number;
  menuItemId: number;
  sizeId: number;
  quantity: number;
  itemPrice: string;
  addOnsData?: any;
  addOnsTotal?: string;
  specialInstructions?: string;
}

// Get admin token from localStorage
const getAdminToken = () => {
  try {
    const auth = localStorage.getItem("adminAuth");
    if (auth) {
      const parsed = JSON.parse(auth);
      if (parsed.isAuthenticated) {
        return btoa(JSON.stringify({
          username: parsed.username,
          password: "sanjeet@sau405"
        }));
      }
    }
  } catch (e) {
    console.error("Error getting admin token:", e);
  }
  return null;
};

// Check if admin is authenticated
const isAdminAuthenticated = () => {
  try {
    const auth = localStorage.getItem("adminAuth");
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed.isAuthenticated === true;
    }
  } catch (e) {
    // ignore
  }
  return false;
};

export default function AdminDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "all" | "completed" | "analytics">("queue");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Use tRPC hooks
  const { data: orders = [], refetch: refetchOrders } = trpc.admin.getAllOrders.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: orderDetailsData, refetch: refetchOrderDetails } = trpc.admin.getOrderDetails.useQuery(
    { orderId: selectedOrder?.id || 0 },
    { enabled: !!selectedOrder?.id && showOrderDetails }
  );

  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
    },
  });

  // Check authentication on mount
  useEffect(() => {
    if (isAdminAuthenticated()) {
      setIsAuthenticated(true);
    } else {
      window.location.href = "/admin/login";
    }
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    toast.success("Logged out successfully");
    window.location.href = "/admin/login";
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as any,
      });

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Show toast based on status
      if (newStatus === "ready") {
        toast.success("🔔 Order marked as READY! Customer notified.", {
          duration: 3000,
        });
      } else if (newStatus === "completed") {
        toast.success("Order completed! 🎉");
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <PlayCircle className="w-4 h-4" />;
      case "ready":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <Package className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((currentTime.getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Get order items from the query
  const orderItems = orderDetailsData?.items || [];

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order: Order) => {
    if (activeTab === "queue") {
      return ["pending", "confirmed"].includes(order.status);
    } else if (activeTab === "completed") {
      return ["ready", "completed"].includes(order.status);
    }
    return true;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === "pending").length,
    confirmed: orders.filter((o: Order) => o.status === "confirmed").length,
    ready: orders.filter((o: Order) => o.status === "ready").length,
    completed: orders.filter((o: Order) => o.status === "completed").length,
    todayRevenue: orders
      .filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      })
      .reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0),
    todayOrders: orders.filter((o: Order) => {
      const orderDate = new Date(o.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length,
  };

  // Analytics calculations
  const getWeeklyStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter((o: Order) => new Date(o.createdAt) >= oneWeekAgo);
    const weekRevenue = weekOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0);
    
    // Daily breakdown for the week
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOrders = orders.filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });
      const dayRevenue = dayOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0);
      dailyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: dayRevenue,
      });
    }
    
    return { weekOrders: weekOrders.length, weekRevenue, dailyData };
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
    const monthOrders = orders.filter((o: Order) => new Date(o.createdAt) >= oneMonthAgo);
    const monthRevenue = monthOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0);
    
    // Weekly breakdown for the month
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(oneMonthAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekOrders = orders.filter((o: Order) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= weekStart && orderDate < weekEnd;
      });
      const weekRevenue = weekOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0);
      weeklyData.push({
        week: `Week ${i + 1}`,
        range: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        orders: weekOrders.length,
        revenue: weekRevenue,
      });
    }
    
    return { monthOrders: monthOrders.length, monthRevenue, weeklyData };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FreshSip Admin</h1>
                <p className="text-xs text-gray-500">Shop Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-700">Live</span>
              </div>

              {/* Time */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsRefreshing(true);
                  refetchOrders().then(() => setIsRefreshing(false));
                }}
                disabled={isRefreshing}
                size="sm"
                variant="outline"
                className="hidden sm:flex"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Today's Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">₹{stats.todayRevenue.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-orange-100 text-xs mt-2">{stats.todayOrders} orders today</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">In Queue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                  {stats.pending + stats.confirmed}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <ChefHat className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2">{stats.pending} pending, {stats.confirmed} preparing</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ready</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{stats.ready}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2">Waiting for pickup</p>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2">{stats.completed} completed</p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === "queue"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            🔥 Queue ({stats.pending + stats.confirmed})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === "all"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            📋 All Orders ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === "completed"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            ✅ Ready/Done ({stats.ready + stats.completed})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === "analytics"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Analytics View */}
        {activeTab === "analytics" ? (
          <div className="space-y-6">
            {/* Weekly Stats */}
            <Card className="p-6 bg-white border-0 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📅 This Week's Performance
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white">
                  <p className="text-blue-100 text-sm">Weekly Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹{weeklyStats.weekRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl text-white">
                  <p className="text-purple-100 text-sm">Weekly Orders</p>
                  <p className="text-3xl font-bold mt-1">{weeklyStats.weekOrders}</p>
                </div>
              </div>
              
              {/* Daily Breakdown */}
              <h4 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
              <div className="space-y-2">
                {weeklyStats.dailyData.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-16 text-center">
                      <p className="font-bold text-gray-900">{day.day}</p>
                      <p className="text-xs text-gray-500">{day.date}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${weeklyStats.weekRevenue > 0 ? (day.revenue / weeklyStats.weekRevenue) * 100 : 0}%`,
                            minWidth: day.revenue > 0 ? '8px' : '0'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-gray-900">₹{day.revenue.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">{day.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Monthly Stats */}
            <Card className="p-6 bg-white border-0 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📆 This Month's Performance
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl text-white">
                  <p className="text-emerald-100 text-sm">Monthly Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹{monthlyStats.monthRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-xl text-white">
                  <p className="text-orange-100 text-sm">Monthly Orders</p>
                  <p className="text-3xl font-bold mt-1">{monthlyStats.monthOrders}</p>
                </div>
              </div>
              
              {/* Weekly Breakdown */}
              <h4 className="font-semibold text-gray-700 mb-3">Weekly Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {monthlyStats.weeklyData.map((week, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="font-bold text-gray-900">{week.week}</p>
                    <p className="text-xs text-gray-500 mb-2">{week.range}</p>
                    <p className="text-xl font-bold text-orange-600">₹{week.revenue.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">{week.orders} orders</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Stats Summary */}
            <Card className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white border-0 shadow-lg">
              <h3 className="text-lg font-bold mb-4">📈 Quick Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Avg Order Value</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{stats.total > 0 ? (orders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0) / stats.total).toFixed(0) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{orders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount), 0).toFixed(0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <>
        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No orders in this category</p>
            <p className="text-gray-400 text-sm mt-1">New orders will appear here automatically</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order: Order) => (
              <Card
                key={order.id}
                className={`p-4 border-2 transition-all hover:shadow-lg cursor-pointer ${
                  order.status === "pending"
                    ? "border-amber-300 bg-amber-50/50"
                    : order.status === "ready"
                    ? "border-emerald-300 bg-emerald-50/50 animate-pulse"
                    : "border-slate-200 bg-white"
                }`}
                onClick={() => {
                  setSelectedOrder(order as Order);
                  setShowOrderDetails(true);
                }}
              >
                {/* 🧃 JUICE ORDER - Most Important! */}
                {order.items && order.items.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 -m-4 mb-3 p-3 rounded-t-lg">
                    <div className="text-white">
                      {order.items.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 flex-shrink-0" />
                            <span className="font-bold text-lg">
                              {item.quantity}x {item.menuItemName || `Item #${item.menuItemId}`}
                            </span>
                            <span className="text-orange-100 text-sm font-normal">
                              ({item.sizeName || 'Regular'})
                            </span>
                          </div>
                          {/* Show Add-ons */}
                          {item.addOnsData && Array.isArray(item.addOnsData) && item.addOnsData.length > 0 && (
                            <p className="text-orange-100 text-sm ml-7">
                              + {item.addOnsData.map((addon: any) => addon.name).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-bold text-sm text-gray-600">{order.orderNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Timer className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{getTimeSince(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {order.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{order.customerName}</p>
                    {order.customerPhone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600 text-lg">₹{parseFloat(order.totalAmount).toFixed(0)}</p>
                    {order.paymentStatus === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        PAID
                      </span>
                    ) : order.paymentStatus === "failed" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, "confirmed");
                      }}
                      size="sm"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {order.status === "confirmed" && (
                    <Button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, "ready");
                      }}
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, "completed");
                      }}
                      size="sm"
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedOrder(order as Order);
                      setShowOrderDetails(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="px-3"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">{selectedOrder?.orderNumber}</span>
              {selectedOrder && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedOrder.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                  {selectedOrder.customerPhone && (
                    <a
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="text-sm text-blue-600 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedOrder.customerPhone}
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">₹{selectedOrder.totalAmount}</p>
                  <p className={`text-sm font-medium ${
                    selectedOrder.paymentStatus === "completed" ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {selectedOrder.paymentStatus === "completed" ? "✓ Paid Online" : "Cash on Delivery"}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                  {orderItems.length > 0 ? (
                    orderItems.map((item: OrderItem, idx: number) => (
                      <div key={item.id || idx} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {(item as OrderItemWithDetails).menuItemName || `Item #${item.menuItemId}`}
                              <span className="text-gray-500 text-sm ml-2">
                                ({(item as OrderItemWithDetails).sizeName || 'Regular'})
                              </span>
                            </p>
                            {/* Add-ons */}
                            {item.addOnsData && Array.isArray(item.addOnsData) && item.addOnsData.length > 0 && (
                              <p className="text-xs text-orange-600">
                                + {item.addOnsData.map((addon: any) => addon.name).filter(Boolean).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-xs text-gray-500 italic">"{item.specialInstructions}"</p>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.itemPrice}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">Loading items...</p>
                  )}
                </div>
              </div>

              {/* Order Time */}
              <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                <span>Order placed</span>
                <span className="font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "pending")}
                    disabled={selectedOrder.status === "pending"}
                    variant={selectedOrder.status === "pending" ? "default" : "outline"}
                    className={selectedOrder.status === "pending" ? "bg-amber-500" : ""}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "confirmed")}
                    disabled={selectedOrder.status === "confirmed"}
                    variant={selectedOrder.status === "confirmed" ? "default" : "outline"}
                    className={selectedOrder.status === "confirmed" ? "bg-blue-500" : ""}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Preparing
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "ready")}
                    disabled={selectedOrder.status === "ready"}
                    variant={selectedOrder.status === "ready" ? "default" : "outline"}
                    className={selectedOrder.status === "ready" ? "bg-emerald-500" : ""}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                    disabled={selectedOrder.status === "completed"}
                    variant={selectedOrder.status === "completed" ? "default" : "outline"}
                    className={selectedOrder.status === "completed" ? "bg-gray-600" : ""}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Completed
                  </Button>
                </div>

                <Button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                  variant="outline"
                  className="w-full mt-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowOrderDetails(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
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
