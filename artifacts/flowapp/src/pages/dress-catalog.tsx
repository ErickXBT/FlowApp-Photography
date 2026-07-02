import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil } from "lucide-react";

interface DressItem { id: number; name: string; type: string; size: string | null; color: string | null; status: string; imageUrl: string | null; notes: string | null; }

const typeLabels: Record<string, string> = { gaun: "Gaun", kebaya: "Kebaya", jas: "Jas", suit: "Suit", aksesoris: "Aksesoris", lainnya: "Lainnya" };
const statusColors: Record<string, string> = { available: "bg-green-500/20 text-green-400 border-green-500/30", booked: "bg-orange-500/20 text-orange-400 border-orange-500/30", maintenance: "bg-gray-500/20 text-gray-400 border-gray-500/30" };

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

  if (loading || !user) return <div className="min-h-screen bg-[#111827]" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-white font-bold text-2xl">Dress Catalog</h1>
        <Button onClick={() => { setShowForm(true); setEditItem(null); }} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold text-sm">
          <Plus className="h-4 w-4 mr-1" /> Tambah Kostum
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#1F2937] border-[#374151]">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">{editItem ? "Edit Kostum" : "Tambah Kostum Baru"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-gray-300 text-xs">Nama Gaun / Jas</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-[#111827] border-[#4B5563] text-white text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Jenis</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger className="bg-[#111827] border-[#4B5563] text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Ukuran (Size)</Label>
                <Input value={form.size} onChange={e => setForm({...form, size: e.target.value})} placeholder="M, L, XL..."
                  className="bg-[#111827] border-[#4B5563] text-white text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">Warna Dominan</Label>
                <Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="White, Red..."
                  className="bg-[#111827] border-[#4B5563] text-white text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300 text-xs">URL Foto</Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..."
                  className="bg-[#111827] border-[#4B5563] text-white text-sm" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-gray-300 text-xs">Catatan</Label>
                <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="bg-[#111827] border-[#4B5563] text-white text-sm" />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold text-sm">
                  {editItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}
                  className="border-[#4B5563] text-gray-300 text-sm">Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loadingData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 bg-[#374151]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-[#1F2937] rounded-lg overflow-hidden border border-[#374151]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-[#374151] flex items-center justify-center text-gray-500 text-sm">Tidak ada foto</div>
              )}
              <div className="p-3">
                <div className="font-medium text-white text-sm">{item.name}</div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {item.size && `Size: ${item.size}`}{item.color && ` | ${item.color}`}
                </div>
                <div className="text-gray-500 text-xs">{typeLabels[item.type] ?? item.type}</div>
                <div className="flex items-center justify-between mt-2">
                  <button onClick={() => toggleStatus(item)}
                    className={`text-xs font-medium px-2 py-0.5 rounded border cursor-pointer ${statusColors[item.status]}`}>
                    {item.status === "available" ? "Available" : item.status === "booked" ? "Booked" : "Maintenance"}
                  </button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-500">
              Belum ada kostum. Klik "Tambah Kostum" untuk mulai.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
