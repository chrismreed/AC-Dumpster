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
import ServicesPage from "@/pages/admin/services";
import PaymentSettingsPage from "@/pages/admin/payment-settings";
import LegalDocumentsPage from "@/pages/admin/legal-documents";
import SecurityPage from "@/pages/admin/security";
import SettingsPage from "@/pages/admin/settings";
import SwapRequestsPage from "@/pages/admin/swap-requests";
import SwapPricingPage from "@/pages/admin/swap-pricing";
import CustomerAccountsPage from "@/pages/admin/customer-accounts";
import BookingConfirmationPage from "@/pages/booking-confirmation";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentPage from "@/pages/payment-page";
import { StickyHeader } from "@/components/layout/sticky-header";
import { ImprovedFooter } from "@/components/layout/improved-footer";

// Public pages
import PublicServicesPage from "@/pages/services";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import FAQPage from "@/pages/faq";

// Individual service pages
import ResidentialServicePage from "@/pages/services/residential";
import ConstructionServicePage from "@/pages/services/construction";
import LandscapingServicePage from "@/pages/services/landscaping";
import RenovationServicePage from "@/pages/services/renovation";

// Customer portal pages
import CustomerLoginPage from "@/pages/customer/login";
import CustomerDashboardPage from "@/pages/customer/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/booking-confirmation" component={BookingConfirmationPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/pay/:id" component={PaymentPage} />
      
      {/* Public pages */}
      <Route path="/services" component={PublicServicesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/faq" component={FAQPage} />
      
      {/* Individual service pages */}
      <Route path="/services/residential" component={ResidentialServicePage} />
      <Route path="/services/construction" component={ConstructionServicePage} />
      <Route path="/services/landscaping" component={LandscapingServicePage} />
      <Route path="/services/renovation" component={RenovationServicePage} />
      
      {/* Customer portal routes */}
      <Route path="/customer/login" component={CustomerLoginPage} />
      <Route path="/customer/dashboard" component={CustomerDashboardPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={DashboardPage} adminOnly />
      <ProtectedRoute path="/admin/dashboard" component={DashboardPage} adminOnly />
      <ProtectedRoute path="/admin/dumpsters" component={DumpstersPage} adminOnly />
      <ProtectedRoute path="/admin/add-ons" component={AddOnsPage} adminOnly />
      <ProtectedRoute path="/admin/zones" component={ServiceZonesPage} adminOnly />
      <ProtectedRoute path="/admin/hubs" component={HubsPage} adminOnly />
      <ProtectedRoute path="/admin/services" component={ServicesPage} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={BookingsPage} adminOnly />
      <ProtectedRoute path="/admin/payment-settings" component={PaymentSettingsPage} adminOnly />
      <ProtectedRoute path="/admin/legal-documents" component={LegalDocumentsPage} adminOnly />
      <ProtectedRoute path="/admin/settings" component={SettingsPage} adminOnly />
      <ProtectedRoute path="/admin/security" component={SecurityPage} adminOnly />
      <ProtectedRoute path="/admin/swap-requests" component={SwapRequestsPage} adminOnly />
      <ProtectedRoute path="/admin/swap-pricing" component={SwapPricingPage} adminOnly />
      <ProtectedRoute path="/admin/customer-accounts" component={CustomerAccountsPage} adminOnly />
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
  const isCustomerPortal = location.startsWith('/customer');
  const hideHeaderFooter = isAdminPage || isCustomerPortal;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeaderFooter && <StickyHeader />}
      <main className={`flex-grow ${!hideHeaderFooter ? 'pt-16 md:pt-20' : ''}`}>
        <Router />
      </main>
      {!hideHeaderFooter && <ImprovedFooter />}
      <AdminStylesOverride />
    </div>
  );
}

export default App;
