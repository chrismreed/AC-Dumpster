import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { AdminStylesOverride } from "@/components/admin-styles-override";
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
import ZonesMapPage from "@/pages/admin/zones-map";
import ZonesNewLayoutPage from "@/pages/admin/zones-new-layout";
import BookingsPage from "@/pages/admin/bookings";

import PaymentSettingsPage from "@/pages/admin/payment-settings";
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
      <ProtectedRoute path="/admin/zones-map" component={ZonesMapPage} adminOnly />
      <ProtectedRoute path="/admin/zones-new" component={ZonesNewLayoutPage} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={BookingsPage} adminOnly />

      <ProtectedRoute path="/admin/payment-settings" component={PaymentSettingsPage} adminOnly />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {isAdminPage ? (
        <Header />
      ) : (
        <StickyHeader />
      )}
      <main className="flex-grow pt-16 md:pt-20">
        <Router />
      </main>
      {isAdminPage ? (
        <Footer />
      ) : (
        <ImprovedFooter />
      )}
      <AdminStylesOverride />
    </div>
  );
}

export default App;
