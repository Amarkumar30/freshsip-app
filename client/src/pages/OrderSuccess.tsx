import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle, Droplet, Clock } from "lucide-react";

export default function OrderSuccess() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Get order details from URL params
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get("orderNumber") || "");
    setOrderId(params.get("orderId") || "");

    // Clear cart
    localStorage.removeItem("cart");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Droplet className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">FreshSip</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto animate-bounce" />
            </div>
          </div>

          {/* Success Message */}
          <Card className="p-12 text-center bg-white">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 mb-8">
              Thank you for your order. Your fresh juice will be ready soon.
            </p>

            {/* Order Number */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">Your Order Number</p>
              <p className="text-4xl font-bold text-orange-600 font-mono">
                {orderNumber}
              </p>
            </div>

            {/* Order Details */}
            <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Estimated Time</p>
                  <p className="text-gray-600">Your order will be ready in 10-15 minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Payment Status</p>
                  <p className="text-gray-600">Payment received successfully</p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Your order has been sent to the kitchen</li>
                <li>2. We'll prepare your fresh juice with care</li>
                <li>3. You'll be notified when it's ready for pickup</li>
                <li>4. Come pick up your order at the counter</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href={`/order-tracking?orderNumber=${orderNumber}`}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12">
                  Track Your Order
                </Button>
              </Link>

              <Link href="/menu">
                <Button variant="outline" className="w-full h-12">
                  Order More
                </Button>
              </Link>

              <Link href="/">
                <Button variant="ghost" className="w-full h-12">
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          {/* Support Info */}
          <div className="text-center mt-8 text-gray-600">
            <p>Need help? Contact us at support@freshsip.com or call +91-XXXX-XXXX</p>
          </div>
        </div>
      </main>
    </div>
  );
}
