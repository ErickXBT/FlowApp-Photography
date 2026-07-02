import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import { VendorLayout } from "@/components/layout/VendorLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import BookingDetail from "@/pages/booking-detail";
import CalendarView from "@/pages/calendar";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Packages from "@/pages/packages";
import Team from "@/pages/team";
import Invoices from "@/pages/invoices";
import InvoiceDetail from "@/pages/invoice-detail";
import ClientPortal from "@/pages/client-portal";
import BookWizard from "@/pages/book-wizard";
import DressCatalog from "@/pages/dress-catalog";
import RescheduleCenter from "@/pages/reschedule-center";
import Settings from "@/pages/settings";
import LandingPage from "@/pages/landing";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPlans from "@/pages/admin/plans";
import AdminActivity from "@/pages/admin/activity";
import AdminSettings from "@/pages/admin/settings";
import NewTenant from "@/pages/admin/tenants";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Authentication */}
      <Route path="/login">
        <Login />
      </Route>

      {/* Public Routes */}
      <Route path="/book">
        <PublicLayout>
          <BookWizard />
        </PublicLayout>
      </Route>
      <Route path="/p/:slug">
        <PublicLayout>
          <LandingPage />
        </PublicLayout>
      </Route>
      <Route path="/client/bookings/:id">
        <PublicLayout>
          <ClientPortal />
        </PublicLayout>
      </Route>

      {/* Vendor Routes */}
      <Route path="/dashboard">
        <VendorLayout><Dashboard /></VendorLayout>
      </Route>
      <Route path="/bookings/:id">
        <VendorLayout><BookingDetail /></VendorLayout>
      </Route>
      <Route path="/bookings">
        <VendorLayout><Bookings /></VendorLayout>
      </Route>
      <Route path="/calendar">
        <VendorLayout><CalendarView /></VendorLayout>
      </Route>
      <Route path="/clients/:id">
        <VendorLayout><ClientDetail /></VendorLayout>
      </Route>
      <Route path="/clients">
        <VendorLayout><Clients /></VendorLayout>
      </Route>
      <Route path="/packages">
        <VendorLayout><Packages /></VendorLayout>
      </Route>
      <Route path="/team">
        <VendorLayout><Team /></VendorLayout>
      </Route>
      <Route path="/invoices/:id">
        <VendorLayout><InvoiceDetail /></VendorLayout>
      </Route>
      <Route path="/invoices">
        <VendorLayout><Invoices /></VendorLayout>
      </Route>
      <Route path="/dress-catalog">
        <VendorLayout><DressCatalog /></VendorLayout>
      </Route>
      <Route path="/reschedule-center">
        <VendorLayout><RescheduleCenter /></VendorLayout>
      </Route>
      <Route path="/settings">
        <VendorLayout><Settings /></VendorLayout>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/plans">
        <AdminPlans />
      </Route>
      <Route path="/admin/activity">
        <AdminActivity />
      </Route>
      <Route path="/admin/settings">
        <AdminSettings />
      </Route>
      <Route path="/admin/tenants/new">
        <NewTenant />
      </Route>
      <Route path="/admin">
        <AdminDashboard />
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
