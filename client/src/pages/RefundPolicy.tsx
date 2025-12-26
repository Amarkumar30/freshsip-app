import { Link } from "wouter";
import { Droplet, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function RefundPolicy() {
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Refund Policy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <RefreshCw className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Refund & <span className="text-orange-600">Cancellation</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Your satisfaction is our priority. Here's our hassle-free policy.
          </p>
        </div>

        {/* Main Policy */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Promise</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Instant Replacement</h4>
                <p className="text-gray-600">
                  If you're not satisfied with the taste or quality of your juice, we'll provide an immediate replacement at the shop — no questions asked.
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
                <h4 className="font-bold text-gray-800 mb-1">Offline Refund</h4>
                <p className="text-gray-600">
                  Refunds can be processed offline at our shop. Just bring your order receipt or show your order confirmation, and we'll process your refund immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Quality Issues</h4>
                <p className="text-gray-600">
                  Found something wrong with your drink? Report it immediately at the shop, and we'll either replace your order or provide a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Cancellation Policy</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-800">Before Preparation:</span> Orders can be cancelled for a full refund if the preparation hasn't started yet.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 font-bold">!</span>
              </div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-800">During Preparation:</span> Once your order is being prepared, cancellation may not be possible. However, you can still pick up your order or request a replacement.
              </p>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold">×</span>
              </div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-800">After Ready:</span> Once the order is ready, cancellation is not available. You must pick up your order.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8">
          <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Notes
          </h4>
          <ul className="space-y-2 text-orange-700">
            <li>• All refunds are processed at the shop counter only</li>
            <li>• Please retain your order confirmation for any refund claims</li>
            <li>• Refund requests must be made within 15 minutes of receiving your order</li>
            <li>• Cash payments are refunded in cash; online payments may take 3-5 business days to reflect</li>
          </ul>
        </div>

        {/* Contact for Issues */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Have an Issue?</h3>
          <p className="opacity-90 max-w-xl mx-auto mb-4">
            If you're facing any problems with your order, please reach out to us immediately. We're here to help!
          </p>
          <a 
            href="mailto:support@qikcart.in?subject=Refund Request - FreshSip"
            className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Contact Support →
          </a>
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
