import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { VendorLayout } from "@/components/layout/VendorLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";

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
import BookWizard from "@/pages/book-wizard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/book">
        <PublicLayout>
          <BookWizard />
        </PublicLayout>
      </Route>

      {/* Vendor Routes */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route path="/dashboard">
        <VendorLayout><Dashboard /></VendorLayout>
      </Route>
      <Route path="/bookings">
        <VendorLayout><Bookings /></VendorLayout>
      </Route>
      <Route path="/bookings/:id">
        <VendorLayout><BookingDetail /></VendorLayout>
      </Route>
      <Route path="/calendar">
        <VendorLayout><CalendarView /></VendorLayout>
      </Route>
      <Route path="/clients">
        <VendorLayout><Clients /></VendorLayout>
      </Route>
      <Route path="/clients/:id">
        <VendorLayout><ClientDetail /></VendorLayout>
      </Route>
      <Route path="/packages">
        <VendorLayout><Packages /></VendorLayout>
      </Route>
      <Route path="/team">
        <VendorLayout><Team /></VendorLayout>
      </Route>
      <Route path="/invoices">
        <VendorLayout><Invoices /></VendorLayout>
      </Route>
      <Route path="/invoices/:id">
        <VendorLayout><InvoiceDetail /></VendorLayout>
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
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
