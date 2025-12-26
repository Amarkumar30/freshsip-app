import { Link } from "wouter";
import { Droplet, ArrowLeft, Heart, Users, Leaf, Award, MapPin } from "lucide-react";

export default function AboutUs() {
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">About Us</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Fresh Juices for the <span className="text-orange-600">SAU Family</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We are dedicated to providing 100% natural, fresh juices to all members of the South Asian University community.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <Leaf className="w-7 h-7 text-green-500" />
            Our Mission
          </h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            At FreshSip, we believe that everyone deserves access to fresh, healthy, and delicious juices. Our mission is to bring the goodness of nature directly to your hands — no preservatives, no artificial flavors, just pure freshness.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Every juice we make is prepared on-the-spot using hand-picked fruits and vegetables, ensuring maximum nutrition and incredible taste. We're not just a juice bar; we're your partner in healthy living.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍊</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">100% Natural</h4>
            <p className="text-gray-600 text-sm">No preservatives, no artificial colors — just pure, natural goodness.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌱</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Fresh Daily</h4>
            <p className="text-gray-600 text-sm">Every juice is made fresh when you order. No old stock, ever.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💪</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Health First</h4>
            <p className="text-gray-600 text-sm">We prioritize your health with hygienically prepared beverages.</p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 text-white text-center">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-3">Serving the SAU Community</h3>
          <p className="opacity-90 max-w-xl mx-auto">
            Located at the heart of South Asian University, we're here to serve students, faculty, and staff with the freshest beverages. Whether you need a quick energy boost between classes or a refreshing drink after a long day, FreshSip has got you covered!
          </p>
        </div>

        {/* Location */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-6 h-6 text-orange-500" />
            <h4 className="font-bold text-gray-800">Find Us</h4>
          </div>
          <p className="text-gray-600">
            Academic Building, South Asian University<br />
            Gaushala Road, New Delhi - 110068
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
