import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Droplet, ShoppingCart, Sparkles, Zap, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FreshSip</span>
          </div>
          <Link href="/menu">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 h-9 font-medium">
              Order Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="text-center py-16 md:py-24">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full mb-6 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            100% Fresh & Natural
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Fresh Juices,
            <br />
            <span className="text-orange-500">Made for You</span>
          </h1>
          
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Handcrafted juices & shakes made fresh daily at SAU campus
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/menu">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 h-14 text-base rounded-full shadow-lg shadow-orange-200/50 transition-all hover:shadow-xl">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Order Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 py-8 border-y border-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🍊</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">100% Fresh</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1 hidden md:block">No preservatives</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">5 Min Ready</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1 hidden md:block">Quick preparation</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Best Price</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-1 hidden md:block">Student friendly</p>
          </div>
        </div>

        {/* Popular Items Preview */}
        <div className="py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Popular Picks</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Mango Shake', price: '₹120', emoji: '🥭', bg: 'bg-amber-50' },
              { name: 'Oreo Shake', price: '₹140', emoji: '🍪', bg: 'bg-gray-100' },
              { name: 'Strawberry', price: '₹120', emoji: '🍓', bg: 'bg-pink-50' },
              { name: 'Traffic Jam', price: '₹150', emoji: '🌈', bg: 'bg-purple-50' },
            ].map((item) => (
              <Link key={item.name} href="/menu">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer">
                  <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <span className="text-3xl">{item.emoji}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                  <p className="text-orange-600 font-bold text-sm mt-1">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-orange-500 rounded-2xl p-6 md:p-8 text-center mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Ready to order?</h3>
          <p className="text-orange-100 mb-5 text-sm md:text-base">Fresh juice in just 5 minutes</p>
          <Link href="/menu">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-6 h-12 rounded-full">
              View Menu
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-10">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">FreshSip</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">Fresh juices for the SAU family.</p>
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
