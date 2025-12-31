import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import FreshSipLogo from "@/components/FreshSipLogo";
import { toast } from "sonner";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: orderData, refetch } = trpc.orders.getByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  useEffect(() => {
    // Get order number from URL params
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get("orderNumber");
    if (orderNum) {
      setOrderNumber(orderNum);
      setSearchInput(orderNum);
    }
  }, []);

  // Auto-refresh order status every 5 seconds
  useEffect(() => {
    if (!orderNumber) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderNumber, refetch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchInput.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setIsLoading(true);
    setOrderNumber(searchInput.trim());
    setIsLoading(false);
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
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order is being prepared";
      case "confirmed":
        return "Your order has been confirmed and is being prepared";
      case "ready":
        return "🎉 Your order is ready! Please come pick it up";
      case "completed":
        return "Thank you for your order!";
      case "cancelled":
        return "Your order has been cancelled";
      default:
        return "Tracking your order...";
    }
  };

  const statusSteps = ["pending", "confirmed", "ready", "completed"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <FreshSipLogo size="md" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Section */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Track Your Order</h2>

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter your order number (e.g., ORD-1234567890-123)"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </form>
          </Card>

          {/* Order Details */}
          {orderData && (
            <>
              {/* Status Card */}
              <Card className="p-8 mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Number</p>
                    <p className="text-3xl font-bold text-orange-600 font-mono">
                      {orderData.order.orderNumber}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 font-semibold ${getStatusColor(orderData.order.status)}`}>
                    {getStatusIcon(orderData.order.status)}
                    <span className="capitalize">{orderData.order.status}</span>
                  </div>
                </div>

                <p className="text-lg text-gray-700 font-medium">
                  {getStatusMessage(orderData.order.status)}
                </p>
              </Card>

              {/* Status Timeline */}
              <Card className="p-8 mb-8">
                <h3 className="text-lg font-semibold mb-6">Order Progress</h3>

                <div className="space-y-4">
                  {statusSteps.map((step, index) => {
                    const isCompleted = statusSteps.indexOf(orderData.order.status) >= index;
                    const isCurrent = orderData.order.status === step;

                    return (
                      <div key={step} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          } ${isCurrent ? "ring-4 ring-orange-300" : ""}`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold capitalize ${isCompleted ? "text-gray-900" : "text-gray-600"}`}>
                            {step === "pending" && "Order Received"}
                            {step === "confirmed" && "Order Confirmed"}
                            {step === "ready" && "Order Ready"}
                            {step === "completed" && "Order Completed"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isCurrent && "Currently processing..."}
                            {isCompleted && step !== orderData.order.status && "Completed"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Order Items */}
              <Card className="p-8 mb-8">
                <h3 className="text-lg font-semibold mb-6">Order Items</h3>

                <div className="space-y-4">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.menuItemId} (Size: {item.sizeId})
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          {item.addOnsData && item.addOnsData.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Add-ons: {(item.addOnsData as any).map((a: any) => a.name).join(", ")}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-xs text-gray-500 italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₹{(parseFloat(item.itemPrice) + parseFloat(item.addOnsTotal || "0")).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-orange-600">
                    ₹{orderData.order.totalAmount}
                  </span>
                </div>
              </Card>

              {/* Order Info */}
              <Card className="p-8 mb-8">
                <h3 className="text-lg font-semibold mb-4">Order Information</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Name:</span>
                    <span className="font-medium">{orderData.order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{orderData.order.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`font-medium capitalize ${
                      orderData.order.paymentStatus === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}>
                      {orderData.order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Time:</span>
                    <span className="font-medium">
                      {new Date(orderData.order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Ready Notification */}
              {orderData.order.status === "ready" && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center mb-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">Order Ready!</h3>
                  <p className="text-green-800">
                    Your fresh juice is ready for pickup at the counter. Please come collect your order.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="flex-1"
                >
                  Refresh Status
                </Button>
                <Link href="/menu">
                  <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                    Order More
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* No Order Found */}
          {orderNumber && !isLoading && !orderData && (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find an order with number "{orderNumber}". Please check the order number and try again.
              </p>
              <Link href="/">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Back to Home
                </Button>
              </Link>
            </Card>
          )}

          {/* Initial State */}
          {!orderNumber && (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Order Number</h3>
              <p className="text-gray-600">
                Enter your order number above to track your order in real-time
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
