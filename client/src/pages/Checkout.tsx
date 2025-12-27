import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Droplet, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  menuItemId: number;
  menuItemName: string;
  sizeId: number;
  sizeName: string;
  quantity: number;
  itemPrice: number;
  addOnIds: number[];
  addOnNames: string[];
  addOnsTotal: number;
  specialInstructions?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderMutation = trpc.orders.create.useMutation();
  const createRazorpayOrderMutation = trpc.payment.createRazorpayOrder.useMutation();
  const verifyPaymentMutation = trpc.payment.verifyPayment.useMutation();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + (item.itemPrice + item.addOnsTotal) * item.quantity,
      0
    );
  };

  const handlePayment = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order in database
      const totalAmount = calculateTotal();
      const orderResponse = await createOrderMutation.mutateAsync({
        customerName,
        customerPhone,
        totalAmount,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          sizeId: item.sizeId,
          sizeName: item.sizeName,
          quantity: item.quantity,
          itemPrice: item.itemPrice,
          addOnsData: item.addOnIds.map((id, idx) => ({
            id,
            name: item.addOnNames[idx] || "",
            price: "0",
          })),
          addOnsTotal: item.addOnsTotal,
          specialInstructions: item.specialInstructions,
        })),
      });

      // Step 2: Create Razorpay order
      const razorpayResponse = await createRazorpayOrderMutation.mutateAsync({
        orderId: orderResponse.orderId,
        amount: totalAmount.toString(),
        customerName,
        customerPhone,
      });

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayResponse.keyId, // Get key from server response
        order_id: razorpayResponse.razorpayOrderId,
        amount: razorpayResponse.amount,
        currency: razorpayResponse.currency,
        name: "FreshSip Juice Bar",
        description: `Order #${orderResponse.orderNumber}`,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100&h=100&fit=crop",
        prefill: {
          name: customerName,
          // Use customer phone if provided, otherwise use store's number so user doesn't need to enter
          contact: customerPhone || "9999999999",
          email: "customer@freshsip.in",
        },
        // Hide contact input field since we prefill it
        readonly: {
          contact: true,
          email: true,
        },
        theme: {
          color: "#f97316", // Orange color to match brand
        },
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment on server
            await verifyPaymentMutation.mutateAsync({
              orderId: orderResponse.orderId,
              razorpayOrderId: razorpayResponse.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Clear cart
            localStorage.removeItem("cart");

            // Redirect to success page with payment details
            window.location.href = `/order-success?orderNumber=${orderResponse.orderNumber}&orderId=${orderResponse.orderId}&paymentId=${response.razorpay_payment_id}`;
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error("Payment cancelled. Your order has been saved - you can retry payment.");
          },
          confirm_close: true,
          escape: false,
        },
        notes: {
          orderNumber: orderResponse.orderNumber,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process order. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-32 md:pb-8">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-orange-100">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Customer Details */}
          <Card className="p-4 md:p-6 bg-white border-0 shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isProcessing}
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="For order updates"
                  maxLength={10}
                  disabled={isProcessing}
                  className="h-12 text-base rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-4 md:p-6 bg-white border-0 shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="divide-y divide-gray-100">
              {cart.map((item, index) => (
                <div key={index} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">{item.quantity}x</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.menuItemName}</p>
                    <p className="text-sm text-orange-600">{item.sizeName}</p>
                    {item.addOnNames.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">+ {item.addOnNames.join(", ")}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800">
                      ₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Info */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              💳 Payment via Razorpay (UPI, Cards, Net Banking)
            </p>
          </div>

          {/* Order Total - Desktop */}
          <Card className="p-4 md:p-6 bg-white border-0 shadow-md hidden md:block">
            <div className="flex justify-between items-center font-bold text-xl">
              <span>Total Amount</span>
              <span className="text-orange-600">₹{calculateTotal().toFixed(0)}</span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || cart.length === 0}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-14 text-lg font-semibold rounded-xl shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${calculateTotal().toFixed(0)}`
              )}
            </Button>
          </Card>
        </div>
      </main>

      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-100 p-4 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-orange-600">₹{calculateTotal().toFixed(0)}</span>
        </div>
        <Button
          onClick={handlePayment}
          disabled={isProcessing || cart.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 h-14 text-lg font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-transform"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </div>
  );
}
