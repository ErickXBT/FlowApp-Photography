import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  useGetBooking,
  useListBookingFiles,
  useToggleFileSelection,
  getListBookingFilesQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";
import { Calendar, File, RefreshCw, Download, CheckSquare, Printer, User, MapPin, Users } from "lucide-react";

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

  // Reschedule form state
  const [newDate, setNewDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState("");

  const toggleSelection = useToggleFileSelection({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) }),
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
      {/* Simulate View Bar */}
      <div className="flex items-center gap-2 px-6 py-2 bg-[#111827] border-b border-[#1e293b]">
        <span className="text-xs text-[#64748b] mr-1">Simulate View:</span>
        {[
          { name: "Landing Page", href: "#" },
          { name: "14-Step Booking", href: "/book" },
          { name: "Client Portal", active: true },
          { name: "Vendor Dashboard", href: "/dashboard" },
          { name: "Super Admin", href: "/admin" },
        ].map(v => (
          <Link key={v.name} href={(v as any).href ?? "#"}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${v.active ? "bg-[#A3E635] text-[#0f172a] font-semibold" : "text-[#94a3b8] border border-[#1e293b] hover:border-[#374151] hover:text-white"}`}>
            {v.name}
          </Link>
        ))}
        {/* Booking selector */}
        <div className="ml-auto flex items-center gap-2 text-xs text-[#94a3b8]">
          <span>Pilih Booking:</span>
          <select className="bg-[#1e293b] border border-[#374151] text-white text-xs rounded px-2 py-1">
            <option>{booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : "TBD"} (BK-{booking.id})</option>
          </select>
        </div>
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
          {section === "detail" && (
            <div className="space-y-4">
              {/* Booking overview */}
              <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-[#64748b] mb-1">BOOKING ID: BK-{booking.id}</div>
                    <h2 className="text-white font-bold">
                      {booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : "TBD"} — {booking.client?.name ?? "—"}
                    </h2>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded border ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-[#94a3b8]">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 text-[#A3E635] shrink-0" />
                    <div>
                      <div className="font-medium text-white">Lokasi Pemotretan</div>
                      <div>{booking.client.city ?? "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[#94a3b8]">
                    <Users className="h-3.5 w-3.5 mt-0.5 text-[#A3E635] shrink-0" />
                    <div>
                      <div className="font-medium text-white mb-1">Tim Kru & Kostum</div>
                      <div>Paket: <span className="text-white">{booking.package?.name ?? "—"}</span></div>
                      {booking.teamMembers?.map(m => (
                        <div key={m.id}>{m.role}: <span className="text-white">{m.name}</span></div>
                      ))}
                    </div>
                  </div>
                  {booking.specialRequest && (
                    <div className="bg-[#0f172a] rounded-lg p-3 border border-[#374151]">
                      <div className="font-medium text-white mb-1 text-xs">Catatan Tambahan & Request:</div>
                      <p className="text-[#94a3b8] italic text-xs">"{booking.specialRequest}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimation & Status */}
              <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#A3E635]">ℹ</span>
                  <span className="text-white font-semibold text-sm">Estimasi Pengerjaan & Status Editing</span>
                </div>
                <div className="text-xs text-[#94a3b8]">Turnaround ETA <span className="text-white font-bold">7 Hari Kerja</span></div>
                <div className="text-xs text-[#94a3b8]">Pilihan Foto Seleksi <span className="text-white font-bold">{selectedCount} / 50 Foto</span></div>
                <div className="text-xs">
                  <span className="text-[#94a3b8]">Status Terakhir </span>
                  <span className="text-white font-medium">{booking.status}</span>
                </div>
                <div className="text-xs text-[#64748b]">
                  <div className="font-medium text-[#94a3b8] mb-1">Riwayat Revisi Foto Editor:</div>
                  <p>Belum ada permintaan revisi foto kustom.</p>
                </div>
              </div>

              {/* Invoice */}
              {invoice && (
                <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-4 space-y-3">
                  <h3 className="text-white font-bold text-sm">INVOICE PEMBAYARAN</h3>
                  <div className="text-[#A3E635] font-mono text-sm">{invoice.invoiceNumber}</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Harga Paket</span><span>{fmtIDR(Number(booking.package.price))}</span>
                    </div>
                    {(() => {
                      const addTotal = (booking.addOns ?? []).reduce((s, a) => s + a.price, 0);
                      return addTotal > 0 ? (
                        <div className="flex justify-between text-[#94a3b8]">
                          <span>Layanan Add-On</span><span>{fmtIDR(addTotal)}</span>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex justify-between text-white font-bold border-t border-[#374151] pt-1.5">
                      <span>Grand Total</span><span>{fmtIDR(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Uang Muka (DP 30%)</span><span>{fmtIDR(invoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Sisa Pelunasan</span><span>{fmtIDR(balance)}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Metode Bayar</span><span>QRIS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8]">Status Invoice</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${invoice.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}>
                        {invoice.status === "paid" ? "LUNAS" : "BELUM LUNAS"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-transparent border border-[#A3E635] text-[#A3E635] hover:bg-[#A3E635]/10 font-semibold text-xs rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" /> Cetak / Simpan PDF
                  </button>
                </div>
              )}

              {/* Moodboard */}
              <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-4">
                <h3 className="text-white font-semibold text-sm mb-2">Moodboard Referensi</h3>
                <p className="text-xs text-[#64748b]">Moodboard visual yang Anda lampirkan untuk pemotretan ini:</p>
                <div className="mt-2 text-xs text-[#A3E635] flex items-center gap-1">
                  <File className="h-3 w-3" /> nature_prewed_mood.pdf
                </div>
              </div>
            </div>
          )}

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
                  <span className="text-xs text-[#64748b]">Pilihan Foto: <span className="text-white">{selectedCount} / 50</span></span>
                  {selectedCount > 0 && (
                    <button className="ml-3 bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/30 text-xs px-3 py-1 rounded-lg hover:bg-[#A3E635]/30 transition-colors flex items-center gap-1">
                      <Download className="h-3 w-3" /> Unduh ZIP Terpilih
                    </button>
                  )}
                </div>
              </div>

              {/* Instruction */}
              <div className="bg-[#0f172a]/40 px-4 py-2 text-[10px] text-[#64748b] border-b border-[#2d3748]">
                <span className="text-[#A3E635]">⚠ Instruksi Seleksi Foto:</span>{" "}
                Centang maksimal 50 foto di bawah ini yang paling Anda sukai untuk diedit (retouching) oleh tim kami. Jika kuota sudah habis, Anda tidak bisa memilih lagi kecuali Anda melepas pilihan foto lainnya.
              </div>

              <div className="p-4">
                {(() => {
                  const activeFiles = fileTab === "raw" ? rawFiles : fileTab === "edited" ? editedFiles : videoFiles;
                  if (activeFiles.length === 0) {
                    return (
                      <div className="text-center py-12 text-[#475569]">
                        <File className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Belum ada file raw yang diunggah oleh vendor untuk pemotretan ini.</p>
                        <p className="text-xs mt-1">[Contoh: Coba login/switch ke <span className="text-[#A3E635]">Vendor Dashboard</span> untuk mengunggah file]</p>
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
                              onChange={e => toggleSelection.mutate({ id: file.id, data: { selected: e.target.checked } })}
                              className="accent-[#A3E635] h-4 w-4"
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
    </div>
  );
}
