import { Link } from "wouter";
import { ArrowLeft, MapPin, Mail, Phone, Clock, MessageCircle } from "lucide-react";
import FreshSipLogo from "@/components/FreshSipLogo";

export default function ContactUs() {
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
          <FreshSipLogo size="sm" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Get in <span className="text-orange-600">Touch</span>
          </h2>
          <p className="text-gray-600 text-lg">
            We'd love to hear from you! Reach out with any questions, feedback, or suggestions.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Our Location</h3>
                <p className="text-sm text-gray-500">Visit us at</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Academic Building<br />
              South Asian University<br />
              Gaushala Road<br />
              New Delhi - 110068
            </p>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Email Us</h3>
                <p className="text-sm text-gray-500">For inquiries & feedback</p>
              </div>
            </div>
            <a 
              href="mailto:support@qikcart.in" 
              className="text-orange-600 font-medium hover:underline text-lg"
            >
              support@qikcart.in
            </a>
            <p className="text-gray-500 text-sm mt-2">
              We typically respond within 24 hours
            </p>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Call Us</h3>
                <p className="text-sm text-gray-500">For immediate assistance</p>
              </div>
            </div>
            <p className="text-gray-600">
              Visit our shop directly for quick help!<br />
              <span className="text-sm text-gray-500">Phone orders are not available at the moment.</span>
            </p>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Working Hours</h3>
                <p className="text-sm text-gray-500">We're open</p>
              </div>
            </div>
            <div className="space-y-1 text-gray-600">
              <p><span className="font-medium">Monday - Saturday:</span> 9:00 AM - 7:00 PM</p>
              <p><span className="font-medium">Sunday:</span> 10:00 AM - 5:00 PM</p>
              <p className="text-sm text-gray-500 mt-2">* Hours may vary during holidays</p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">We Value Your Feedback!</h3>
          <p className="opacity-90 max-w-xl mx-auto mb-4">
            Your satisfaction is our priority. If you have any suggestions, complaints, or just want to share your experience, please drop us an email. We read every message!
          </p>
          <a 
            href="mailto:support@qikcart.in?subject=Feedback for FreshSip"
            className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Send Feedback →
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
