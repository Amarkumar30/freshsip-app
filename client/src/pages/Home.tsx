import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, ArrowRight, Clock, Leaf, Star, MapPin } from "lucide-react";
import FreshSipLogo from "@/components/FreshSipLogo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-orange-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <FreshSipLogo size="sm" />
          <Link href="/menu">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 h-10 font-semibold shadow-lg shadow-orange-200/50">
              Order Now
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="text-center py-12 md:py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full mb-6 text-sm font-medium shadow-sm border border-orange-100">
            <Leaf className="w-4 h-4" />
            100% Fresh & Natural
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Fresh Juices &
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Delicious Shakes</span>
          </h1>
          
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-base md:text-lg">
            Handcrafted with love at SAU Campus. Made fresh, served fast.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/menu">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 h-14 text-base rounded-full shadow-xl shadow-orange-200/60 transition-all hover:shadow-2xl hover:scale-105">
                <ShoppingCart className="w-5 h-5 mr-2" />
                View Menu
              </Button>
            </Link>
            <Link href="/order-tracking">
              <Button variant="outline" size="lg" className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold px-8 h-14 text-base rounded-full">
                Track Order
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-12 mt-12 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-orange-500">23+</p>
              <p className="text-gray-500 text-sm">Flavors</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-orange-500">₹40</p>
              <p className="text-gray-500 text-sm">Starting Price</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-orange-500">5 min</p>
              <p className="text-gray-500 text-sm">Ready Time</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">100% Fresh Fruits</h3>
              <p className="text-gray-500 text-sm">No preservatives, no artificial colors. Just pure, natural goodness.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Ready in 5 Minutes</h3>
              <p className="text-gray-500 text-sm">Quick preparation so you never have to wait long for freshness.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Student Friendly Prices</h3>
              <p className="text-gray-500 text-sm">Quality drinks at affordable prices. Starting from just ₹40.</p>
            </div>
          </div>
        </div>

        {/* Menu Preview */}
        <div className="py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Picks</h2>
            <Link href="/menu">
              <span className="text-orange-500 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                View All <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Mango Shake', price: '₹40', emoji: '🥭', bg: 'from-amber-100 to-orange-100' },
              { name: 'Oreo Shake', price: '₹40', emoji: '🍪', bg: 'from-gray-100 to-slate-100' },
              { name: 'Strawberry Shake', price: '₹40', emoji: '🍓', bg: 'from-pink-100 to-rose-100' },
              { name: 'Traffic Jam', price: '₹60', emoji: '🌈', bg: 'from-purple-100 to-pink-100' },
            ].map((item) => (
              <Link key={item.name} href="/menu">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-4xl">{item.emoji}</span>
                  </div>
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <p className="text-orange-500 font-bold mt-1">from {item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Location & Hours */}
        <div className="py-10">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 md:p-10 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-2">Visit Us Today</h3>
                <div className="flex items-center gap-2 text-orange-100 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Academic Building, SAU Campus</span>
                </div>
                <div className="flex items-center gap-2 text-orange-100">
                  <Clock className="w-4 h-4" />
                  <span>Mon - Sat: 9:00 AM - 9:00 PM</span>
                </div>
              </div>
              <Link href="/menu">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 h-14 rounded-full shadow-lg">
                  Order Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <FreshSipLogo size="sm" dark />
              <p className="text-gray-400 text-sm mt-3 max-w-xs">Fresh juices & shakes made with love for the SAU family.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <Link href="/menu">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Menu</span>
                </Link>
                <Link href="/order-tracking">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Track Order</span>
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <Link href="/about">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">About Us</span>
                </Link>
                <Link href="/refund-policy">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Refund Policy</span>
                </Link>
                <Link href="/privacy">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Privacy Policy</span>
                </Link>
                <Link href="/terms">
                  <span className="text-gray-400 hover:text-orange-400 transition-colors text-sm cursor-pointer">Terms</span>
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <div className="flex flex-col gap-2 text-gray-400 text-sm">
                <p>Academic Building, SAU</p>
                <p>Gaushala Road, 110068</p>
                <a href="mailto:support@qikcart.in" className="text-orange-400 hover:text-orange-300 transition-colors">support@qikcart.in</a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 FreshSip Juice Bar. Made with ❤️</p>
            <div className="flex gap-6 text-gray-500 text-sm">
              <Link href="/terms"><span className="hover:text-orange-400 cursor-pointer">Terms</span></Link>
              <Link href="/privacy"><span className="hover:text-orange-400 cursor-pointer">Privacy</span></Link>
              <Link href="/contact"><span className="hover:text-orange-400 cursor-pointer">Contact</span></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
