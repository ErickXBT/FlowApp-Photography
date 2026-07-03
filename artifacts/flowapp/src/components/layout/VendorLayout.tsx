import { Link, useLocation } from "wouter";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Calendar, Users, ShoppingBag, FileText, Camera,
  RefreshCw, Menu, Settings, LogOut, ExternalLink, Shirt, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const navigation = [
  { name: "Booking Management", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kalender Kerja", href: "/calendar", icon: Calendar },
  { name: "Team Management", href: "/team", icon: Users },
  { name: "Dress Catalog", href: "/dress-catalog", icon: Shirt },
  { name: "CRM & Client History", href: "/clients", icon: TrendingUp },
  { name: "Reschedule Center", href: "/reschedule-center", icon: RefreshCw },
  { name: "Packages", href: "/packages", icon: ShoppingBag },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const simulateViews = [
  { name: "Landing Page", href: "#landing" },
  { name: "14-Step Booking", href: "/book" },
  { name: "Client Portal", href: "#client-portal" },
  { name: "Vendor Dashboard", href: "/dashboard" },
];

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user: authUser } = useAuth();
  const { user, loading } = useRequireAuth("vendor");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-32 bg-[#1e293b]" />
          <Skeleton className="h-4 w-full bg-[#1e293b]" />
          <Skeleton className="h-4 w-3/4 bg-[#1e293b]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-[#A3E635] text-[#0f172a] font-semibold"
                : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1e293b] bg-[#111827]">
        <span className="font-bold text-white text-lg">FlowApp</span>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] bg-[#111827] border-[#1e293b] p-4">
            <div className="mb-6 mt-2">
              <div className="font-bold text-white text-xl">FlowApp</div>
              <div className="text-xs text-gray-500 mt-1">{authUser?.name ?? "Studio"}</div>
            </div>
            <nav className="flex flex-col gap-1">
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-52 flex-col bg-[#111827] border-r border-[#1e293b] min-h-screen shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#1e293b]">
          <div className="font-bold text-white text-lg leading-tight">FlowApp</div>
          <div className="text-xs text-[#94a3b8] mt-0.5">{authUser?.name ?? "Studio"}</div>
          <div className="text-[10px] text-[#A3E635] mt-0.5 font-medium">Vendor (Pro Plan)</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <NavLinks />
        </nav>

        {/* Billing info */}
        <div className="px-4 py-3 border-t border-[#1e293b] text-[10px] text-[#64748b] space-y-0.5">
          <div className="font-semibold text-[#94a3b8]">Billing Langganan:</div>
          <div>Pro Plan (Rp399.000/bln)</div>
          <div>Aktif s/d 12 Des 2026</div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs px-2 mt-2 h-7">
            <LogOut className="h-3 w-3 mr-1.5" /> Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col min-h-screen">
        {/* Simulate View Bar */}
        <div className="hidden md:flex items-center gap-2 px-6 py-2 bg-[#0f172a] border-b border-[#1e293b] shrink-0">
          <span className="text-xs text-[#64748b] mr-1">Simulate View:</span>
          {simulateViews.map((v) => {
            const isActive = v.href === location || (v.name === "Vendor Dashboard" && location.startsWith("/dashboard"));
            return (
              <Link
                key={v.name}
                href={v.href}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isActive
                    ? "bg-[#A3E635] text-[#0f172a] font-semibold"
                    : "text-[#94a3b8] hover:text-white border border-[#1e293b] hover:border-[#374151]"
                }`}
              >
                {v.name}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="text-xs px-3 py-1 rounded-full text-[#94a3b8] hover:text-white border border-[#1e293b] hover:border-[#374151] ml-1"
          >
            Super Admin
          </Link>
        </div>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
