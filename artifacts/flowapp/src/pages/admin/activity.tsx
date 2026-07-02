import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

interface ActivityItem { message: string; time: string; }

export default function AdminActivity() {
  const { user, loading } = useRequireAuth("super_admin");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/activity", { credentials: "include" })
      .then(r => r.json()).then(setActivities).finally(() => setLoadingData(false));
  }, [user]);

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-white font-bold text-xl">Platform System Activity</h1>

        <Card className="bg-[#1F2937] border-[#374151]">
          <CardContent className="p-4">
            {loadingData ? (
              <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 bg-[#374151]" />)}</div>
            ) : (
              <div className="space-y-0">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#374151] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-[#A3E635] rounded-full flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{a.message}</span>
                    </div>
                    <span className="text-gray-500 text-xs whitespace-nowrap ml-4">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
