import { Link } from "wouter";
import { Droplet, ArrowLeft, Truck, Clock, MapPin, CheckCircle, Info } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-orange-100">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Shipping & Delivery</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Shipping & <span className="text-orange-600">Delivery</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Fresh juices, ready when you are!
          </p>
        </div>

        {/* Pickup Model */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Pickup Only Model</h3>
          </div>
          <p className="text-lg opacity-95">
            FreshSip operates on a <strong>pickup-only model</strong>. We do not offer home delivery at this time. All orders must be collected from our shop at South Asian University.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-orange-600">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Place Your Order</h4>
                <p className="text-gray-600">
                  Browse our menu, customize your juice with add-ons, and place your order through our website.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-orange-600">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">We Prepare It Fresh</h4>
                <p className="text-gray-600">
                  Our team prepares your juice fresh, right after receiving your order. No pre-made batches!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-orange-600">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Track Your Order</h4>
                <p className="text-gray-600">
                  Use our order tracking feature to see when your juice is ready for pickup.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Pick It Up!</h4>
                <p className="text-gray-600">
                  Come to our shop at SAU Academic Building, show your order confirmation, and enjoy your fresh juice!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-7 h-7 text-orange-500" />
            <h3 className="text-2xl font-bold text-gray-800">Preparation Time</h3>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>
              <span className="font-medium text-gray-800">Typical Wait Time:</span> 5-10 minutes depending on order complexity and queue.
            </p>
            <p>
              <span className="font-medium text-gray-800">Peak Hours:</span> During lunch (12 PM - 2 PM) and evening (5 PM - 7 PM), wait times may be slightly longer.
            </p>
            <p>
              <span className="font-medium text-gray-800">Order Pickup Window:</span> Please collect your order within 30 minutes of it being marked as ready for the best taste and quality.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-7 h-7 text-orange-500" />
            <h3 className="text-2xl font-bold text-gray-800">Pickup Location</h3>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <p className="font-medium text-gray-800">FreshSip Juice Bar</p>
            <p className="text-gray-600">Academic Building</p>
            <p className="text-gray-600">South Asian University</p>
            <p className="text-gray-600">Gaushala Road</p>
            <p className="text-gray-600">New Delhi - 110068</p>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
          <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Important Note
          </h4>
          <p className="text-amber-700">
            Since we prepare everything fresh, we currently do not offer delivery services. This ensures you get the freshest, highest-quality juice every time. We appreciate your understanding!
          </p>
        </div>

        {/* Future Delivery */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-3">Delivery Coming Soon!</h3>
          <p className="opacity-90 max-w-xl mx-auto">
            We're working on bringing delivery services to the SAU campus. Stay tuned for updates!
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2025 FreshSip Juice Bar. Made with ❤️ for the SAU family.</p>
        </div>
      </footer>
    </div>
  );
}
