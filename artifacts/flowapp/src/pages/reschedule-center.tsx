import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface RescheduleRequest { id: number; bookingId: number; oldDate: string; newDate: string; reason: string; status: string; createdAt: string; }

export default function RescheduleCenter() {
  const { user, loading } = useRequireAuth("vendor");
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchRequests = async () => {
    const res = await fetch("/api/reschedule-requests", { credentials: "include" });
    setRequests(await res.json());
    setLoadingData(false);
  };

  useEffect(() => { if (user) fetchRequests(); }, [user]);

  const approve = async (id: number) => {
    await fetch(`/api/reschedule-requests/${id}/approve`, { method: "PATCH", credentials: "include" });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
  };

  const reject = async (id: number) => {
    await fetch(`/api/reschedule-requests/${id}/reject`, { method: "PATCH", credentials: "include" });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
  };

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  const pending = requests.filter(r => r.status === "pending");
  const others = requests.filter(r => r.status !== "pending");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-white font-bold text-2xl">Reschedule Center</h1>
      <p className="text-gray-400 text-sm">Tinjau permintaan perubahan tanggal pemotretan dari klien Anda. Vendor akan meninjau ketersediaan kru sebelum memberikan persetujuan.</p>

      {loadingData ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 bg-[#374151]" />)}</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[#A3E635] text-sm font-semibold">Menunggu Persetujuan ({pending.length})</h2>
              {pending.map(r => (
                <Card key={r.id} className="bg-[#1F2937] border-[#374151]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="text-white font-medium text-sm">Booking ID: {r.bookingId}</div>
                        <div className="text-gray-400 text-xs">
                          Jadwal Lama: <span className="text-white">{r.oldDate}</span>
                          {" → "}
                          Jadwal Usulan Baru: <span className="text-[#A3E635]">{r.newDate}</span>
                        </div>
                        <div className="text-gray-400 text-xs">Alasan: "{r.reason}"</div>
                        <div className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("id-ID")}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(r.id)}
                          className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] text-xs h-7">
                          <CheckCircle className="h-3 w-3 mr-1" />Setujui
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => reject(r.id)} className="text-xs h-7">
                          <XCircle className="h-3 w-3 mr-1" />Tolak
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-gray-400 text-sm font-semibold">Riwayat ({others.length})</h2>
              {others.map(r => (
                <div key={r.id} className="bg-[#1F2937] border border-[#374151] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-white text-sm">Booking ID: {r.bookingId}</div>
                      <div className="text-gray-400 text-xs">{r.oldDate} → {r.newDate}</div>
                      <div className="text-gray-500 text-xs">{r.reason}</div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                      r.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {r.status === "approved" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {r.status === "approved" ? "Disetujui" : "Ditolak"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-10 w-10 mx-auto mb-2 text-gray-600" />
              <p>Tidak ada permintaan reschedule saat ini.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
