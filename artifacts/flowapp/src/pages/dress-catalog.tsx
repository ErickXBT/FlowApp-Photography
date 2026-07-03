import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface DressItem { id: number; name: string; type: string; size: string | null; color: string | null; status: string; imageUrl: string | null; notes: string | null; }

const typeLabels: Record<string, string> = { gaun: "Gaun", kebaya: "Kebaya", jas: "Jas", suit: "Suit", aksesoris: "Aksesoris", lainnya: "Lainnya" };
const statusColors: Record<string, string> = {
  available: "bg-green-500/20 text-green-400 border-green-500/30",
  booked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  maintenance: "bg-gray-500/20 text-gray-400 border-gray-500/30"
};

export default function DressCatalog() {
  const { user, loading } = useRequireAuth("vendor");
  const [items, setItems] = useState<DressItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DressItem | null>(null);
  const [form, setForm] = useState({ name: "", type: "gaun", size: "", color: "", imageUrl: "", notes: "" });

  const fetchItems = async () => {
    const res = await fetch("/api/dress-catalog", { credentials: "include" });
    setItems(await res.json());
    setLoadingData(false);
  };

  useEffect(() => { if (user) fetchItems(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editItem ? "PATCH" : "POST";
    const url = editItem ? `/api/dress-catalog/${editItem.id}` : "/api/dress-catalog";
    await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await fetchItems();
    setShowForm(false);
    setEditItem(null);
    setForm({ name: "", type: "gaun", size: "", color: "", imageUrl: "", notes: "" });
  };

  const openEdit = (item: DressItem) => {
    setEditItem(item);
    setForm({ name: item.name, type: item.type, size: item.size ?? "", color: item.color ?? "", imageUrl: item.imageUrl ?? "", notes: item.notes ?? "" });
    setShowForm(true);
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/dress-catalog/${id}`, { method: "DELETE", credentials: "include" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleStatus = async (item: DressItem) => {
    const nextStatus = item.status === "available" ? "booked" : "available";
    await fetch(`/api/dress-catalog/${item.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
  };

  if (loading || !user) return <div className="min-h-screen bg-[#0f172a]" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-white font-bold text-2xl">Dress Catalog</h1>
        <Button
          onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: "", type: "gaun", size: "", color: "", imageUrl: "", notes: "" }); }}
          className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Tambah Kostum
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#1e293b] border-[#2d3748]">
          <CardContent className="p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">{editItem ? "Edit Kostum" : "Tambah Kostum Baru"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Nama Gaun / Jas</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0f172a] border-[#374151] text-white text-sm" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Jenis</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-[#0f172a] border-[#374151] text-white text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Ukuran (Size)</Label>
                  <Input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="M, L, XL..."
                    className="bg-[#0f172a] border-[#374151] text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Warna Dominan</Label>
                <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="White, Red..."
                  className="bg-[#0f172a] border-[#374151] text-white text-sm" />
              </div>

              {/* Image upload with URL fallback */}
              <ImageUpload
                label="Foto Kostum"
                value={form.imageUrl}
                onChange={url => setForm({ ...form, imageUrl: url })}
                accept="image/*"
              />

              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Catatan</Label>
                <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="bg-[#0f172a] border-[#374151] text-white text-sm" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {editItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="border-[#374151] text-[#94a3b8] text-sm">Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loadingData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 bg-[#1e293b]" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-[#475569]">
          <p>Belum ada kostum. Klik "Tambah Kostum" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-[#1e293b] rounded-xl overflow-hidden border border-[#2d3748] hover:border-[#A3E635]/30 transition-colors">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-[#0f172a] flex items-center justify-center text-[#475569] text-xs">Tidak ada foto</div>
              )}
              <div className="p-3 space-y-1.5">
                <div className="font-semibold text-white text-sm leading-tight">{item.name}</div>
                <div className="text-[#64748b] text-xs">
                  {item.size && `Size: ${item.size}`}{item.color && ` · ${item.color}`}
                </div>
                <div className="text-[#475569] text-[10px]">{typeLabels[item.type] ?? item.type}</div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer transition-colors ${statusColors[item.status]}`}
                  >
                    {item.status === "available" ? "Available" : item.status === "booked" ? "Booked" : "Maintenance"}
                  </button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#2d3748]" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5 text-[#94a3b8]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-900/20" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
