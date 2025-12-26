import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Droplet, Clock, CreditCard, ArrowRight, Sparkles } from "lucide-react";

interface OrderDetails {
  order: {
    id: number;
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    totalAmount: string;
    status: string;
    paymentStatus: string;
    createdAt: Date;
  };
  items: Array<{
    id: number;
    menuItemId: number;
    sizeId: number;
    quantity: number;
    itemPrice: string;
    addOnsData?: any[];
    addOnsTotal?: string;
    specialInstructions?: string;
  }>;
}

export default function OrderSuccess() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    // Get order details from URL params
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get("orderNumber") || "");
    setOrderId(params.get("orderId") || "");
    setPaymentId(params.get("paymentId") || "");

    // Clear cart
    localStorage.removeItem("cart");
  }, []);

  // Fetch order details
  const { data: orderData } = trpc.orders.getByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-green-100">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">FreshSip</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl mx-auto">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <Card className="p-8 md:p-12 text-center bg-white border-0 shadow-xl rounded-3xl overflow-hidden relative">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Payment Successful! 🎉
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your order has been confirmed and is being prepared.
            </p>

            {/* Order Number - Main highlight */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-8 rounded-2xl mb-8 border border-green-100">
              <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide font-medium">Your Order Number</p>
              <p className="text-4xl md:text-5xl font-bold text-emerald-600 font-mono tracking-wider">
                {orderNumber.split('-').pop()}
              </p>
              <p className="text-xs text-gray-500 mt-2 font-mono">{orderNumber}</p>
            </div>

            {/* Payment & Order Info Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Payment Status */}
              <div className="bg-green-50 p-5 rounded-xl text-left border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Payment Status</p>
                    <p className="text-green-600 font-medium">✓ Paid Successfully</p>
                  </div>
                </div>
                {paymentId && (
                  <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                    ID: {paymentId}
                  </p>
                )}
              </div>

              {/* Estimated Time */}
              <div className="bg-amber-50 p-5 rounded-xl text-left border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Estimated Time</p>
                    <p className="text-amber-600 font-medium">10-15 minutes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Amount */}
            {orderData?.order && (
              <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order Amount</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{parseFloat(orderData.order.totalAmount).toFixed(0)}
                  </span>
                </div>
                {orderData.order.customerName && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">Customer</span>
                    <span className="text-gray-700">{orderData.order.customerName}</span>
                  </div>
                )}
              </div>
            )}

            {/* What's Next - Timeline */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8 text-left">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="text-xl">📋</span> What's Next?
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">Order Confirmed</p>
                    <p className="text-sm text-gray-600">Payment received successfully</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-lg">🍹</span>
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">Being Prepared</p>
                    <p className="text-sm text-gray-600">Our team is making your fresh juice</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">3</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Ready for Pickup</p>
                    <p className="text-sm text-gray-400">You'll be notified when it's ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href={`/order-tracking?orderNumber=${orderNumber}`}>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-14 text-lg font-semibold rounded-xl shadow-lg">
                  Track Your Order
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="/menu">
                <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                  Order More Juices
                </Button>
              </Link>

              <Link href="/">
                <Button variant="ghost" className="w-full h-12 text-gray-500">
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          {/* Support Info */}
          <div className="text-center mt-8 p-4 bg-white/50 rounded-xl">
            <p className="text-gray-600 text-sm">
              Need help? Contact us at{" "}
              <a href="mailto:support@qikcart.in" className="text-orange-600 hover:underline font-medium">
                support@qikcart.in
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
