import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, User, Phone, CheckCircle2 } from "lucide-react";
import FreshSipLogo from "@/components/FreshSipLogo";
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

// Interface for pending payment tracking
interface PendingPayment {
  orderId: number;
  orderNumber: string;
  razorpayOrderId: string;
  timestamp: number;
}

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const paymentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createOrderMutation = trpc.orders.create.useMutation();
  const createRazorpayOrderMutation = trpc.payment.createRazorpayOrder.useMutation();
  const verifyPaymentMutation = trpc.payment.verifyPayment.useMutation();
  const trpcUtils = trpc.useUtils();

  // Save pending payment to localStorage for recovery
  const savePendingPayment = useCallback((orderId: number, orderNumber: string, razorpayOrderId: string) => {
    const pendingPayment: PendingPayment = {
      orderId,
      orderNumber,
      razorpayOrderId,
      timestamp: Date.now(),
    };
    localStorage.setItem("pendingPayment", JSON.stringify(pendingPayment));
  }, []);

  // Clear pending payment from localStorage
  const clearPendingPayment = useCallback(() => {
    localStorage.removeItem("pendingPayment");
  }, []);

  // Check for pending payment on mount (handles browser close/refresh during payment)
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingStr = localStorage.getItem("pendingPayment");
      if (!pendingStr) return;

      try {
        const pending: PendingPayment = JSON.parse(pendingStr);
        
        // Only check if payment is recent (within last 10 minutes)
        const age = Date.now() - pending.timestamp;
        if (age > 10 * 60 * 1000) {
          clearPendingPayment();
          return;
        }

        // Check payment status
        toast.loading("Checking previous payment...", { id: "pending-check" });
        const result = await trpcUtils.payment.getPaymentStatus.fetch({ orderId: pending.orderId });
        
        if (result.paymentStatus === "completed") {
          toast.success("Payment completed!", { id: "pending-check" });
          clearPendingPayment();
          localStorage.removeItem("cart");
          window.location.replace(`/order-success?orderNumber=${pending.orderNumber}&orderId=${pending.orderId}`);
        } else {
          toast.dismiss("pending-check");
        }
      } catch (e) {
        console.error("Error checking pending payment:", e);
        toast.dismiss("pending-check");
      }
    };

    checkPendingPayment();
  }, [clearPendingPayment, trpcUtils.payment.getPaymentStatus]);

  // Function to check payment status and redirect if successful
  // This handles the case where UPI app returns but handler doesn't fire
  const checkPaymentStatusAndRedirect = useCallback(async (orderId: number, orderNumber: string, razorpayOrderId: string, isModalDismiss: boolean = false) => {
    setCheckingPayment(true);
    
    // For UPI apps (GPay, PhonePe), give webhook more time to process
    if (isModalDismiss) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    toast.loading("Verifying payment...", { id: "payment-check" });
    
    let attempts = 0;
    const maxAttempts = 15; // Check for up to 45 seconds (3s intervals - faster polling)
    
    const checkStatus = async (): Promise<boolean> => {
      try {
        // Force fresh fetch, bypass cache
        const result = await trpcUtils.payment.getPaymentStatus.fetch(
          { orderId },
          { staleTime: 0 }
        );
        console.log(`[Payment Check] Attempt ${attempts + 1}: Status = ${result.paymentStatus}`);
        if (result.paymentStatus === "completed") {
          return true;
        }
      } catch (e) {
        console.error("Error checking payment status:", e);
      }
      return false;
    };
    
    // First immediate check
    if (await checkStatus()) {
      clearPendingPayment();
      toast.success("Payment successful! Redirecting...", { id: "payment-check" });
      localStorage.removeItem("cart");
      // Immediate redirect for faster UX
      window.location.replace(`/order-success?orderNumber=${orderNumber}&orderId=${orderId}`);
      return;
    }
    
    // Poll with faster intervals (3 seconds instead of 5)
    const pollInterval = setInterval(async () => {
      attempts++;
      
      if (await checkStatus()) {
        clearInterval(pollInterval);
        clearPendingPayment();
        toast.success("Payment successful! Redirecting...", { id: "payment-check" });
        localStorage.removeItem("cart");
        // Immediate redirect
        window.location.replace(`/order-success?orderNumber=${orderNumber}&orderId=${orderId}`);
        return;
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setCheckingPayment(false);
        setIsProcessing(false);
        toast.dismiss("payment-check");
        
        // Provide helpful message with order tracking link
        toast.error(
          <div>
            <p>Unable to confirm payment.</p>
            <p className="text-sm mt-1">If you paid, your order #{orderNumber.split('-').pop()} will be processed.</p>
            <a href={`/order-tracking/${orderNumber}`} className="text-orange-500 underline text-sm mt-2 block">
              Track Order Status →
            </a>
          </div>,
          { duration: 15000 }
        );
      }
    }, 3000); // 3 second intervals instead of 5
  }, [clearPendingPayment, trpcUtils.payment.getPaymentStatus]);

  // Handle visibility change - detect when user returns from UPI app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // User returned to the page (possibly from UPI app)
        const pendingStr = localStorage.getItem("pendingPayment");
        if (pendingStr && isProcessing) {
          console.log("[Visibility] User returned, checking payment status...");
          try {
            const pending: PendingPayment = JSON.parse(pendingStr);
            // Quick check on visibility change
            const result = await trpcUtils.payment.getPaymentStatus.fetch(
              { orderId: pending.orderId },
              { staleTime: 0 }
            );
            
            if (result.paymentStatus === "completed") {
              console.log("[Visibility] Payment confirmed on return!");
              clearPendingPayment();
              localStorage.removeItem("cart");
              toast.success("Payment successful! Redirecting...", { id: "payment-check" });
              window.location.replace(`/order-success?orderNumber=${pending.orderNumber}&orderId=${pending.orderId}`);
            }
          } catch (e) {
            console.error("[Visibility] Error checking payment:", e);
          }
        }
      }
    };

    // Also handle focus event (backup for some mobile browsers)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    // pageshow event for Safari/iOS
    window.addEventListener('pageshow', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [isProcessing, clearPendingPayment, trpcUtils.payment.getPaymentStatus]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load saved customer info for returning customers
    const savedName = localStorage.getItem("customerName");
    const savedPhone = localStorage.getItem("customerPhone");
    if (savedName) setCustomerName(savedName);
    if (savedPhone) setCustomerPhone(savedPhone);

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Validate phone number (Indian 10-digit)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  // Handle phone input with validation
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setCustomerPhone(cleaned);
    
    if (cleaned.length === 10) {
      if (!validatePhone(cleaned)) {
        setPhoneError("Enter a valid Indian mobile number");
      } else {
        setPhoneError("");
      }
    } else if (cleaned.length > 0) {
      setPhoneError("");
    }
  };

  // Handle name input
  const handleNameChange = (value: string) => {
    setCustomerName(value);
    if (value.trim().length >= 2) {
      setNameError("");
    }
  };

  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + (item.itemPrice + item.addOnsTotal) * item.quantity,
      0
    );
  };

  const handlePayment = async () => {
    // Validate name
    if (!customerName.trim() || customerName.trim().length < 2) {
      setNameError("Please enter your name");
      nameInputRef.current?.focus();
      return;
    }

    // Validate phone (mandatory)
    if (!customerPhone || !validatePhone(customerPhone)) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      phoneInputRef.current?.focus();
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Save customer info for next time
    localStorage.setItem("customerName", customerName.trim());
    localStorage.setItem("customerPhone", customerPhone);

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

      // Save pending payment for recovery
      savePendingPayment(orderResponse.orderId, orderResponse.orderNumber, razorpayResponse.razorpayOrderId);

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayResponse.keyId,
        order_id: razorpayResponse.razorpayOrderId,
        amount: razorpayResponse.amount,
        currency: razorpayResponse.currency,
        name: "FreshSip",
        description: `Order #${orderResponse.orderNumber}`,
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=100&h=100&fit=crop",
        // Prefill with validated customer info
        prefill: {
          name: customerName.trim(),
          contact: customerPhone,
        },
        // Make contact readonly since we've already collected it
        readonly: {
          contact: true,
          email: true,
        },
        // Hide email field completely
        hidden: {
          email: true,
        },
        theme: {
          color: "#f97316",
          backdrop_color: "rgba(0,0,0,0.6)",
        },
        config: {
          display: {
            // Show UPI apps prominently, hide contact section until user scrolls
            blocks: {
              banks: {
                name: "Pay via UPI",
                instruments: [
                  { method: "upi", flows: ["qr", "collect", "intent"] }
                ],
              },
            },
            sequence: ["block.banks"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async (response: any) => {
          // Payment successful - this is the ideal path
          console.log("Payment handler called - payment successful");
          
          // Clear pending payment tracking
          clearPendingPayment();
          localStorage.removeItem("cart");
          
          // Show immediate success feedback
          toast.success("Payment successful! Redirecting...", { duration: 2000 });
          
          // Verify in background (non-blocking for better UX)
          verifyPaymentMutation.mutate({
            orderId: orderResponse.orderId,
            razorpayOrderId: razorpayResponse.razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          
          // Redirect immediately with replace (more reliable on mobile)
          const successUrl = `/order-success?orderNumber=${orderResponse.orderNumber}&orderId=${orderResponse.orderId}&paymentId=${response.razorpay_payment_id}`;
          
          // Small delay to ensure toast is visible, then redirect
          setTimeout(() => {
            window.location.replace(successUrl);
          }, 800);
        },
        modal: {
          ondismiss: () => {
            // Modal dismissed - could be user cancellation OR return from UPI app
            console.log("Razorpay modal dismissed");
            
            // Important: Check if payment was actually made before showing error
            // This is crucial for UPI intent flow where modal closes when switching to UPI app
            checkPaymentStatusAndRedirect(
              orderResponse.orderId,
              orderResponse.orderNumber,
              razorpayResponse.razorpayOrderId,
              true // isModalDismiss flag
            );
          },
          confirm_close: false, // Don't ask for confirmation
          escape: false, // Prevent accidental ESC key close
          backdropclose: false, // Prevent backdrop click close
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
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
          </Link>
          <FreshSipLogo size="sm" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    ref={nameInputRef}
                    type="text"
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isProcessing}
                    className={`h-12 pl-11 text-base rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400 transition-all ${
                      nameError ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""
                    } ${customerName.trim().length >= 2 ? "border-green-400 pr-10" : ""}`}
                  />
                  {customerName.trim().length >= 2 && !nameError && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {nameError && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    disabled={isProcessing}
                    className={`h-12 pl-[4.5rem] text-base rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400 transition-all ${
                      phoneError ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""
                    } ${validatePhone(customerPhone) ? "border-green-400 pr-10" : ""}`}
                  />
                  {validatePhone(customerPhone) && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {phoneError ? (
                  <p className="mt-1.5 text-sm text-red-500">{phoneError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-400">For order updates & payment</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="divide-y divide-gray-100">
              {cart.map((item, index) => (
                <div key={index} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">{item.quantity}x</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.menuItemName}</p>
                    <p className="text-sm text-orange-600">{item.sizeName}</p>
                    {item.addOnNames.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">+ {item.addOnNames.join(", ")}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">
                      ₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Payment Info */}
          <div className="flex items-center justify-center gap-2 py-3">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500">Secured by</span>
            <span className="text-xs font-semibold text-gray-700">Razorpay</span>
            <span className="text-xs text-gray-400">• UPI, Cards, Netbanking</span>
          </div>

          {/* Order Total - Desktop */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hidden md:block">
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-gray-600">Total</span>
              <span className="text-gray-900">₹{calculateTotal().toFixed(0)}</span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || checkingPayment || cart.length === 0}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 h-14 text-base font-semibold rounded-xl"
            >
              {isProcessing || checkingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {checkingPayment ? "Checking payment..." : "Processing..."}
                </>
              ) : (
                `Pay ₹${calculateTotal().toFixed(0)}`
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-900">₹{calculateTotal().toFixed(0)}</span>
        </div>
        <Button
          onClick={handlePayment}
          disabled={isProcessing || checkingPayment || cart.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-base font-semibold rounded-xl"
        >
          {isProcessing || checkingPayment ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {checkingPayment ? "Checking payment..." : "Processing..."}
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </div>
  );
}
