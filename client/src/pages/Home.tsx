import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Droplet, ShoppingCart, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplet className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">FreshSip</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                <LogIn className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Fresh Juices, Fresh Energy
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Order delicious, freshly made juices delivered to your door
          </p>
          <Link href="/menu">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order Now
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🍊</div>
            <h3 className="text-xl font-semibold mb-2">100% Fresh</h3>
            <p className="text-gray-600">
              Made from the finest, freshest fruits available
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Quick Delivery</h3>
            <p className="text-gray-600">
              Get your order ready in minutes, not hours
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Affordable</h3>
            <p className="text-gray-600">
              Great quality at prices that won't break the bank
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-orange-500 text-white rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready for a Fresh Juice?</h3>
          <p className="text-lg mb-8 opacity-90">
            Browse our menu and customize your perfect juice today
          </p>
          <Link href="/menu">
            <Button size="lg" variant="secondary">
              Start Ordering
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p>&copy; 2025 FreshSip Juice Bar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
