import { Clock, Calendar, Sun, Moon } from "lucide-react";
import { Link } from "wouter";
import FreshSipLogo from "@/components/FreshSipLogo";

interface ShopClosedProps {
  openingTime: string;
  reason: "sunday" | "after-hours";
}

export default function ShopClosed({ openingTime, reason }: ShopClosedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* Logo */}
        <div className="mb-8">
          <FreshSipLogo size="lg" showTagline className="justify-center" />
        </div>

        {/* Closed Status Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-6">
          {/* Moon/Sun Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {reason === "after-hours" ? (
              <Moon className="w-10 h-10 text-indigo-500" />
            ) : (
              <Calendar className="w-10 h-10 text-purple-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            We're Currently Closed
          </h2>
          
          <p className="text-gray-500 mb-6">
            {reason === "sunday" 
              ? "We're taking a break today! Come back tomorrow." 
              : "We're resting now. Fresh juices await you tomorrow!"}
          </p>

          {/* Opening Time */}
          <div className="bg-orange-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">We open at</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{openingTime}</p>
          </div>

          {/* Decorative Emojis - static to save performance */}
          <div className="flex justify-center gap-3 text-4xl mb-6">
            <span>🍊</span>
            <span>🥭</span>
            <span>🍓</span>
            <span>🍹</span>
          </div>

          {/* Business Hours */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Business Hours
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Monday - Saturday</span>
                <span className="font-medium text-gray-900">9:00 AM - 9:00 PM</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sunday</span>
                <span className="font-medium text-red-500">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <Link href="/admin/login">
          <span className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            Admin Access
          </span>
        </Link>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
