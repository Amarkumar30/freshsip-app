import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Droplet, LogIn, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If user is already logged in and is admin, redirect to dashboard
    if (isAuthenticated && user?.role === "admin") {
      window.location.href = "/admin/dashboard";
    }
  }, [isAuthenticated, user]);

  const handleLogin = () => {
    const loginUrl = getLoginUrl();
    window.location.href = loginUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin">
            <Droplet className="w-12 h-12 text-orange-500 mx-auto" />
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Droplet className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">FreshSip</h1>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="p-12">
            {/* Icon */}
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h2>
              <p className="text-gray-600">
                Sign in to manage orders and shop operations
              </p>
            </div>

            {/* Login Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Only authorized shop owners can access the admin panel. 
                Please use your Gmail account registered with FreshSip.
              </p>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold mb-4"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>

            {/* Error Message */}
            {isAuthenticated && user?.role !== "admin" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-900">
                  Your account doesn't have admin access. Please contact the shop owner.
                </p>
              </div>
            )}

            {/* Back Link */}
            <div className="text-center mt-8">
              <Link href="/">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>
              Having trouble logging in?{" "}
              <a href="mailto:support@freshsip.com" className="text-blue-600 hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
