import { Link } from "wouter";
import { Droplet, ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react";

export default function TermsConditions() {
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Terms & Conditions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Terms & <span className="text-orange-600">Conditions</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-gray-400 text-sm mt-2">Last updated: December 2025</p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          {/* General */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">1. General Terms</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>By accessing and placing orders through FreshSip, you agree to be bound by these terms and conditions.</p>
              <p>FreshSip reserves the right to modify these terms at any time without prior notice. Continued use of our services constitutes acceptance of any modifications.</p>
              <p>These terms apply to all users of our service, including customers and visitors.</p>
            </div>
          </div>

          {/* Age Requirement */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">2. Age Requirement</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p><span className="font-medium text-gray-800">Minimum Age:</span> You must be at least 4 years old to consume our products. Children under 4 should consume our juices only under parental supervision and guidance.</p>
              <p><span className="font-medium text-gray-800">Ordering Age:</span> Users must be at least 13 years old to place orders independently. Younger users should have a parent or guardian place orders on their behalf.</p>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">3. Orders & Payments</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>• All prices are displayed in Indian Rupees (₹) and include applicable taxes.</p>
              <p>• Payment can be made via UPI, credit/debit cards, net banking through Razorpay, or cash on pickup.</p>
              <p>• Once an order is confirmed and preparation has begun, it cannot be cancelled.</p>
              <p>• Orders must be picked up within 30 minutes of being marked as ready. After this time, we cannot guarantee product quality.</p>
              <p>• We reserve the right to refuse service to anyone for any reason at any time.</p>
            </div>
          </div>

          {/* Health & Safety */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">4. Health & Allergies</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p><span className="font-medium text-gray-800">Allergen Information:</span> Our products may contain or come into contact with nuts, dairy, and other common allergens. Please inform us of any allergies before placing your order.</p>
              <p><span className="font-medium text-gray-800">Dietary Concerns:</span> While we strive to provide accurate nutritional information, please consult your healthcare provider for specific dietary requirements or restrictions.</p>
              <p><span className="font-medium text-gray-800">Freshness:</span> Our juices are made fresh and should be consumed immediately for the best taste and nutritional value. We are not responsible for any issues arising from delayed consumption.</p>
            </div>
          </div>

          {/* Liability */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">5. Limitation of Liability</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>FreshSip shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
              <p>Our total liability for any claim shall not exceed the amount paid by you for the specific product or service in question.</p>
              <p>We are not responsible for any technical issues with the ordering platform that may be beyond our control.</p>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">6. Privacy</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>We collect only essential information required to process your orders (name, phone number).</p>
              <p>Your personal information is never shared with third parties for marketing purposes.</p>
              <p>Payment processing is handled securely by Razorpay. We do not store your payment card details.</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">7. Governing Law</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>These terms shall be governed by and construed in accordance with the laws of India.</p>
              <p>Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Questions?</h3>
          <p className="opacity-90 max-w-xl mx-auto mb-4">
            If you have any questions about these terms, please don't hesitate to contact us.
          </p>
          <a 
            href="mailto:support@qikcart.in?subject=Terms Query - FreshSip"
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
