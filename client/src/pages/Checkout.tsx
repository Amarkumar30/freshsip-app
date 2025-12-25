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

    if (!customerPhone.trim()) {
      toast.error("Please enter your phone number");
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
          sizeId: item.sizeId,
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
        key: process.env.VITE_RAZORPAY_KEY_ID || "",
        order_id: razorpayResponse.razorpayOrderId,
        amount: razorpayResponse.amount,
        currency: razorpayResponse.currency,
        name: "FreshSip Juice Bar",
        description: `Order #${orderResponse.orderNumber}`,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment
            await verifyPaymentMutation.mutateAsync({
              orderId: orderResponse.orderId,
              razorpayOrderId: razorpayResponse.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Clear cart
            localStorage.removeItem("cart");

            // Redirect to success page
            window.location.href = `/order-success?orderNumber=${orderResponse.orderNumber}&orderId=${orderResponse.orderId}`;
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error("Payment cancelled");
          },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/menu">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">FreshSip</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Checkout</h2>

              {/* Customer Details */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your 10-digit phone number"
                    maxLength={10}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-4 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.menuItemName}</p>
                        <p className="text-sm text-gray-600">{item.sizeName}</p>
                        {item.addOnNames.length > 0 && (
                          <p className="text-xs text-gray-500">+{item.addOnNames.join(", ")}</p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 italic">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-semibold">
                          ₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💳 <strong>Payment Method:</strong> Razorpay will redirect you to your preferred UPI app
                </p>
              </div>
            </Card>
          </div>

          {/* Order Total */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6 bg-white">
              <h3 className="text-xl font-bold mb-6">Order Total</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay with Razorpay"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure payment powered by Razorpay
              </p>

              <Link href="/menu">
                <Button variant="outline" className="w-full mt-3">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
