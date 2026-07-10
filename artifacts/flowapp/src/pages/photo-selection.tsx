import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Folder,
  Search,
  RefreshCw,
  CheckCircle2,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Upload,
  Trash2,
  FileText,
  AlertCircle,
  Camera,
  Download,
  Check,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: number;
  bookingCode?: string;
  clientName: string;
  clientWhatsapp?: string;
  clientCity?: string;
  eventDate: string;
  totalAmount: number;
  status: string;
  googleDriveLink?: string;
  maxPhotos?: number;
  pilihFotoDuration?: string;
  downloadFotoDuration?: string;
}

interface DeliveryFile {
  id: number;
  bookingId: number;
  folderType: "raw" | "edited" | "video";
  fileName: string;
  fileUrl: string;
  selected: boolean;
}

export default function PhotoSelectionPage() {
  const [, setLocation] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "editing" | "delivered">("all");

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [files, setFiles] = useState<DeliveryFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Syncing Drive state
  const [syncingDrive, setSyncingDrive] = useState(false);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Expiry / duration setting state
  const [downloadDuration, setDownloadDuration] = useState("7 Hari");

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookings(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadBookingFiles = async (bookingId: number) => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/files`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFiles(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      loadBookingFiles(selectedBooking.id);
      setDownloadDuration(selectedBooking.downloadFotoDuration || "7 Hari");
    } else {
      setFiles([]);
    }
  }, [selectedBooking]);

  const handleSyncDrive = async () => {
    if (!selectedBooking) return;
    setSyncingDrive(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/sync`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        alert("Google Drive berhasil disinkronisasi!");
        loadBookingFiles(selectedBooking.id);
      } else {
        alert("Gagal sinkronisasi Google Drive.");
      }
    } catch (err) {
      alert("Error sinkronisasi Google Drive.");
    } finally {
      setSyncingDrive(false);
    }
  };

  // Multiple files upload implementation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0 || !selectedBooking) return;

    setUploading(true);
    const total = filesList.length;

    for (let i = 0; i < total; i++) {
      const file = filesList[i];
      setUploadProgress(`Mengunggah file ${i + 1} dari ${total}... (${Math.round((i / total) * 100)}%)`);

      try {
        const fd = new FormData();
        fd.append("file", file);

        // 1. Upload file binary
        const resUpload = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: fd
        });
        if (!resUpload.ok) throw new Error(`Upload file ${file.name} gagal.`);
        const { url } = await resUpload.json();

        // 2. Save delivery file metadata to backend
        const resSave = await fetch(`/api/bookings/${selectedBooking.id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            folderType: "edited",
            fileName: file.name,
            fileUrl: url
          })
        });
        if (!resSave.ok) throw new Error(`Penyimpanan meta file ${file.name} gagal.`);

      } catch (err: any) {
        alert(err.message || "Gagal mengunggah file.");
        break;
      }
    }

    setUploadProgress(null);
    setUploading(false);
    loadBookingFiles(selectedBooking.id);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus file hasil edit ini?")) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert("Gagal menghapus file.");
      }
    } catch {
      alert("Gagal menghapus file.");
    }
  };

  const handleDeliverEdits = async () => {
    if (!selectedBooking) return;
    const editedCount = files.filter(f => f.folderType === "edited").length;
    if (editedCount === 0) {
      alert("Anda harus mengunggah setidaknya 1 file hasil edit sebelum mengirim ke klien.");
      return;
    }

    if (!window.confirm(`Kirim ${editedCount} foto hasil edit ke client portal dengan masa unduh selama "${downloadDuration}"?`)) return;

    try {
      // 1. Update duration and set status to "delivered"
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          downloadFotoDuration: downloadDuration,
          status: "delivered"
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedBooking(updated);
        loadBookings();
        alert("Foto hasil edit berhasil dikirim dan disinkronkan ke Client Portal!");
      } else {
        alert("Gagal mengirim hasil edit.");
      }
    } catch {
      alert("Gagal mengirim hasil edit.");
    }
  };

  const rawSelectedFiles = files.filter(f => f.folderType === "raw" && f.selected);
  const editedFiles = files.filter(f => f.folderType === "edited");

  // Filtering bookings
  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.bookingCode && b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // We only display bookings where client selection is relevant (i.e. status is editing, delivered, closed, or they enabled selection)
    const hasSelectionEnabled = b.status === "editing" || b.status === "delivered" || b.status === "closed";
    
    if (activeFilter === "all") return matchSearch && hasSelectionEnabled;
    if (activeFilter === "editing") return matchSearch && b.status === "editing";
    if (activeFilter === "delivered") return matchSearch && b.status === "delivered";
    return false;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Seleksi & Hasil Edit Foto Klien</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau foto pilihan klien, salin nama file, dan unggah hasil retouch/edit foto yang langsung sinkron ke Client Portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Projects List */}
        <div className="lg:col-span-4 bg-[#1e293b]/30 border border-[#2d3748] rounded-2xl flex flex-col overflow-hidden">
          {/* List Toolbar */}
          <div className="p-4 border-b border-[#2d3748] space-y-3 bg-[#0f172a]/20">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama klien / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#2d3748] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#A3E635]"
              />
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-1.5">
              {(["all", "editing", "delivered"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === tab
                      ? "bg-[#A3E635] text-[#0f172a]"
                      : "bg-[#111827] text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "all" ? "Semua" : tab === "editing" ? "Perlu Edit" : "Selesai"}
                </button>
              ))}
            </div>
          </div>

          {/* List Container */}
          <div className="divide-y divide-[#2d3748] max-h-[650px] overflow-y-auto">
            {bookingsLoading ? (
              [...Array(3)].map((_, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2 bg-[#0f172a]" />
                  <Skeleton className="h-3 w-3/4 bg-[#0f172a]" />
                </div>
              ))
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Camera className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-40" />
                Tidak ada project dengan seleksi foto.
              </div>
            ) : (
              filteredBookings.map(b => {
                const isSelected = selectedBooking?.id === b.id;
                const statusLabel = b.status === "editing" ? "Perlu Edit" : b.status === "delivered" ? "Selesai" : "Closed";
                const statusColor = b.status === "editing" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-green-400 bg-green-400/10 border-green-400/20";
                
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-[#A3E635]/10 border-l-4 border-l-[#A3E635]"
                        : "hover:bg-[#111827]/40"
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <h4 className="font-bold text-sm text-white truncate">{b.clientName}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[10px] text-slate-500">PRJ-{String(b.id).padStart(4, "0")}</span>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${isSelected ? "text-[#A3E635] translate-x-1" : ""}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Project Detail Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedBooking ? (
            <div className="bg-[#1e293b]/20 border border-[#2d3748] rounded-2xl p-12 text-center text-slate-500">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-20 text-slate-400" />
              <h3 className="font-bold text-white text-base">Workspace Seleksi Foto</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan pilih salah satu klien di sebelah kiri untuk melihat foto pilihan mereka dan mengunggah hasil edit.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Client Summary Banner */}
              <div className="bg-[#1e293b]/40 border border-[#2d3748] rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#A3E635] uppercase tracking-wider font-bold">Proyek Aktif</span>
                  <h2 className="text-xl font-bold text-white">{selectedBooking.clientName}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(selectedBooking.eventDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Batas Foto: {selectedBooking.maxPhotos ?? 5}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 shrink-0 items-start sm:items-end">
                  <button
                    onClick={handleSyncDrive}
                    disabled={syncingDrive}
                    className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-xl text-xs text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingDrive ? "animate-spin text-[#A3E635]" : ""}`} />
                    Sync Google Drive
                  </button>
                  <a
                    href={`/client/bookings/${selectedBooking.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-[#A3E635]/10 hover:bg-[#A3E635]/20 border border-[#A3E635]/20 rounded-xl text-xs text-[#A3E635] transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Client Portal
                  </a>
                </div>
              </div>

              {/* Workspace Content split into Raw selections and Uploaded results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: Client Selections (Raw) */}
                <div className="bg-[#1e293b]/20 border border-[#2d3748] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4.5 w-4.5 text-[#A3E635]" />
                      <h3 className="font-bold text-sm text-white">Pilihan Foto Klien</h3>
                    </div>
                    <span className="text-xs bg-[#A3E635]/10 text-[#A3E635] px-2 py-0.5 rounded-full font-bold">
                      {rawSelectedFiles.length} Terpilih
                    </span>
                  </div>

                  {filesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full bg-[#0f172a]" />
                      <Skeleton className="h-20 w-full bg-[#0f172a]" />
                    </div>
                  ) : rawSelectedFiles.length === 0 ? (
                    <div className="p-8 text-center bg-[#0f172a]/20 border border-dashed border-[#2d3748] rounded-xl text-slate-500 text-xs">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-40" />
                      Klien belum mengirimkan foto pilihan mereka.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Copy Helper Box */}
                      <div className="bg-[#A3E635]/5 border border-[#A3E635]/20 rounded-xl p-3 flex justify-between items-center gap-2">
                        <div className="truncate flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lightroom/Explorer Helper</p>
                          <p className="text-[11px] text-slate-300 truncate mt-0.5">
                            {rawSelectedFiles.map(f => f.fileName).join(", ")}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const names = rawSelectedFiles.map(f => f.fileName).join(", ");
                            navigator.clipboard.writeText(names).then(() => {
                              alert("Daftar file disalin!");
                            });
                          }}
                          className="p-2 bg-[#0f172a] hover:bg-[#1e293b] rounded-lg text-[#A3E635] border border-[#2d3748] transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Small list with previews */}
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {rawSelectedFiles.map(file => (
                          <div key={file.id} className="bg-[#0f172a]/40 border border-[#2d3748] p-2 rounded-xl flex items-center gap-3">
                            <img src={file.fileUrl} alt={file.fileName} className="h-10 w-10 object-cover rounded-lg border border-[#2d3748]" />
                            <span className="text-xs text-white truncate flex-1">{file.fileName}</span>
                            <a href={file.fileUrl.replace("sz=w800", "sz=w1600")} target="_blank" rel="noreferrer" className="text-[10px] text-[#A3E635] hover:underline shrink-0">
                              Buka
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel 2: Upload Results (Edited) */}
                <div className="bg-[#1e293b]/20 border border-[#2d3748] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4.5 w-4.5 text-[#A3E635]" />
                      <h3 className="font-bold text-sm text-white">Unggah Hasil Edit</h3>
                    </div>
                    <span className="text-xs bg-[#A3E635]/10 text-[#A3E635] px-2 py-0.5 rounded-full font-bold">
                      {editedFiles.length} File
                    </span>
                  </div>

                  {/* Drag-and-drop / select Area */}
                  <div className="border-2 border-dashed border-[#2d3748] hover:border-[#A3E635]/50 transition-colors rounded-xl p-4 text-center cursor-pointer relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="space-y-1 text-slate-400">
                      <Upload className="h-6 w-6 mx-auto text-[#A3E635]" />
                      <p className="text-xs font-semibold text-white">Klik / Tarik Foto Hasil Edit Ke Sini</p>
                      <p className="text-[10px]">Mendukung PNG, JPEG, JPG (maks 20MB/file)</p>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div className="bg-[#0f172a] p-3 rounded-xl border border-[#2d3748] flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-[#A3E635] animate-spin shrink-0" />
                      <span className="text-xs text-slate-300 font-semibold">{uploadProgress}</span>
                    </div>
                  )}

                  {/* List of uploaded files */}
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {editedFiles.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Belum ada file hasil edit yang diunggah.
                      </div>
                    ) : (
                      editedFiles.map(file => (
                        <div key={file.id} className="bg-[#0f172a]/30 border border-[#2d3748] p-2 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <img src={file.fileUrl} alt={file.fileName} className="h-8 w-8 object-cover rounded border border-[#2d3748]" />
                            <span className="text-xs text-white truncate">{file.fileName}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Action Banner */}
              <div className="bg-[#1e293b]/40 border border-[#2d3748] rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#A3E635]" />
                      Publikasikan & Kirim Hasil Edit ke Klien
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selesaikan proses editing, tautkan file, dan kirimkan notifikasi ke client portal agar file siap diunduh oleh klien.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t border-[#2d3748] pt-4">
                  {/* Select expiration duration */}
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Masa Aktif Download</label>
                    <select
                      value={downloadDuration}
                      onChange={(e) => setDownloadDuration(e.target.value)}
                      className="bg-[#0f172a] border border-[#2d3748] text-xs text-white rounded-lg p-2.5 w-full sm:w-56 focus:outline-none focus:border-[#A3E635]"
                    >
                      <option value="7 Hari">7 Hari (Masa Aktif)</option>
                      <option value="14 Hari">14 Hari (Masa Aktif)</option>
                      <option value="30 Hari">30 Hari (Masa Aktif)</option>
                      <option value="90 Hari">90 Hari (Masa Aktif)</option>
                      <option value="Selamanya">Selamanya (Aktif Terus)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleDeliverEdits}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Kirim & Hubungkan ke Client Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
