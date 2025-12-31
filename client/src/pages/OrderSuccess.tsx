import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, ChefHat, Package, Home } from "lucide-react";
import FreshSipLogo from "@/components/FreshSipLogo";

export default function OrderSuccess() {
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get("orderNumber") || "");
    setPaymentId(params.get("paymentId") || "");
    localStorage.removeItem("cart");
  }, []);

  // Fetch order details with auto-refresh every 5 seconds
  const { data: orderData } = trpc.orders.getByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber, refetchInterval: 5000 }
  );

  const status = orderData?.order?.status || "pending";

  const getStatusStep = (s: string) => {
    const steps = ["pending", "confirmed", "ready", "completed"];
    return steps.indexOf(s);
  };

  const currentStep = getStatusStep(status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <FreshSipLogo size="sm" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Order Placed!</h1>
          <p className="text-gray-500 mt-1">Payment successful</p>
        </div>

        {/* Order Number Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Order Number</p>
            <p className="text-3xl font-bold text-orange-600 font-mono">
              #{orderNumber.split('-').pop()}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">{orderNumber}</p>
          </div>

          {orderData?.order && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-gray-600">Total Paid</span>
              <span className="text-xl font-bold text-gray-900">
                ₹{parseFloat(orderData.order.totalAmount).toFixed(0)}
              </span>
            </div>
          )}
        </div>

        {/* Live Order Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Order Status</h2>
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-4">
            {/* Step 1: Pending */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${currentStep >= 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Order Received
                </p>
                <p className="text-sm text-gray-500">
                  {currentStep === 0 ? 'Waiting for confirmation...' : 'Done'}
                </p>
              </div>
              {currentStep === 0 && (
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Connector */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200"></div>

            {/* Step 2: Confirmed/Preparing */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Preparing
                </p>
                <p className="text-sm text-gray-500">
                  {currentStep === 1 ? 'Making your fresh juice...' : currentStep > 1 ? 'Done' : 'Waiting'}
                </p>
              </div>
              {currentStep === 1 && (
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Connector */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200"></div>

            {/* Step 3: Ready */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Ready for Pickup
                </p>
                <p className="text-sm text-gray-500">
                  {currentStep === 2 ? '🎉 Come pick up your order!' : currentStep > 2 ? 'Done' : 'Waiting'}
                </p>
              </div>
              {currentStep === 2 && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Connector */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200"></div>

            {/* Step 4: Completed */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Completed
                </p>
                <p className="text-sm text-gray-500">
                  {currentStep === 3 ? 'Thank you! Enjoy your drink 🍹' : 'Waiting'}
                </p>
              </div>
            </div>
          </div>

          {/* Ready Alert */}
          {status === "ready" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-lg font-bold text-green-700">🎉 Your order is ready!</p>
              <p className="text-sm text-green-600 mt-1">Please pick it up at the counter</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {orderData?.order && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900">{orderData.order.customerName}</span>
            </div>
            {orderData.order.customerPhone && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{orderData.order.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Order Time</span>
              <span className="text-gray-900">
                {new Date(orderData.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          <Link href="/menu">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base font-medium rounded-xl">
              Order More
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full h-12 rounded-xl">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Need help? <a href="mailto:support@qikcart.in" className="text-orange-500">support@qikcart.in</a>
        </p>
      </main>
    </div>
  );
}
