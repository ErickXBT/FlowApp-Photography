import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
  useListPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  getListPackagesQueryKey,
  useListAddOns,
  useCreateAddOn,
  useUpdateAddOn,
  useDeleteAddOn,
  getListAddOnsQueryKey,
} from "@workspace/api-client-react";
import type { Category, Package, AddOn } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  Settings,
  Search,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  Phone,
  Check
} from "lucide-react";
import { fmtIDR } from "@/lib/utils";

export default function Packages() {
  const [activeTab, setActiveTab] = useState("packages");
  const { toast } = useToast();

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Layanan & Paket</h1>
          <p className="text-slate-400 text-xs mt-1">
            Kelola katalog layanan dan harga yang ditawarkan ke klien.
          </p>
        </div>
      </div>

      {/* Tabs Switch */}
      <Tabs defaultValue="packages" onValueChange={setActiveTab}>
        <TabsList className="bg-[#111827] border border-[#1e293b] p-1 text-slate-400">
          <TabsTrigger value="packages" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-xs font-semibold">
            Paket Utama
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-xs font-semibold">
            Kategori
          </TabsTrigger>
          <TabsTrigger value="addons" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white text-xs font-semibold">
            Paket Add-on
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="packages" className="pt-4"><PackagesTab /></TabsContent>
        <TabsContent value="categories" className="pt-4"><CategoriesTab /></TabsContent>
        <TabsContent value="addons" className="pt-4"><AddOnsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useListCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  const create = useCreateCategory({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setForm({ name: "", description: "" }); toast({ title: "Category created" }); } } });
  const update = useUpdateCategory({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Category updated" }); } } });
  const remove = useDeleteCategory({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Category deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "" }); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description ?? "" }); setDialogOpen(true); };
  const submit = () => {
    const data = { name: form.name, description: form.description || undefined };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  if (isLoading) return <Skeleton className="h-40 w-full bg-[#1e293b]" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semua Kategori</span>
        <Button onClick={openCreate} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs"><Plus className="h-4 w-4 mr-1" /> Tambah Kategori</Button>
      </div>
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardContent className="p-0">
          <div className="divide-y divide-[#1e293b]">
            {categories?.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-4">
                <div>
                  <div className="font-bold text-white text-sm">{c.name}</div>
                  {c.description && <div className="text-xs text-slate-400 mt-1">{c.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="text-slate-300 hover:text-white hover:bg-slate-800"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: c.id })} className="text-red-400 hover:text-red-300 hover:bg-red-950/20"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {categories?.length === 0 && <div className="text-center py-8 text-slate-500 text-xs">Belum ada kategori layanan.</div>}
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Kategori" : "Kategori Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-slate-300">Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            <div className="space-y-1.5"><Label className="text-slate-300">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
          </div>
          <DialogFooter><Button disabled={!form.name} onClick={submit} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">{editing ? "Simpan" : "Buat"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackagesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: packages, isLoading } = useListPackages();
  const { data: categories } = useListCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({ name: "", categoryId: "", description: "", price: "", includedEditedPhotos: "", estimatedDays: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
  const create = useCreatePackage({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Package created" }); } } });
  const update = useUpdatePackage({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Package updated" }); } } });
  const remove = useDeletePackage({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Package deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", categoryId: "", description: "", price: "", includedEditedPhotos: "", estimatedDays: "" }); setDialogOpen(true); };
  const openEdit = (p: Package) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId ? String(p.categoryId) : "", description: p.description ?? "", price: String(p.price), includedEditedPhotos: String(p.includedEditedPhotos), estimatedDays: String(p.estimatedDays) });
    setDialogOpen(true);
  };
  
  const handleCopyLink = (p: Package) => {
    navigator.clipboard.writeText(`${window.location.origin}/book?package=${p.id}`);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Tautan paket disalin ke clipboard!" });
  };

  const submit = () => {
    const data = {
      name: form.name,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      description: form.description || undefined,
      price: Number(form.price),
      includedEditedPhotos: Number(form.includedEditedPhotos),
      estimatedDays: Number(form.estimatedDays),
    };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  const categoryName = (id?: number | null) => categories?.find((c) => c.id === id)?.name ?? "Uncategorized";

  if (isLoading) return <Skeleton className="h-40 w-full bg-[#1e293b]" />;

  const filteredPackages = packages
    ? packages.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Filter actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e293b] pb-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau deskripsi layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] text-white text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap w-full md:w-auto justify-end">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs font-semibold transition-colors">
            <ArrowUpDown className="h-3.5 w-3.5" /> Atur Urutan
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs font-semibold transition-colors">
            <Settings className="h-3.5 w-3.5" /> Kelola
          </button>
          <Button onClick={openCreate} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Layanan
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paket Utama</span>
          <Badge className="bg-[#1e293b] border-[#2d3748] text-slate-300 font-mono text-[9px]">
            {filteredPackages.length}
          </Badge>
        </div>
        
        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((p) => {
            const cat = categoryName(p.categoryId);
            return (
              <Card key={p.id} className="bg-[#111827] border-[#1e293b] flex flex-col justify-between overflow-hidden">
                {/* Header */}
                <CardHeader className="pb-3 border-b border-[#1e293b] bg-[#0f172a]/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {p.name}
                    </CardTitle>
                    <div className="flex gap-1.5">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Aktif
                      </span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Publik
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="pt-4 pb-3 space-y-4 flex-1">
                  {p.description && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>}
                  
                  {/* Category and coverage tags */}
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-[#1e293b] border-[#2d3748] text-slate-300 text-[8px] uppercase">
                      {cat}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-900/10 border border-purple-500/20 text-purple-400 text-[8px] capitalize">
                      Semua Kota/Kabupaten
                    </Badge>
                  </div>

                  <div className="pt-1.5 flex justify-between items-end border-t border-[#1e293b]/50">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-500">Harga Paket</div>
                      <div className="text-base font-black text-[#A3E635] mt-0.5">{fmtIDR(p.price)}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      ⏱ {p.includedEditedPhotos} foto • {p.estimatedDays} hari
                    </div>
                  </div>
                </CardContent>

                {/* Footer action buttons layout matching Image 1 */}
                <div className="px-5 py-3 border-t border-[#1e293b] bg-[#0f172a]/20 flex justify-between items-center gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#2d3748] rounded text-[10px] font-bold transition-colors"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Phone button */}
                    <button
                      onClick={() => toast({ title: "WhatsApp integration check" })}
                      className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/25 rounded-md transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    {/* View button */}
                    <button
                      onClick={() => window.open(`${window.location.origin}/book?package=${p.id}`, "_blank")}
                      className="p-1.5 bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/25 rounded-md transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {/* Copy Link button */}
                    <button
                      onClick={() => handleCopyLink(p)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-md transition-colors"
                    >
                      {copiedId === p.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => { if (confirm("Apakah Anda yakin ingin menghapus paket ini?")) remove.mutate({ id: p.id }); }}
                      className="p-1.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Order buttons */}
                    <div className="flex flex-col ml-1">
                      <button className="p-0.5 hover:text-white text-slate-500"><ChevronUp className="h-3 w-3" /></button>
                      <button className="p-0.5 hover:text-white text-slate-500"><ChevronDown className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filteredPackages.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-8 text-xs">Belum ada paket utama.</p>
          )}
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Paket" : "Paket Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-slate-300">Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Kategori</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="bg-[#0f172a] border-[#2d3748]"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                  {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)} className="focus:bg-[#2d3748]">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-slate-300">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-slate-300">Harga</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
              <div className="space-y-1.5"><Label className="text-slate-300">Foto Diedit</Label><Input type="number" value={form.includedEditedPhotos} onChange={(e) => setForm({ ...form, includedEditedPhotos: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
              <div className="space-y-1.5"><Label className="text-slate-300">Est. Hari</Label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            </div>
          </div>
          <DialogFooter><Button disabled={!form.name || !form.price} onClick={submit} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">{editing ? "Simpan" : "Buat"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddOnsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: addOns, isLoading } = useListAddOns();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddOn | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListAddOnsQueryKey() });
  const create = useCreateAddOn({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Add-on created" }); } } });
  const update = useUpdateAddOn({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Add-on updated" }); } } });
  const remove = useDeleteAddOn({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Add-on deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", price: "" }); setDialogOpen(true); };
  const openEdit = (a: AddOn) => { setEditing(a); setForm({ name: a.name, description: a.description ?? "", price: String(a.price) }); setDialogOpen(true); };
  const submit = () => {
    const data = { name: form.name, description: form.description || undefined, price: Number(form.price) };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  if (isLoading) return <Skeleton className="h-40 w-full bg-[#1e293b]" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paket Add-on</span>
          <Badge className="bg-[#1e293b] border-[#2d3748] text-slate-300 font-mono text-[9px]">
            {addOns?.length ?? 0}
          </Badge>
        </div>
        <Button onClick={openCreate} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs">
          <Plus className="h-4 w-4 mr-1" /> Tambah Add-on
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addOns?.map((a) => (
          <Card key={a.id} className="bg-[#111827] border-[#1e293b] flex flex-col justify-between overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#1e293b] bg-[#0f172a]/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {a.name}
                </CardTitle>
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Add-on
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-3 space-y-4 flex-1">
              {a.description && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{a.description}</p>}
              <div className="pt-1.5 flex justify-between items-end border-t border-[#1e293b]/50">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-500">Harga Add-on</div>
                  <div className="text-base font-black text-[#A3E635] mt-0.5">{fmtIDR(a.price)}</div>
                </div>
              </div>
            </CardContent>
            
            {/* Actions Footer */}
            <div className="px-5 py-3 border-t border-[#1e293b] bg-[#0f172a]/20 flex justify-between items-center gap-2">
              <button
                onClick={() => openEdit(a)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#2d3748] rounded text-[10px] font-bold transition-colors"
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </button>
              <button
                onClick={() => { if (confirm("Apakah Anda yakin ingin menghapus add-on ini?")) remove.mutate({ id: a.id }); }}
                className="p-1.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 rounded-md transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {addOns?.length === 0 && (
          <p className="text-slate-500 col-span-full text-center py-8 text-xs">Belum ada paket add-on.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Add-on" : "Add-on Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label className="text-slate-300">Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            <div className="space-y-1.5"><Label className="text-slate-300">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
            <div className="space-y-1.5"><Label className="text-slate-300">Harga</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#0f172a] border-[#2d3748]" /></div>
          </div>
          <DialogFooter><Button disabled={!form.name || !form.price} onClick={submit} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">{editing ? "Simpan" : "Buat"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
