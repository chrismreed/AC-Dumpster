import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { AdminStylesOverride } from "@/components/admin-styles-override";
import { GoogleMapsProvider } from "@/providers/google-maps-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import DashboardPage from "@/pages/admin/dashboard";
import DumpstersPage from "@/pages/admin/dumpsters";
import AddOnsPage from "@/pages/admin/add-ons";
import ServiceZonesPage from "@/pages/admin/zones-new-layout";
import BookingsPage from "@/pages/admin/bookings";
import HubsPage from "@/pages/admin/hubs";
import PaymentSettingsPage from "@/pages/admin/payment-settings";
import LegalDocumentsPage from "@/pages/admin/legal-documents";
import SecurityPage from "@/pages/admin/security";
import BookingConfirmationPage from "@/pages/booking-confirmation";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentPage from "@/pages/payment-page";
import { StickyHeader } from "@/components/layout/sticky-header";
import { ImprovedFooter } from "@/components/layout/improved-footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/booking-confirmation" component={BookingConfirmationPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/pay/:id" component={PaymentPage} />
      <ProtectedRoute path="/admin" component={DashboardPage} adminOnly />
      <ProtectedRoute path="/admin/dashboard" component={DashboardPage} adminOnly />
      <ProtectedRoute path="/admin/dumpsters" component={DumpstersPage} adminOnly />
      <ProtectedRoute path="/admin/add-ons" component={AddOnsPage} adminOnly />
      <ProtectedRoute path="/admin/zones" component={ServiceZonesPage} adminOnly />
      <ProtectedRoute path="/admin/hubs" component={HubsPage} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={BookingsPage} adminOnly />
      <ProtectedRoute path="/admin/payment-settings" component={PaymentSettingsPage} adminOnly />
      <ProtectedRoute path="/admin/legal-documents" component={LegalDocumentsPage} adminOnly />
      <ProtectedRoute path="/admin/security" component={SecurityPage} adminOnly />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoogleMapsProvider>
          <AppContent />
          <Toaster />
        </GoogleMapsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <StickyHeader />}
      <main className={`flex-grow ${!isAdminPage ? 'pt-16 md:pt-20' : ''}`}>
        <Router />
      </main>
      {!isAdminPage && <ImprovedFooter />}
      <AdminStylesOverride />
    </div>
  );
}

export default App;
