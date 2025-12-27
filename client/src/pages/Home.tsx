import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Droplet, ShoppingCart, LogIn, Sparkles, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-200 transition-shadow">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">FreshSip</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/menu">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                Menu
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                <LogIn className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-20 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-50"></div>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">100% Fresh & Natural</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">
              Fresh Juices
            </span>
            <br />
            <span className="text-gray-800">Delivered Fast</span>
          </h2>
          
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            100% natural, handcrafted juices & shakes 🍊🥭
          </p>
          
          <a href="/menu">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-10 py-6 text-lg rounded-2xl shadow-xl shadow-orange-200/50 hover:shadow-2xl transition-all hover:scale-105 active:scale-100">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order Now
            </Button>
          </a>
          
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl shadow-orange-100/50 text-center border border-orange-100 hover:shadow-2xl transition-shadow group">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🍊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">100% Fresh</h3>
            <p className="text-gray-600">
              Made from the finest, freshest fruits sourced directly from local farms
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl shadow-orange-100/50 text-center border border-orange-100 hover:shadow-2xl transition-shadow group">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Ready in Minutes</h3>
            <p className="text-gray-600">
              Quick preparation and delivery — your fresh juice is ready before you know it
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl shadow-orange-100/50 text-center border border-orange-100 hover:shadow-2xl transition-shadow group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Great Value</h3>
            <p className="text-gray-600">
              Premium quality at affordable prices that won't break the bank
            </p>
          </div>
        </div>

        {/* Popular Items Preview */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">Popular Picks ✨</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Mango Shake', price: '₹120', emoji: '🥭', color: 'from-yellow-400 to-orange-400' },
              { name: 'Oreo Shake', price: '₹140', emoji: '🍪', color: 'from-gray-600 to-gray-800' },
              { name: 'Strawberry', price: '₹120', emoji: '🍓', color: 'from-pink-400 to-red-400' },
              { name: 'Traffic Jam', price: '₹150', emoji: '🌈', color: 'from-purple-400 to-pink-400' },
            ].map((item) => (
              <Link key={item.name} href="/menu">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform`}>
                    <span className="text-4xl">{item.emoji}</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1">{item.name}</h4>
                  <p className="text-orange-600 font-semibold">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Thirsty? 🍹</h3>
          <p className="text-orange-100 mb-5">Order now, ready in minutes!</p>
          <a href="/menu">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-100">
              Order Now →
            </Button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">FreshSip</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">Fresh, natural juices for the SAU family. Made with love, served with a smile.</p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white mb-1">Quick Links</h4>
              <Link href="/menu">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Menu</span>
              </Link>
              <Link href="/order-tracking">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Track Order</span>
              </Link>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white mb-1">Legal</h4>
              <Link href="/about">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">About Us</span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Contact Us</span>
              </Link>
              <Link href="/refund-policy">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Refund & Cancellation</span>
              </Link>
              <Link href="/shipping">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Shipping & Delivery</span>
              </Link>
              <Link href="/privacy">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Privacy Policy</span>
              </Link>
              <Link href="/terms">
                <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Terms & Conditions</span>
              </Link>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white mb-1">Contact</h4>
              <p className="text-gray-400 text-sm">Academic Building, SAU</p>
              <p className="text-gray-400 text-sm">Gaushala Road, 110068</p>
              <a href="mailto:support@qikcart.in" className="text-orange-400 hover:text-orange-300 transition-colors text-sm">support@qikcart.in</a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 FreshSip Juice Bar. Made with ❤️ for the SAU family.</p>
            <div className="flex gap-4 text-gray-500 text-xs">
              <Link href="/terms"><span className="hover:text-gray-400 cursor-pointer">Terms</span></Link>
              <Link href="/privacy"><span className="hover:text-gray-400 cursor-pointer">Privacy</span></Link>
              <Link href="/refund-policy"><span className="hover:text-gray-400 cursor-pointer">Refund</span></Link>
              <Link href="/contact"><span className="hover:text-gray-400 cursor-pointer">Contact</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
