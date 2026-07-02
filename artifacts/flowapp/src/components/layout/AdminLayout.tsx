import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, CreditCard, Activity, Settings, LogOut, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Tenant Management", href: "/admin", icon: Users },
  { name: "SaaS Subscription Plans", href: "/admin/plans", icon: CreditCard },
  { name: "Platform Activity Log", href: "/admin/activity", icon: Activity },
  { name: "Pengaturan", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#111827] flex">
      <div className="w-52 bg-[#1F2937] flex flex-col border-r border-[#374151]">
        <div className="p-4 border-b border-[#374151]">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-[#A3E635] rounded p-1">
              <Camera className="h-4 w-4 text-[#1F2937]" />
            </div>
            <span className="font-serif font-bold text-white text-sm">FlowApp</span>
            <span className="text-[10px] text-[#A3E635] border border-[#A3E635] rounded px-1">SaaS</span>
          </div>
          <div className="bg-[#374151] rounded p-2">
            <div className="font-medium text-white text-xs">FlowAdmin</div>
            <div className="text-[#A3E635] text-[10px]">Super Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
                  isActive
                    ? "bg-[#A3E635] text-[#1F2937] font-semibold"
                    : "text-gray-400 hover:bg-[#374151] hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#374151] space-y-2">
          <div className="text-[10px] text-gray-500">Core Version: v1.2.0-SaaS</div>
          <div className="text-[10px] text-green-400">API Health: Healthy (100%)</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs px-2"
          >
            <LogOut className="h-3 w-3 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#1F2937] border-b border-[#374151] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Super Admin</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400">Logged in as <span className="text-white">{user?.name}</span></div>
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
