import { useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { user, loading } = useRequireAuth("super_admin");
  const [platformName, setPlatformName] = useState("FlowApp");
  const [feePercent, setFeePercent] = useState("5");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl space-y-6">
        <h1 className="text-white font-bold text-xl">Pengaturan Platform</h1>

        <Card className="bg-[#1F2937] border-[#374151]">
          <CardHeader><CardTitle className="text-white text-sm">Konfigurasi Umum</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Nama Platform</Label>
              <Input value={platformName} onChange={e => setPlatformName(e.target.value)}
                className="bg-[#111827] border-[#4B5563] text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Platform Fee (%)</Label>
              <Input type="number" value={feePercent} onChange={e => setFeePercent(e.target.value)}
                className="bg-[#111827] border-[#4B5563] text-white" />
              <p className="text-gray-500 text-xs">Persentase fee yang dipotong dari setiap transaksi vendor</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-sm">Maintenance Mode</div>
                <div className="text-gray-500 text-xs">Nonaktifkan akses publik sementara</div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1F2937] border-[#374151]">
          <CardHeader><CardTitle className="text-white text-sm">Keamanan & Akses</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Ganti Password Admin</Label>
              <Input type="password" placeholder="Password baru"
                className="bg-[#111827] border-[#4B5563] text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300 text-xs">Konfirmasi Password</Label>
              <Input type="password" placeholder="Ulangi password baru"
                className="bg-[#111827] border-[#4B5563] text-white placeholder:text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold">
          {saved ? "✓ Tersimpan!" : "Simpan Pengaturan"}
        </Button>
      </div>
    </AdminLayout>
  );
}
