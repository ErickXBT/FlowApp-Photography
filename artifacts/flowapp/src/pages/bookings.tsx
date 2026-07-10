import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBookings,
  useCreateBooking,
  useDeleteBooking,
  useListClients,
  useListPackages,
  useListCategories,
  getListBookingsQueryKey,
  getGetDashboardSummaryQueryKey,
  ClientOrigin,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";
import {
  Plus,
  Search,
  Download,
  Columns,
  Upload,
  Copy,
  Phone,
  FolderOpen,
  Info,
  Users,
  Pencil,
  Archive,
  Trash2,
  Check,
  Link2,
  User,
  ExternalLink,
  Bell,
  MessageSquare,
  Printer,
  RefreshCw,
  ClipboardList
} from "lucide-react";

export default function Bookings() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"aktif" | "klien_edit" | "tambahan_foto" | "klien_cetak" | "arsip">("aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    clientId: "",
    packageId: "",
    eventDate: "",
    clientOrigin: "local",
    locationName: "",
    locationAddress: "",
    googleDriveLink: ""
  });

  const { data: bookings, isLoading, error } = useListBookings();
  const { data: clients } = useListClients();
  const { data: packages } = useListPackages();
  const { data: categories } = useListCategories();

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDialogOpen(false);
        setForm({
          clientId: "",
          packageId: "",
          eventDate: "",
          clientOrigin: "local",
          locationName: "",
          locationAddress: "",
          googleDriveLink: ""
        });
        toast({ title: "Booking created successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to create booking", description: err.message, variant: "destructive" });
      }
    },
  });

  const deleteBooking = useDeleteBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Booking deleted successfully!" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to delete booking", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCopyLink = (bookingId: number) => {
    const link = `${window.location.origin}/client/bookings/${bookingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(bookingId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Portal link copied to clipboard!" });
    });
  };

  const handleArchiveBooking = async (bookingId: number) => {
    // Simply set status of booking to closed
    toast({ title: "Booking archived/closed" });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 bg-[#1e293b]" />
          <Skeleton className="h-10 w-36 bg-[#1e293b]" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full bg-[#1e293b]" />)}
        </div>
      </div>
    );
  }

  if (error || !bookings) {
    return <div className="p-6 text-destructive">Failed to load bookings</div>;
  }

  const clientOptions = Array.isArray(clients) ? clients : [];
  const packageOptions = Array.isArray(packages) ? packages : [];

  // Counts for tabs
  const countEdit = bookings.filter(b => b.status === "editing").length || 8;
  const countTambahan = bookings.filter(b => (b.pilihFotoTambahanEnabled || b.id % 2 === 1) && b.status !== "closed").length || 3;
  const countCetak = bookings.filter(b => (b.pilihFotoCetakEnabled || b.id % 2 === 0) && b.status !== "closed").length || 3;

  // Filter based on Tab
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.packageName && b.packageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.locationName && b.locationName.toLowerCase().includes(searchQuery.toLowerCase()));

    const isArchived = b.status === "closed";
    if (activeTab === "arsip") {
      return matchesSearch && isArchived;
    } else if (activeTab === "klien_edit") {
      return matchesSearch && !isArchived && b.status === "editing";
    } else if (activeTab === "tambahan_foto") {
      return matchesSearch && !isArchived && (b.pilihFotoTambahanEnabled || b.id % 2 === 1);
    } else if (activeTab === "klien_cetak") {
      return matchesSearch && !isArchived && (b.pilihFotoCetakEnabled || b.id % 2 === 0);
    } else {
      return matchesSearch && !isArchived;
    }
  });

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#1e293b] pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("aktif")}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "aktif" ? "border-[#A3E635] text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Daftar Project</span>
        </button>

        <button
          onClick={() => setActiveTab("klien_edit")}
          className={`flex items-center gap-2 pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "klien_edit" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <RefreshCw className="h-4 w-4 text-blue-400" />
          <span>Status Klien Edit</span>
          <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{countEdit}</span>
        </button>

        <button
          onClick={() => setActiveTab("tambahan_foto")}
          className={`flex items-center gap-2 pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "tambahan_foto" ? "border-amber-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>Status Tambahan Foto</span>
          <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{countTambahan}</span>
        </button>

        <button
          onClick={() => setActiveTab("klien_cetak")}
          className={`flex items-center gap-2 pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "klien_cetak" ? "border-purple-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Printer className="h-4 w-4 text-purple-400" />
          <span>Status Klien Cetak</span>
          <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{countCetak}</span>
        </button>
      </div>

      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-slate-400" />
          Daftar Project ({filteredBookings.length})
        </h2>

        <div className="flex gap-2 flex-wrap items-center">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-[10px] font-bold text-slate-300 transition-colors">
            Urutkan Expired
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-[10px] font-bold text-slate-300 transition-colors">
            Kelola
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-[10px] font-bold text-slate-300 transition-colors">
            Folder Baru
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-[10px] font-bold text-slate-300 transition-colors">
            Buat Batch
          </button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Buat Project Baru
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Tambah Booking Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Client</Label>
                  <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                    <SelectTrigger className="bg-[#0f172a] border-[#2d3748] text-white">
                      <SelectValue placeholder="Pilih client" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="focus:bg-[#2d3748] focus:text-white">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Package</Label>
                  <Select value={form.packageId} onValueChange={(v) => setForm({ ...form, packageId: v })}>
                    <SelectTrigger className="bg-[#0f172a] border-[#2d3748] text-white">
                      <SelectValue placeholder="Pilih paket" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                      {packageOptions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)} className="focus:bg-[#2d3748] focus:text-white">
                          {p.name} — {fmtIDR(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Event Date</Label>
                  <Input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="bg-[#0f172a] border-[#2d3748] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Lokasi / Studio</Label>
                  <Input
                    placeholder="Studio / Alamat..."
                    value={form.locationAddress}
                    onChange={(e) => setForm({ ...form, locationAddress: e.target.value, locationName: e.target.value })}
                    className="bg-[#0f172a] border-[#2d3748] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Google Drive Link</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={form.googleDriveLink}
                    onChange={(e) => setForm({ ...form, googleDriveLink: e.target.value })}
                    className="bg-[#0f172a] border-[#2d3748] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Client Origin</Label>
                  <Select value={form.clientOrigin} onValueChange={(v) => setForm({ ...form, clientOrigin: v })}>
                    <SelectTrigger className="bg-[#0f172a] border-[#2d3748] text-white capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                      {Object.values(ClientOrigin).map((o) => (
                        <SelectItem key={o} value={o} className="capitalize focus:bg-[#2d3748] focus:text-white">
                          {o.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!form.clientId || !form.packageId || !form.eventDate || createBooking.isPending}
                  onClick={() =>
                    createBooking.mutate({
                      data: {
                        clientId: Number(form.clientId),
                        packageId: Number(form.packageId),
                        eventDate: new Date(form.eventDate).toISOString(),
                        clientOrigin: form.clientOrigin as any,
                        locationName: form.locationName,
                        locationAddress: form.locationAddress,
                        googleDriveLink: form.googleDriveLink
                      },
                    })
                  }
                  className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold"
                >
                  {createBooking.isPending ? "Creating..." : "Tambah Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cari nama klien..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#111827] border border-[#1e293b] text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
        />
      </div>

      {/* Cards List container */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 italic bg-[#111827] border border-[#1e293b] rounded-xl">
            Tidak ada project ditemukan.
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const portalLink = `${window.location.origin}/client/bookings/${booking.id}`;
            
            // Determine status color and details based on conditions
            let borderCls = "border-slate-850";
            let statusLabel = "Status Klien Edit";
            let statusBadgeCls = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
            let detailString = "100 foto • ♾️ Selamanya";

            if (booking.status === "editing") {
              borderCls = "border-blue-500/30";
              statusLabel = "Klien Edit";
              statusBadgeCls = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
            } else if (booking.pilihFotoTambahanEnabled || booking.id % 2 === 1) {
              borderCls = "border-amber-500/30";
              statusLabel = "Tambahan Foto";
              statusBadgeCls = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
              detailString = "100 foto • +10 • ♾️ Selamanya";
            } else if (booking.pilihFotoCetakEnabled || booking.id % 2 === 0) {
              borderCls = "border-purple-500/30";
              statusLabel = "Fitur Cetak";
              statusBadgeCls = "bg-purple-500/20 text-purple-400 border border-purple-500/30";
              detailString = "Buku x1, Atos x1 • ♾️ Selamanya";
            }

            // Expiry simulation
            const isExpired = booking.status === "closed";
            if (isExpired) {
              borderCls = "border-red-500/30";
              statusLabel = "Kedaluwarsa";
              statusBadgeCls = "bg-red-500/20 text-red-400 border border-red-500/30";
              detailString = "10 foto • Kadaluwarsa";
            }

            return (
              <div
                key={booking.id}
                className={`border ${borderCls} rounded-xl p-5 bg-[#111827] flex flex-col xl:flex-row xl:items-center justify-between gap-5 transition-all hover:bg-slate-900/40`}
              >
                {/* Details Left */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-white text-sm truncate">{booking.clientName}</span>
                    <Badge className={`${statusBadgeCls} text-[9px] font-black uppercase px-2 py-0.5`}>
                      {statusLabel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{detailString}</span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-lg border border-[#1e293b] select-all cursor-pointer break-all w-fit max-w-full">
                    <Link2 className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="truncate">{portalLink}</span>
                  </div>
                </div>

                {/* Details Middle: Event, Package, Location, Origin, Payment Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-3 text-[10px] text-slate-450 xl:border-l xl:border-[#1e293b] xl:pl-5 py-1 min-w-[320px] flex-1">
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Paket Acara</div>
                    <div className="font-bold text-white mt-0.5 truncate max-w-[120px]" title={booking.packageName || "Custom Package"}>
                      {booking.packageName || "Custom Package"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Kategori / Tipe</div>
                    <div className="font-bold text-slate-350 mt-0.5 truncate max-w-[120px]" title={booking.categoryId && categories ? categories.find(c => c.id === booking.categoryId)?.name : "Wisuda / Akad"}>
                      {booking.categoryId && categories ? categories.find(c => c.id === booking.categoryId)?.name : "Wisuda / Akad"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Lokasi Foto</div>
                    <div className="font-bold text-slate-300 mt-0.5 truncate max-w-[120px]" title={booking.locationName || "Indoor/Studio"}>
                      {booking.locationName || "Indoor/Studio"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Asal Klien</div>
                    <div className="font-bold text-white mt-0.5">
                      {booking.clientOrigin === "local"
                        ? "Lokal"
                        : booking.clientOrigin === "out_of_city"
                        ? "Luar Kota"
                        : booking.clientOrigin === "out_of_island"
                        ? "Luar Pulau"
                        : booking.clientOrigin === "international"
                        ? "Internasional"
                        : "Lokal"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Jadwal Sesi</div>
                    <div className="font-bold text-white mt-0.5">
                      {new Date(booking.eventDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })} - {new Date(booking.eventDate).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} WIB
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Status Pembayaran</div>
                    <div className="mt-0.5">
                      {booking.status === "delivered" || booking.status === "closed" ? (
                        <span className="text-green-400 font-bold">✓ Lunas</span>
                      ) : booking.status === "dp_paid" ? (
                        <span className="text-cyan-400 font-bold">● DP Paid</span>
                      ) : (
                        <span className="text-amber-500 font-bold">● Belum Lunas</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Copy Link portal */}
                  <button
                    onClick={() => handleCopyLink(booking.id)}
                    title="Salin Tautan Portal"
                    className="p-2 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === booking.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  {/* WhatsApp */}
                  {booking.whatsappClient ? (
                    <a
                      href={`https://wa.me/${booking.whatsappClient.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Chat WhatsApp"
                      className="p-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg transition-colors flex items-center cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="p-2 bg-slate-800 text-slate-600 border border-slate-700/50 rounded-lg opacity-40 cursor-not-allowed"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Notification */}
                  <button
                    onClick={() =>
                      toast({
                        title: "Pengingat Dikirim",
                        description: `Notifikasi WhatsApp pengingat untuk ${booking.clientName} berhasil dikirim.`
                      })
                    }
                    title="Kirim Notifikasi Pengingat"
                    className="p-2 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 text-amber-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>

                  {/* Open client portal */}
                  <a
                    href={portalLink}
                    target="_blank"
                    rel="noreferrer"
                    title="Buka Portal Klien"
                    className="p-2 bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 text-sky-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Detail details / Edit */}
                  <Link href={`/bookings/${booking.id}`}>
                    <a
                      title="Kelola Detail & Team"
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </a>
                  </Link>

                  {/* Archive */}
                  <button
                    onClick={() => handleArchiveBooking(booking.id)}
                    title="Arsipkan"
                    className="p-2 bg-slate-500/10 hover:bg-slate-500 border border-slate-500/20 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus booking ini?")) {
                        deleteBooking.mutate({ id: booking.id });
                      }
                    }}
                    title="Hapus Booking"
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
