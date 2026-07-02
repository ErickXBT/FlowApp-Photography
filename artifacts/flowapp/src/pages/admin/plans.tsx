import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

interface Plan { id: string; name: string; price: number; features: string[]; }

function fmtIDR(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function AdminPlans() {
  const { user, loading } = useRequireAuth("super_admin");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/plans", { credentials: "include" })
      .then(r => r.json()).then(setPlans).finally(() => setLoadingData(false));
  }, [user]);

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-white font-bold text-xl">Konfigurasi Subscription Package</h1>

        {loadingData ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 bg-[#374151]" />)}</div>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <Card key={plan.id} className="bg-[#1F2937] border-[#374151]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-3">
                        <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                        <span className="text-[#A3E635] font-bold">{fmtIDR(plan.price)}</span>
                        <span className="text-gray-400 text-sm">/ bln</span>
                      </div>
                      <div className="space-y-1">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check className="h-3 w-3 text-[#A3E635]" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-[#4B5563] text-gray-300 hover:text-white text-xs">
                      Edit Detail Paket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
