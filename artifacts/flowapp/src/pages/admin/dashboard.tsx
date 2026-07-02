import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { DollarSign, Users, ShoppingCart, Settings, Plus, Ban, CheckCircle } from "lucide-react";

interface Stats { totalTenants: number; totalBookings: number; platformFees: number; platformStatus: string; }
interface Tenant { id: number; slug: string; studioName: string; ownerName: string; category: string; location: string; plan: string; rating: number; active: boolean; }

function fmtIDR(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function AdminDashboard() {
  const { user, loading } = useRequireAuth("super_admin");
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/tenants", { credentials: "include" }).then(r => r.json()),
    ]).then(([s, t]) => { setStats(s); setTenants(t); }).finally(() => setLoadingData(false));
  }, [user]);

  const suspend = async (id: number) => {
    await fetch(`/api/admin/tenants/${id}/suspend`, { method: "POST", credentials: "include" });
    setTenants(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingData ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 bg-[#374151]" />) : (
            <>
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-[#A3E635]" />
                  <div>
                    <div className="text-[10px] text-gray-400">Platform Fees (5%)</div>
                    <div className="text-white font-bold text-sm">{fmtIDR(stats?.platformFees ?? 0)}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-[#A3E635]" />
                  <div>
                    <div className="text-[10px] text-gray-400">Total Tenant Vendor</div>
                    <div className="text-white font-bold text-sm">{stats?.totalTenants} Tenant</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="p-4 flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-[#A3E635]" />
                  <div>
                    <div className="text-[10px] text-gray-400">Total Booking SaaS</div>
                    <div className="text-white font-bold text-sm">{stats?.totalBookings} Trx</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="p-4 flex items-center gap-3">
                  <Settings className="h-8 w-8 text-[#A3E635]" />
                  <div>
                    <div className="text-[10px] text-gray-400">Platform Status</div>
                    <div className="text-green-400 font-bold text-xs">{stats?.platformStatus}</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="bg-[#1F2937] rounded-lg border border-[#374151]">
          <div className="flex items-center justify-between p-4 border-b border-[#374151]">
            <h2 className="text-white font-semibold text-sm">Terdaftar Tenant Vendor</h2>
            <Button size="sm" onClick={() => navigate("/admin/tenants/new")} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] text-xs h-7">
              <Plus className="h-3 w-3 mr-1" /> Daftarkan Vendor Baru
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-[#374151]">
                  <th className="text-left p-3">Nama Brand</th>
                  <th className="text-left p-3">Owner / PIC</th>
                  <th className="text-left p-3">Kategori</th>
                  <th className="text-left p-3">Domisili</th>
                  <th className="text-left p-3">Rating</th>
                  <th className="text-left p-3">Langganan SaaS</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-[#374151] hover:bg-[#374151]/50">
                    <td className="p-3 text-white font-medium">{t.studioName}</td>
                    <td className="p-3 text-gray-300">{t.ownerName}</td>
                    <td className="p-3">
                      <span className="bg-[#A3E635]/20 text-[#A3E635] px-2 py-0.5 rounded text-[10px] uppercase font-medium">{t.category}</span>
                    </td>
                    <td className="p-3 text-gray-300">{t.location}</td>
                    <td className="p-3 text-gray-300">{t.rating?.toFixed(1)} / 5.0</td>
                    <td className="p-3">
                      <span className="text-[#A3E635] text-[10px] font-medium uppercase">{t.plan} Plan</span>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => suspend(t.id)}
                        className="h-6 text-[10px] px-2"
                      >
                        {t.active ? (<><Ban className="h-3 w-3 mr-1" />Suspend</>) : (<><CheckCircle className="h-3 w-3 mr-1" />Aktifkan</>)}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
