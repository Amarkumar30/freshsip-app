import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderTracking from "./pages/OrderTracking";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import RefundPolicy from "./pages/RefundPolicy";
import TermsConditions from "./pages/TermsConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShopClosed from "./pages/ShopClosed";

// Business hours configuration (IST timezone)
const BUSINESS_HOURS = {
  openHour: 9,  // 9:00 AM
  closeHour: 21, // 9:00 PM (21:00)
  closedDays: [0], // Sunday (0 = Sunday in JS)
  timezone: "Asia/Kolkata",
};

// Check if shop is currently open
function getShopStatus(): { isOpen: boolean; openingTime: string; reason: "sunday" | "after-hours" } {
  const now = new Date();
  
  // Convert to IST
  const istTime = new Date(now.toLocaleString("en-US", { timeZone: BUSINESS_HOURS.timezone }));
  const day = istTime.getDay(); // 0 = Sunday
  const hour = istTime.getHours();
  
  // Check if it's a closed day (Sunday)
  if (BUSINESS_HOURS.closedDays.includes(day)) {
    return { 
      isOpen: false, 
      openingTime: "Monday at 9:00 AM", 
      reason: "sunday" 
    };
  }
  
  // Check if within business hours
  if (hour < BUSINESS_HOURS.openHour || hour >= BUSINESS_HOURS.closeHour) {
    // After hours - determine when we open next
    if (hour >= BUSINESS_HOURS.closeHour) {
      // After closing time - check if tomorrow is Sunday
      const tomorrow = (day + 1) % 7;
      if (BUSINESS_HOURS.closedDays.includes(tomorrow)) {
        return { isOpen: false, openingTime: "Monday at 9:00 AM", reason: "after-hours" };
      }
      return { isOpen: false, openingTime: "Tomorrow at 9:00 AM", reason: "after-hours" };
    } else {
      // Before opening time
      return { isOpen: false, openingTime: "9:00 AM", reason: "after-hours" };
    }
  }
  
  return { isOpen: true, openingTime: "", reason: "after-hours" };
}

function Router() {
  const [location] = useLocation();
  
  // Check if current route is an admin route or allowed when closed
  const isAdminRoute = location.startsWith("/admin");
  const isOrderTrackingRoute = location.startsWith("/order-success") || location.startsWith("/order-tracking");
  
  // Get shop status
  const shopStatus = getShopStatus();
  
  // Show closed page for customer routes when shop is closed
  // Allow: admin routes, order tracking/success (for customers who already ordered)
  if (!shopStatus.isOpen && !isAdminRoute && !isOrderTrackingRoute) {
    return <ShopClosed openingTime={shopStatus.openingTime} reason={shopStatus.reason} />;
  }
  
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/menu"} component={Menu} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/order-success"} component={OrderSuccess} />
      <Route path={"/order-tracking"} component={OrderTracking} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/about"} component={AboutUs} />
      <Route path={"/contact"} component={ContactUs} />
      <Route path={"/refund-policy"} component={RefundPolicy} />
      <Route path={"/terms"} component={TermsConditions} />
      <Route path={"/shipping"} component={ShippingPolicy} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
