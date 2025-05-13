import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import DashboardPage from "@/pages/admin/dashboard";
import DumpstersPage from "@/pages/admin/dumpsters";
import AddOnsPage from "@/pages/admin/add-ons";
import ZonesPage from "@/pages/admin/zones";
import ZoneMapPage from "@/pages/admin/zone-map";
import BookingsPage from "@/pages/admin/bookings";
import DeliveryMapPage from "@/pages/admin/delivery-map";
import BookingConfirmationPage from "@/pages/booking-confirmation";
import { StickyHeader } from "@/components/layout/sticky-header";
import { ImprovedFooter } from "@/components/layout/improved-footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/booking-confirmation" component={BookingConfirmationPage} />
      <ProtectedRoute path="/admin/dashboard" component={DashboardPage} adminOnly />
      <ProtectedRoute path="/admin/dumpsters" component={DumpstersPage} adminOnly />
      <ProtectedRoute path="/admin/add-ons" component={AddOnsPage} adminOnly />
      <ProtectedRoute path="/admin/zones" component={ZonesPage} adminOnly />
      <ProtectedRoute path="/admin/zone-map" component={ZoneMapPage} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={BookingsPage} adminOnly />
      <ProtectedRoute path="/admin/delivery-map" component={DeliveryMapPage} adminOnly />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          {isAdminPage ? (
            <Header />
          ) : (
            <StickyHeader />
          )}
          <main className="flex-grow">
            <Router />
          </main>
          {isAdminPage ? (
            <Footer />
          ) : (
            <ImprovedFooter />
          )}
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
