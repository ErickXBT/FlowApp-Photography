import { useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NewTenant() {
  const { user, loading } = useRequireAuth("super_admin");
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    studioName: "", ownerName: "", email: "", password: "",
    category: "Photography & Videography", location: "Jakarta, Indonesia",
    plan: "starter", whatsapp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create tenant");
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="text-gray-400 hover:text-white mb-4 text-xs">
          <ArrowLeft className="h-3 w-3 mr-1" /> Kembali
        </Button>
        <Card className="bg-[#1F2937] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-white">Daftarkan Vendor Baru</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="text-[#A3E635] text-5xl mb-3">✓</div>
                <p className="text-white font-medium">Vendor berhasil didaftarkan!</p>
                <p className="text-gray-400 text-sm mt-1">Mengalihkan ke dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Nama Studio / Brand</Label>
                    <Input value={form.studioName} onChange={e => setForm({...form, studioName: e.target.value})}
                      className="bg-[#111827] border-[#4B5563] text-white text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Nama Owner / PIC</Label>
                    <Input value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})}
                      className="bg-[#111827] border-[#4B5563] text-white text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Email Login</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="bg-[#111827] border-[#4B5563] text-white text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Password Awal</Label>
                    <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      className="bg-[#111827] border-[#4B5563] text-white text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})}
                      placeholder="+628..." className="bg-[#111827] border-[#4B5563] text-white text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Domisili</Label>
                    <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                      className="bg-[#111827] border-[#4B5563] text-white text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Kategori</Label>
                    <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                      <SelectTrigger className="bg-[#111827] border-[#4B5563] text-white text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Photography & Videography">Photography & Videography</SelectItem>
                        <SelectItem value="MUA & Hair Stylist">MUA & Hair Stylist</SelectItem>
                        <SelectItem value="Wedding Organizer">Wedding Organizer</SelectItem>
                        <SelectItem value="Venue & Decor">Venue & Decor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-xs">Paket SaaS</Label>
                    <Select value={form.plan} onValueChange={v => setForm({...form, plan: v})}>
                      <SelectTrigger className="bg-[#111827] border-[#4B5563] text-white text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter - Rp 199.000/bln</SelectItem>
                        <SelectItem value="pro">Pro - Rp 399.000/bln</SelectItem>
                        <SelectItem value="business">Business - Rp 799.000/bln</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold">
                  {submitting ? "Mendaftarkan..." : "Daftarkan Vendor"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
