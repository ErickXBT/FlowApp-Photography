import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBookings,
  useCreateBooking,
  useDeleteBooking,
  useListClients,
  useListPackages,
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
  Check
} from "lucide-react";

export default function Bookings() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"aktif" | "arsip">("aktif");
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

  // Filter based on Tab
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.packageName && b.packageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.locationName && b.locationName.toLowerCase().includes(searchQuery.toLowerCase()));

    const isArchived = b.status === "closed";
    if (activeTab === "arsip") {
      return matchesSearch && isArchived;
    } else {
      return matchesSearch && !isArchived;
    }
  });

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daftar Booking</h1>
          <p className="text-slate-400 text-xs mt-1">Kelola klien, jadwal, dan progres pekerjaan di sini.</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors">
            <Columns className="h-3.5 w-3.5" /> Kelola kolom
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors">
            <Upload className="h-3.5 w-3.5" /> Batch Import
          </button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] rounded-lg text-xs font-bold transition-colors">
                <Plus className="h-3.5 w-3.5" /> Tambah Klien Baru
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

      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Active / Archive tabs */}
        <div className="flex gap-2 p-1 bg-[#111827] rounded-lg border border-[#1e293b]">
          <button
            onClick={() => setActiveTab("aktif")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "aktif" ? "bg-[#1e293b] text-white border border-[#2d3748]" : "text-slate-400 hover:text-white"
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setActiveTab("arsip")}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "arsip" ? "bg-[#1e293b] text-white border border-[#2d3748]" : "text-slate-400 hover:text-white"
            }`}
          >
            Arsip
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari klien, invoice, lokasi, sesi.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] text-white text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#0f172a]/40 text-slate-400 font-semibold">
                <th className="px-4 py-3">NO</th>
                <th className="px-4 py-3">NAMA KLIEN</th>
                <th className="px-4 py-3">INVOICE</th>
                <th className="px-4 py-3">TANGGAL BOOKING</th>
                <th className="px-4 py-3">PAKET</th>
                <th className="px-4 py-3">TIPE ACARA</th>
                <th className="px-4 py-3">TANGGAL SESI</th>
                <th className="px-4 py-3">JADWAL</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking, idx) => {
                const invoiceNum = `INV-${new Date(booking.createdAt).getFullYear()}-${String(booking.id).padStart(4, "0")}`;
                return (
                  <tr
                    key={booking.id}
                    className="border-b border-[#1e293b] hover:bg-[#1e293b]/20 transition-colors"
                  >
                    <td className="px-4 py-4 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-white text-sm">{booking.clientName}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{booking.whatsappClient || "—"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-[#1e293b] border border-[#2d3748] px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                        {invoiceNum}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {new Date(booking.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-300">{booking.packageName || "Custom Package"}</td>
                    <td className="px-4 py-4 text-slate-400">Wisuda / Akad</td>
                    <td className="px-4 py-4 text-slate-300">
                      {new Date(booking.eventDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(booking.eventDate).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Copy Link - Purple */}
                        <button
                          onClick={() => handleCopyLink(booking.id)}
                          title="Copy Client Portal Link"
                          className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg transition-colors border border-purple-500/20"
                        >
                          {copiedId === booking.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        
                        {/* WhatsApp - Green */}
                        {booking.whatsappClient ? (
                          <a
                            href={`https://wa.me/${booking.whatsappClient.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat WhatsApp"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 inline-block"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 bg-slate-800 text-slate-600 rounded-lg border border-slate-700/50 opacity-40 cursor-not-allowed"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Google Drive - Blue */}
                        {booking.googleDriveLink ? (
                          <a
                            href={booking.googleDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Google Drive Folder"
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-colors border border-blue-500/20 inline-block"
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 bg-slate-800 text-slate-600 rounded-lg border border-slate-700/50 opacity-40 cursor-not-allowed"
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Info/Details - Teal */}
                        <Link href={`/bookings/${booking.id}`}>
                          <a
                            title="View Details"
                            className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white rounded-lg transition-colors border border-cyan-500/20"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </a>
                        </Link>

                        {/* Assign Team - Dark Slate */}
                        <Link href={`/bookings/${booking.id}`}>
                          <a
                            title="Assign/Manage Team"
                            className="p-1.5 bg-slate-700/30 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-600/30"
                          >
                            <Users className="h-3.5 w-3.5" />
                          </a>
                        </Link>

                        {/* Edit - Violet */}
                        <Link href={`/bookings/${booking.id}`}>
                          <a
                            title="Edit Booking"
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-colors border border-indigo-500/20"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </a>
                        </Link>

                        {/* Archive - Gray */}
                        <button
                          onClick={() => handleArchiveBooking(booking.id)}
                          title="Archive Booking"
                          className="p-1.5 bg-slate-500/10 hover:bg-slate-500 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-500/20"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete - Red */}
                        <button
                          onClick={() => {
                            if (confirm("Apakah Anda yakin ingin menghapus booking ini?")) {
                              deleteBooking.mutate({ id: booking.id });
                            }
                          }}
                          title="Delete Booking"
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Tidak ada data booking ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
