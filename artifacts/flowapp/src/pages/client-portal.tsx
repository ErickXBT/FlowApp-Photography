import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  useGetBooking,
  useListBookingFiles,
  useToggleFileSelection,
  getListBookingFilesQueryKey,
  getGetBookingQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";
import { Calendar, File, RefreshCw, Download, CheckSquare, Printer, User, MapPin, Users, ArrowLeft, Check, Clock, X, ChevronLeft, ChevronRight, FileCheck } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending",          cls: "bg-gray-500/30 text-gray-300 border-gray-500/40" },
  confirmed:        { label: "Confirmed",         cls: "bg-blue-500/30 text-blue-300 border-blue-500/40" },
  dp_paid:          { label: "DP Paid",           cls: "bg-cyan-500/30 text-cyan-300 border-cyan-500/40" },
  editing:          { label: "Editing",           cls: "bg-yellow-500/30 text-yellow-300 border-yellow-500/40" },
  pending_payment:  { label: "Pending Payment",   cls: "bg-orange-500/30 text-orange-300 border-orange-500/40" },
  completed:        { label: "Completed",         cls: "bg-green-500/30 text-green-300 border-green-500/40" },
  cancelled:        { label: "Cancelled",         cls: "bg-red-500/30 text-red-300 border-red-500/40" },
};

type NavSection = "detail" | "files" | "reschedule";

