import { Link } from "wouter";
import { Droplet, ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell } from "lucide-react";

export default function PrivacyPolicy() {
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Privacy <span className="text-orange-600">Policy</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Your privacy matters to us. Here's how we protect it.
          </p>
          <p className="text-gray-400 text-sm mt-2">Last updated: December 2025</p>
        </div>

        {/* Privacy Commitment */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-8 h-8" />
            <h3 className="text-2xl font-bold">Our Privacy Commitment</h3>
          </div>
          <p className="text-lg opacity-95">
            At FreshSip, we believe in complete transparency. We collect only what's necessary to serve you better, and we never sell your data to anyone. Period.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Information We Collect */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Information We Collect</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p><span className="font-medium text-gray-800">Personal Information:</span></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Name:</strong> To identify your order and personalize your experience</li>
                <li><strong>Phone Number (Optional):</strong> To contact you if there are issues with your order</li>
              </ul>
              <p className="mt-4"><span className="font-medium text-gray-800">Order Information:</span></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Items ordered, customizations, and preferences</li>
                <li>Order history for your convenience</li>
                <li>Payment transaction IDs (we don't store card details)</li>
              </ul>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">How We Use Your Information</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>We use your information solely to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Process and fulfill your juice orders</li>
                <li>Communicate order status and updates</li>
                <li>Improve our menu and service based on preferences</li>
                <li>Provide customer support when needed</li>
                <li>Prevent fraud and ensure secure transactions</li>
              </ul>
            </div>
          </div>

          {/* What We DON'T Do */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">What We DON'T Do</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>We <strong>never</strong> sell your personal information to third parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>We <strong>never</strong> share your data for marketing purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>We <strong>never</strong> store your credit/debit card details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>We <strong>never</strong> send unsolicited promotional messages</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Security */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Payment Security</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                All payments are processed securely through <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. This means:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Your card details are encrypted and never reach our servers</li>
                <li>Transactions are protected with industry-standard security</li>
                <li>We only receive confirmation of successful payments</li>
              </ul>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Data Retention</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                We retain your order information to provide you with order history and improve our services. You can request deletion of your data at any time by contacting us at <a href="mailto:support@qikcart.in" className="text-orange-600 hover:underline">support@qikcart.in</a>.
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🍪</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Cookies</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                We use minimal, essential cookies to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Keep you logged in during your session</li>
                <li>Remember your cart items</li>
                <li>Ensure the website functions properly</li>
              </ul>
              <p className="mt-2">
                We do not use tracking cookies or share cookie data with advertisers.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Your Rights</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from any communications</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, email us at <a href="mailto:support@qikcart.in" className="text-orange-600 hover:underline">support@qikcart.in</a>.
              </p>
            </div>
          </div>

          {/* Updates */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Policy Updates</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                We may update this privacy policy from time to time. Any significant changes will be communicated through our website. We encourage you to review this page periodically.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-3">Questions About Privacy?</h3>
          <p className="opacity-90 max-w-xl mx-auto mb-4">
            If you have any questions or concerns about our privacy practices, we're here to help.
          </p>
          <a 
            href="mailto:support@qikcart.in?subject=Privacy Query - FreshSip"
            className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Contact Us →
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
