import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Users, Package, FileText, Camera, CreditCard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/bookings", icon: Camera },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Packages", href: "/packages", icon: Package },
  { name: "Team", href: "/team", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
];

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <span className="font-serif text-xl font-bold tracking-tight text-foreground">FlowApp</span>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] bg-card p-4">
            <div className="mb-8 mt-4">
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">FlowApp</span>
            </div>
            <nav className="flex flex-col gap-2">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card min-h-screen">
        <div className="p-6">
          <span className="font-serif text-2xl font-bold tracking-tight text-foreground">FlowApp</span>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-2">
          <NavLinks />
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