export default function ClientPortal() {
  const [match, params] = useRoute<{ id: string }>("/client/bookings/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: booking, isLoading, error } = useGetBooking(id);
  const { data: files } = useListBookingFiles(id);

  const [section, setSection] = useState<NavSection>("detail");
  const [fileTab, setFileTab] = useState<"raw" | "edited" | "video">("raw");

  const [submittingSelection, setSubmittingSelection] = useState(false);
  const [clientSyncing, setClientSyncing] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState("");

  const isSelectionLocked = useMemo(() => {
    if (!booking) return false;
    return booking.status === "editing" || booking.status === "delivered" || booking.status === "closed";
  }, [booking?.status]);

  const isDownloadExpired = useMemo(() => {
    if (!booking || !booking.downloadFotoDuration || booking.downloadFotoDuration === "Selamanya") return false;
    const editedFilesList = files?.filter(f => f.folderType === "edited") ?? [];
    if (editedFilesList.length === 0) return false;

    const latestUploadTime = Math.max(...editedFilesList.map(f => f.uploadedAt ? new Date(f.uploadedAt).getTime() : 0));
    if (latestUploadTime === 0) return false;

    const days = parseInt(booking.downloadFotoDuration);
    if (isNaN(days)) return false;

    const expiryTime = latestUploadTime + days * 24 * 60 * 60 * 1000;
    return Date.now() > expiryTime;
  }, [booking?.downloadFotoDuration, files]);

  const handleClientSyncDrive = async () => {
    setClientSyncing(true);
    try {
      const res = await fetch(`/api/bookings/${id}/sync`, { method: "POST" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
        alert("Google Drive berhasil disinkronisasi!");
      } else {
        alert("Gagal sinkronisasi Google Drive.");
      }
    } catch {
      alert("Gagal sinkronisasi Google Drive.");
    }
    setClientSyncing(false);
  };

  const handleSubmitSelection = async () => {
    if (selectedCount === 0) return;

    setSubmittingSelection(true);
    try {
      const res = await fetch(`/api/bookings/${id}/submit-selection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialRequest: editingNotes })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
        setShowSubmitModal(false);
        alert("Pilihan foto berhasil dikirim ke Vendor/Admin!");
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengirim pilihan foto.");
      }
    } catch {
      alert("Gagal mengirim pilihan foto.");
    }
    setSubmittingSelection(false);
  };

  // Reschedule form state
  const [newDate, setNewDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState("");

  const toggleSelection = useToggleFileSelection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
      },
    },
  });

  const { rawFiles, editedFiles, videoFiles } = useMemo(() => {
    const all = files ?? [];
    return {
      rawFiles:    all.filter(f => f.folderType === "raw"),
      editedFiles: all.filter(f => f.folderType === "edited"),
      videoFiles:  all.filter(f => f.folderType === "video"),
    };
  }, [files]);

  const selectedCount = useMemo(() => (files ?? []).filter(f => f.selected).length, [files]);

  const activeFiles = useMemo(() => {
    return fileTab === "raw" ? rawFiles : fileTab === "edited" ? editedFiles : videoFiles;
  }, [fileTab, rawFiles, editedFiles, videoFiles]);

  const activeFile = lightboxIndex !== null ? activeFiles[lightboxIndex] : null;

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || lightboxIndex === 0) return;
    setLightboxIndex(lightboxIndex - 1);
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null || lightboxIndex === activeFiles.length - 1) return;
    setLightboxIndex(lightboxIndex + 1);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !rescheduleReason) return;
    setRescheduleSubmitting(true);
    try {
      const res = await fetch(`/api/reschedule-requests`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          oldDate: booking?.eventDate,
          newDate,
          reason: rescheduleReason,
        }),
      });
      if (res.ok) {
        setRescheduleMsg("✓ Permintaan reschedule berhasil dikirim. Vendor akan meninjau.");
        setNewDate("");
        setRescheduleReason("");
      } else {
        setRescheduleMsg("Gagal mengirim permintaan reschedule.");
      }
    } catch { setRescheduleMsg("Gagal mengirim permintaan reschedule."); }
    setRescheduleSubmitting(false);
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-full max-w-5xl p-6 space-y-4">
          <Skeleton className="h-12 w-full bg-[#1e293b]" />
          <div className="flex gap-4">
            <Skeleton className="h-screen w-40 bg-[#1e293b]" />
            <Skeleton className="h-96 flex-1 bg-[#1e293b]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Booking tidak ditemukan</h1>
          <p className="text-gray-400">Link tidak valid atau booking sudah dihapus.</p>
        </div>
      </div>
    );
  }

  const invoice = booking.invoice;
  const balance = invoice ? invoice.total - invoice.paidAmount : 0;
  const statusInfo = STATUS_BADGE[booking.status] ?? { label: booking.status, cls: "bg-gray-500/30 text-gray-300 border-gray-500/40" };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-2 px-6 py-2 bg-[#111827] border-b border-[#1e293b]">
        <Link href="/dashboard" className="text-xs px-3 py-1.5 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] text-white rounded-md transition-colors flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard
        </Link>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-44 shrink-0 bg-[#111827] border-r border-[#1e293b] min-h-[calc(100vh-40px)] flex flex-col">
          {/* Client profile */}
          <div className="p-4 border-b border-[#1e293b] flex flex-col items-center text-center gap-2">
            <div className="h-16 w-16 rounded-full bg-[#1e293b] border-2 border-[#A3E635] flex items-center justify-center overflow-hidden">
              <User className="h-8 w-8 text-[#64748b]" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm leading-tight">{booking.client.name}</div>
              <div className="text-[10px] text-[#A3E635] mt-0.5 font-medium">Premium Client</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {[
              { id: "detail" as const, label: "Detail Booking & Status", icon: Calendar },
              { id: "files" as const, label: "File Delivery & Seleksi", icon: File },
              { id: "reschedule" as const, label: "Ajukan Reschedule", icon: RefreshCw },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-left transition-colors w-full ${
                  section === item.id
                    ? "bg-[#A3E635] text-[#0f172a] font-semibold"
                    : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Customer Support */}
          <div className="p-3 border-t border-[#1e293b] text-[10px] text-[#64748b]">
            <div className="mb-1">Customer Support:</div>
            <a href="https://wa.me/628000000000" className="text-[#A3E635] hover:underline block">+62 812 8765 4321</a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 space-y-4">
          {/* Section header */}
          <div>
            <h1 className="text-xl font-bold text-white">Client Portal</h1>
            <p className="text-xs text-[#64748b]">Akses file dokumentasi, unduh invoice, dan request edit di satu tempat.</p>
          </div>

          {/* ── SECTION: DETAIL BOOKING ── */}
          {section === "detail" && (() => {
            const invoiceNum = `INV-${new Date(booking.createdAt).getFullYear()}-${String(booking.id).padStart(4, "0")}`;
            
            const eventTime = new Date(booking.eventDate).getTime();
            const nowTime = Date.now();
            const isOverdue = nowTime > eventTime && booking.status !== "closed" && booking.status !== "delivered";
            const diffDays = Math.ceil(Math.abs(nowTime - eventTime) / (1000 * 60 * 60 * 24));

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-1.5 py-4">
                  <h1 className="text-2xl font-black text-white tracking-tight">Studio</h1>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tracking Status Booking - {booking.clientName}</p>
                </div>

                {/* Detail Booking Card */}
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1e293b] pb-3">
                    <span className="text-xs font-bold text-slate-200">Detail Booking</span>
                    <Badge className="bg-[#A3E635] text-[#0f172a] text-[9px] font-black uppercase border-none px-2.5 py-0.5">
                      {STATUS_BADGE[booking.status]?.label || booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
                    <div className="space-y-3.5">
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Nama</span>
                        <span className="font-bold text-white">{booking.clientName}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Paket</span>
                        <span className="font-bold text-white">{booking.packageName || "Custom Package"}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Tipe Acara</span>
                        <span className="font-bold text-white">{booking.locationName || "Umum"}</span>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Jadwal</span>
                        <span className="font-bold text-white">
                          {new Date(booking.eventDate).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Deadline</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">
                            {new Date(new Date(booking.eventDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID")}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isOverdue ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                            {isOverdue ? `Terlambat ${diffDays} hari` : `Sisa ${diffDays} hari`}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                        <span className="text-slate-400">Kode</span>
                        <span className="font-mono font-bold text-white">{invoiceNum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blue Card: Invoice final dan form pelunasan */}
                {invoice && (
                  <div className="bg-blue-600/10 border border-blue-500/25 p-4.5 rounded-xl flex items-start gap-3.5">
                    <div className="p-2 bg-blue-500/15 text-blue-400 rounded-lg mt-0.5 border border-blue-500/25">
                      <File className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-xs flex-1 space-y-1">
                      <div className="font-bold text-white">Invoice final dan form pelunasan sudah tersedia</div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        {balance > 0
                          ? "Kamu sudah bisa membuka invoice final dan melanjutkan proses pelunasan untuk booking ini."
                          : "Booking ini sudah lunas. Invoice final tetap bisa dibuka kembali kapan saja dari bagian ini."}
                      </p>
                      <Link
                        href={`/form-pelunasan/${booking.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-white font-bold transition-all pt-1.5 uppercase tracking-wide cursor-pointer"
                      >
                        Lihat Invoice Final di bawah ➔
                      </Link>
                    </div>
                  </div>
                )}

                {/* Green Card: File hasil sudah tersedia */}
                {editedFiles.length > 0 && (
                  <div className="bg-emerald-600/10 border border-emerald-500/25 p-4.5 rounded-xl flex items-start gap-3.5">
                    <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg mt-0.5 border border-emerald-500/25">
                      <FileCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-xs flex-1 space-y-1">
                      <div className="font-bold text-white">File hasil sudah tersedia</div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Kamu sudah bisa mengakses file hasil untuk booking ini. Silakan cek bagian File Hasil di bawah untuk membuka aksesnya.
                      </p>
                      <button
                        onClick={() => setSection("files")}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-white font-bold transition-all pt-1.5 uppercase tracking-wide cursor-pointer text-left"
                      >
                        Lihat File Hasil di bawah ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* Card PROGRESS (Timeline checklist) */}
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-[#1e293b] pb-2">Riwayat Progress</span>
                  <div className="space-y-4.5 relative pl-6 before:absolute before:left-[10px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-800">
                    {[
                      { label: "Pending", checked: true },
                      { label: "Booking Dikonfirmasi", checked: booking.status !== "pending" },
                      { label: "Sesi Foto / Acara", checked: !["pending", "confirmed"].includes(booking.status) },
                      { label: "Antrian Edit", checked: ["editing", "delivered", "closed"].includes(booking.status) },
                      { label: "Proses Edit", checked: ["delivered", "closed"].includes(booking.status) || booking.status === "editing" },
                      { label: "Revisi", checked: ["delivered", "closed"].includes(booking.status) },
                      { label: "File Siap", checked: ["delivered", "closed"].includes(booking.status) },
                      { label: "Selesai", checked: booking.status === "closed" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 relative">
                        <div
                          className={`absolute -left-[22px] h-4 w-4 rounded-full flex items-center justify-center border z-10 transition-all ${
                            step.checked
                              ? "bg-[#A3E635] border-[#A3E635] text-[#0f172a] shadow-sm shadow-[#A3E635]/25 font-bold text-[8px]"
                              : "bg-[#111827] border-slate-700 text-slate-600 text-[8px]"
                          }`}
                        >
                          {step.checked ? "✓" : idx + 1}
                        </div>
                        <div className="text-xs">
                          <span className={`font-semibold ${step.checked ? "text-white" : "text-slate-500"}`}>{step.label}</span>
                          {step.checked && <span className="text-[9px] text-[#A3E635] ml-2.5 font-bold uppercase tracking-wide">Selesai</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── SECTION: FILE DELIVERY ── */}
          {section === "files" && (
            <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#2d3748]">
                {[
                  { id: "raw" as const, label: `Raw Photos (${rawFiles.length})` },
                  { id: "edited" as const, label: `Edited Photos (${editedFiles.length})` },
                  { id: "video" as const, label: `Videos (${videoFiles.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFileTab(tab.id)}
                    className={`px-4 py-3 text-xs font-medium transition-colors ${fileTab === tab.id ? "bg-[#A3E635] text-[#0f172a] font-bold" : "text-[#94a3b8] hover:text-white hover:bg-[#0f172a]/40"}`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center px-4">
                  <span className="text-xs text-[#64748b]">Pilihan Foto: <span className="text-white">{selectedCount} / {booking.maxPhotos ?? 5}</span></span>
                  {selectedCount > 0 && (
                    <button className="ml-3 bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/30 text-xs px-3 py-1 rounded-lg hover:bg-[#A3E635]/30 transition-colors flex items-center gap-1">
                      <Download className="h-3 w-3" /> Unduh ZIP Terpilih
                    </button>
                  )}
                  {fileTab === "raw" && (
                    <button
                      onClick={handleClientSyncDrive}
                      disabled={clientSyncing}
                      className="ml-3 border border-[#2d3748] bg-[#1e293b] hover:bg-[#2d3748] text-white text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${clientSyncing ? 'animate-spin text-[#A3E635]' : ''}`} /> Sync Drive
                    </button>
                  )}
                  {!isSelectionLocked && selectedCount > 0 && (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="ml-3 bg-[#A3E635] text-[#0f172a] font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#84cc16] transition-colors flex items-center gap-1"
                    >
                      Kirim ke Vendor/Admin
                    </button>
                  )}
                </div>
              </div>

              {fileTab === "edited" && isDownloadExpired ? (
                <div className="bg-red-500/10 border-b border-[#2d3748] px-4 py-3 text-xs text-red-400 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <span className="font-bold">Masa Aktif Download Habis!</span> Masa aktif selama {booking.downloadFotoDuration} untuk mengunduh foto hasil edit Anda telah berakhir. Silakan hubungi Vendor/Admin jika Anda masih membutuhkan file tersebut.
                  </div>
                </div>
              ) : isSelectionLocked ? (
                <div className="bg-[#A3E635]/10 px-4 py-3 text-xs text-[#A3E635] border-b border-[#2d3748] flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 shrink-0 text-[#A3E635]" />
                  <div>
                    <span className="font-bold">Foto Pilihan Telah Dikirim!</span> Pilihan foto Anda telah dikunci dan dikirim ke Vendor/Admin untuk proses retouching/edit. Anda tidak dapat mengubah pilihan lagi.
                  </div>
                </div>
              ) : (
                <div className="bg-[#0f172a]/40 px-4 py-2 text-[10px] text-[#64748b] border-b border-[#2d3748]">
                  <span className="text-[#A3E635]">⚠ Instruksi Seleksi Foto:</span>{" "}
                  Centang maksimal {booking.maxPhotos ?? 5} foto di bawah ini yang paling Anda sukai untuk diedit (retouching) oleh tim kami. Jika kuota sudah habis, Anda tidak bisa memilih lagi kecuali Anda melepas pilihan foto lainnya.
                </div>
              )}

              <div className="p-4">
                {(() => {
                    const activeFiles = fileTab === "raw" ? rawFiles : fileTab === "edited" ? editedFiles : videoFiles;
                    if (fileTab === "edited" && isDownloadExpired) {
                      return (
                        <div className="text-center py-12 text-slate-500">
                          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30 text-slate-400" />
                          <p className="text-sm">Link download foto hasil edit Anda telah kedaluwarsa.</p>
                        </div>
                      );
                    }
                    if (activeFiles.length === 0) {
                      return (
                        <div className="text-center py-12 text-[#475569]">
                          <File className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Belum ada file yang diunggah oleh vendor untuk pemotretan ini.</p>
                        </div>
                      );
                    }
                    if (fileTab === "raw" || fileTab === "edited") {
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                          {activeFiles.map(file => {
                             const isSelected = file.selected;
                             const isEditedTab = fileTab === "edited";
                             const isDisabled = isEditedTab || isSelectionLocked || (!isSelected && selectedCount >= (booking.maxPhotos ?? 5));
                             return (
                               <div
                                 key={file.id}
                                 onClick={() => {
                                   const fileIndex = activeFiles.findIndex(f => f.id === file.id);
                                   if (fileIndex !== -1) {
                                     setLightboxIndex(fileIndex);
                                   }
                                 }}
                                 className={`relative group aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                                   isSelected
                                     ? "border-[#A3E635] ring-2 ring-[#A3E635]/20 scale-[0.98]"
                                     : "border-[#374151] hover:border-[#A3E635]/50"
                                 }`}
                               >
                                 <img
                                   src={file.fileUrl}
                                   alt={file.fileName}
                                   loading="lazy"
                                   referrerPolicy="no-referrer"
                                   className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                 />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   {isEditedTab && (
                                     <a
                                       href={file.fileUrl}
                                       download
                                       onClick={(e) => e.stopPropagation()}
                                       className="bg-[#A3E635] text-[#0f172a] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#84cc16] transition-colors"
                                     >
                                       <Download className="h-3 w-3" /> Unduh
                                     </a>
                                   )}
                                 </div>
                                 {!isEditedTab && (
                                   <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isDisabled) {
                                          toggleSelection.mutate({ id: file.id, data: { selected: !isSelected } });
                                        } else {
                                          alert(`Batas maksimal pilihan foto (${booking.maxPhotos ?? 5} foto) sudah tercapai.`);
                                        }
                                      }}
                                      className={`absolute top-2.5 right-2.5 z-10 focus:outline-none ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                     <div
                                       className={`h-5.5 w-5.5 rounded-full flex items-center justify-center border transition-all ${
                                         isSelected
                                           ? "bg-[#A3E635] border-[#A3E635] text-[#0f172a]"
                                           : "bg-black/50 border-[#475569] text-transparent hover:border-white"
                                       }`}
                                     >
                                       <Check className="h-3 w-3 font-bold text-[#0f172a]" />
                                     </div>
                                   </button>
                                 )}
                                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-gray-300 truncate flex justify-between items-center">
                                   <span className="truncate flex-1">{file.fileName}</span>
                                   {isEditedTab && (
                                     <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-[#A3E635] hover:underline shrink-0 text-[9px] ml-1">
                                       Lihat
                                     </a>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {activeFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#374151] bg-[#0f172a]/50 p-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={file.selected}
                                disabled={isSelectionLocked}
                                onChange={e => toggleSelection.mutate({ id: file.id, data: { selected: e.target.checked } })}
                                className="accent-[#A3E635] h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-white hover:text-[#A3E635] hover:underline">
                                {file.fileName}
                              </a>
                            </div>
                            <a href={file.fileUrl} target="_blank" rel="noreferrer"
                              className="text-xs border border-[#374151] text-[#94a3b8] hover:text-white hover:border-[#A3E635] px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
                              <Download className="h-3 w-3" /> Download
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                })()}
              </div>
            </div>
          )}

          {/* ── SECTION: RESCHEDULE ── */}
          {section === "reschedule" && (
            <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-[#A3E635]" />
                  <h2 className="text-white font-bold text-sm">Ajukan Reschedule Jadwal</h2>
                </div>
                <p className="text-xs text-[#64748b]">Ajukan penggeseran tanggal pemotretan. Vendor akan meninjau ketersediaan kru sebelum memberikan persetujuan.</p>
              </div>
              <form onSubmit={handleReschedule} className="space-y-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Tanggal Pemotretan Saat Ini</label>
                  <input
                    value={booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : ""}
                    disabled
                    className="w-full bg-[#0f172a] border border-[#374151] text-[#64748b] text-sm rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Usulan Tanggal Baru</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Alasan Reschedule</label>
                  <textarea
                    value={rescheduleReason}
                    onChange={e => setRescheduleReason(e.target.value)}
                    placeholder="Contoh: Terjadi bentrok jadwal sewa gedung, atau masalah lainnya..."
                    rows={4}
                    required
                    className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635] resize-none"
                  />
                </div>
                {rescheduleMsg && (
                  <p className={`text-xs ${rescheduleMsg.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{rescheduleMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={rescheduleSubmitting}
                  className="w-full bg-[#A3E635] hover:bg-[#84cc16] disabled:opacity-50 text-[#0f172a] font-bold text-sm rounded-lg py-3 transition-colors"
                >
                  {rescheduleSubmitting ? "Mengirim..." : "Kirim Permintaan Reschedule"}
                </button>
              </form>
              <div>
                <div className="text-xs text-[#94a3b8] font-medium mb-1">Riwayat Permintaan Reschedule:</div>
                <p className="text-xs text-[#475569]">Belum ada riwayat reschedule untuk pemotretan ini.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeFile && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 text-white"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Header */}
          <div className="absolute top-4 inset-x-0 px-6 flex justify-between items-center z-10">
            <span className="text-sm font-semibold">{activeFile.fileName}</span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Left Arrow */}
          {lightboxIndex !== null && lightboxIndex > 0 && (
            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image Container */}
          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeFile.fileUrl.replace("sz=w800", "sz=w1600")}
              alt={activeFile.fileName}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Right Arrow */}
          {lightboxIndex !== null && lightboxIndex < activeFiles.length - 1 && (
            <button
              onClick={handleNextPhoto}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Footer Controls */}
          <div className="absolute bottom-6 flex flex-col items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-gray-400">
              Foto {lightboxIndex! + 1} dari {activeFiles.length}
            </span>
            {fileTab === "raw" && !isSelectionLocked && (
              <button
                onClick={() => {
                  const isSelected = activeFile.selected;
                  const isDisabled = !isSelected && selectedCount >= (booking.maxPhotos ?? 5);
                  if (!isDisabled) {
                    toggleSelection.mutate({ id: activeFile.id, data: { selected: !isSelected } });
                  } else {
                    alert(`Batas maksimal pilihan foto (${booking.maxPhotos ?? 5} foto) sudah tercapai.`);
                  }
                }}
                className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${
                  activeFile.selected
                    ? "bg-[#A3E635] text-[#0f172a]"
                    : "bg-[#1e293b] text-white border border-[#374151] hover:border-white"
                }`}
              >
                <Check className="h-4 w-4" />
                {activeFile.selected ? "Pilihan Anda (Terpilih)" : "Pilih Foto Ini"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit Selection Modal (Pop-up) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)}></div>
          
          {/* Modal Container */}
          <div className="relative bg-[#1e293b] border border-[#2d3748] rounded-2xl w-full max-w-md p-6 shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-[#A3E635]" /> Kirim Foto Pilihan
                </h3>
                <p className="text-xs text-slate-400 mt-1">Anda telah memilih {selectedCount} dari {booking.maxPhotos ?? 5} foto.</p>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 hover:bg-[#2d3748] rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                Catatan / Instruksi Tambahan (Opsional)
              </label>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Contoh: Tolong edit warna tone-nya warm / tiruskan pipi / hilangkan objek di background..."
                rows={4}
                className="w-full bg-[#0f172a] border border-[#2d3748] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A3E635] resize-none"
              />
            </div>

            <div className="bg-[#A3E635]/5 border border-[#A3E635]/15 rounded-xl p-3 text-[11px] text-slate-300">
              <span className="text-[#A3E635] font-bold">PENTING:</span> Pilihan foto Anda akan dikunci secara permanen dan dikirim ke Vendor/Admin untuk proses editing setelah dikirim.
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-[#2d3748] hover:bg-[#2d3748] text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitSelection}
                disabled={submittingSelection}
                className="px-5 py-2 bg-[#A3E635] hover:bg-[#84cc16] disabled:opacity-50 text-[#0f172a] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                {submittingSelection ? "Mengirim..." : "Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
