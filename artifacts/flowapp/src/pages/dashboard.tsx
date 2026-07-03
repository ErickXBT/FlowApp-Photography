import { useState, useEffect } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtIDR } from "@/lib/utils";
import { DollarSign, Briefcase, FileText, RefreshCw, CheckCircle2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  dp_paid: "DP Paid",
  editing: "Editing",
  pending_payment: "Pending Payment",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  dp_paid: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  editing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  pending_payment: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface Booking {
  id: number;
  bookingCode: string;
  clientName: string;
  clientWhatsapp?: string;
  clientCity?: string;
  eventDate: string;
  muaName?: string;
  groomGaun?: string;
  brideGaun?: string;
  totalAmount: number;
  status: string;
}

interface RevisionTask {
  id: number;
  fileName: string;
  bookingId: number;
  bookingCode: string;
  note?: string;
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [revisions, setRevisions] = useState<RevisionTask[]>([]);

  // File Delivery Engine state
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [fileCategory, setFileCategory] = useState("raw");
  const [fileName, setFileName] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  useEffect(() => {
    fetch("/api/bookings", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setBookings(data);
      })
      .finally(() => setBookingsLoading(false));
  }, []);

  // Build revision tasks from selected files (simulated from booking data)
  useEffect(() => {
    if (!bookings.length) return;
    const tasks: RevisionTask[] = [];
    bookings.slice(0, 2).forEach(b => {
      if (b.status === "editing") {
        tasks.push({ id: b.id, fileName: "DSC_4012.JPG", bookingId: b.id, bookingCode: b.bookingCode, note: "Tolong crop agak ketat agar fokus ke cincin di tangan." });
      }
    });
    setRevisions(tasks);
  }, [bookings]);

  const handleSendFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !fileName) return;
    setSending(true);
    setSendMsg("");
    try {
      const res = await fetch(`/api/bookings/${selectedBookingId}/files`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileUrl: `#file-${Date.now()}`, folderType: fileCategory === "raw" ? "raw" : fileCategory === "video" ? "video" : "edited", selected: false }),
      });
      if (res.ok) { setSendMsg("✓ File berhasil dikirim ke klien."); setFileName(""); }
      else setSendMsg("Gagal mengirim file.");
    } catch { setSendMsg("Gagal mengirim file."); }
    setSending(false);
    setTimeout(() => setSendMsg(""), 3000);
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    const prevBookings = bookings;
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      // Revert on failure
      setBookings(prevBookings);
    }
  };

  const dismissRevision = (id: number) => setRevisions(prev => prev.filter(r => r.id !== id));

  const konfirmasiVA = summary?.bookingsByStatus?.find((s: any) => s.status === "pending_payment")?.count ?? 0;

  const kpiCards = [
    { icon: DollarSign, label: "Total Pendapatan", value: fmtIDR(summary?.totalRevenue ?? 0), color: "text-[#A3E635]" },
    { icon: Briefcase, label: "Job Aktif", value: `${summary?.upcomingShoots ?? 0} Event`, color: "text-blue-400" },
    { icon: FileText, label: "Konfirmasi VA", value: `${konfirmasiVA} Invoice`, color: "text-orange-400" },
    { icon: RefreshCw, label: "Req Reschedule", value: "0 Pending", color: "text-purple-400" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 bg-[#1e293b]" />)}
        </div>
        <Skeleton className="h-40 bg-[#1e293b]" />
        <Skeleton className="h-64 bg-[#1e293b]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-[#1e293b] rounded-xl border border-[#2d3748] px-5 py-4 flex items-center gap-4">
            <card.icon className={`h-8 w-8 shrink-0 ${card.color}`} />
            <div>
              <div className="text-xs text-[#64748b] uppercase tracking-wide font-medium">{card.label}</div>
              <div className={`font-bold text-lg mt-0.5 ${card.color}`}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* File Delivery Engine */}
      <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <FileText className="h-5 w-5 text-[#A3E635]" />
          <span className="text-white font-semibold text-base">File Delivery Engine (S3 / Cloudflare R2 Upload Emulator)</span>
        </div>
        <p className="text-sm text-[#64748b] mb-5">Gunakan form di bawah ini untuk mensimulasikan pengunggahan file foto (Raw / Edited) atau link video teaser langsung ke R2 Storage client.</p>
        <form onSubmit={handleSendFile} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Pilih Klien / Booking</label>
            <select
              value={selectedBookingId}
              onChange={e => setSelectedBookingId(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
            >
              <option value="">-- Pilih Booking --</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.clientName} – {b.eventDate ? new Date(b.eventDate).toLocaleDateString("id-ID") : "TBD"} ({b.bookingCode})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Kategori File</label>
            <select
              value={fileCategory}
              onChange={e => setFileCategory(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
            >
              <option value="raw">Raw Photos (Untuk Diseleksi)</option>
              <option value="edited">Edited Photos (Final Retouch)</option>
              <option value="video">Cinematic Video Teaser (MP4)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Nama File</label>
            <input
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Contoh: DSC_4129.JPG"
              className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={sending || !selectedBookingId || !fileName}
              className="w-full bg-[#A3E635] hover:bg-[#84cc16] disabled:opacity-50 text-[#0f172a] font-bold text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              {sending ? "Mengirim..." : "Kirim File Ke Klien"}
            </button>
            {sendMsg && <p className="text-sm text-[#A3E635] mt-2">{sendMsg}</p>}
          </div>
        </form>
      </div>

      {/* Booking Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2d3748]">
          <h2 className="text-white font-semibold text-base">Semua Booking Masuk</h2>
        </div>
        <div className="overflow-x-auto">
          {bookingsLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 bg-[#0f172a]" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#64748b] border-b border-[#2d3748] bg-[#0f172a]/50">
                  <th className="text-left px-5 py-3.5 font-medium">Booking ID</th>
                  <th className="text-left px-5 py-3.5 font-medium">Detail Klien</th>
                  <th className="text-left px-5 py-3.5 font-medium">Tanggal Event</th>
                  <th className="text-left px-5 py-3.5 font-medium">Tim & Pakaian</th>
                  <th className="text-left px-5 py-3.5 font-medium">Total Transaksi</th>
                  <th className="text-left px-5 py-3.5 font-medium">Status Proyek</th>
                  <th className="text-left px-5 py-3.5 font-medium">Ganti Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-[#2d3748] hover:bg-[#0f172a]/40 transition-colors">
                    <td className="px-5 py-4 text-[#A3E635] font-mono font-medium">{b.bookingCode}</td>
                    <td className="px-5 py-4">
                      <div className="text-white font-semibold">{b.clientName}</div>
                      {b.clientWhatsapp && <div className="text-[#64748b] text-xs mt-0.5">{b.clientWhatsapp}</div>}
                      {b.clientCity && <div className="text-[#64748b] text-xs">{b.clientCity}</div>}
                    </td>
                    <td className="px-5 py-4 text-[#94a3b8]">
                      {b.eventDate ? new Date(b.eventDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "TBD"}
                    </td>
                    <td className="px-5 py-4 text-[#94a3b8]">
                      {b.muaName && <div>MUA: {b.muaName}</div>}
                      {b.brideGaun && <div>Gaun: {b.brideGaun}</div>}
                      {!b.muaName && !b.brideGaun && <span className="text-[#475569]">—</span>}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">{fmtIDR(b.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase ${STATUS_COLORS[b.status] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                        className="bg-[#0f172a] border border-[#374151] text-white text-sm rounded px-2.5 py-1.5 focus:outline-none focus:border-[#A3E635]"
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-[#475569]">Belum ada booking masuk.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Task Queue Editor */}
      {revisions.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-5">
          <h2 className="text-white font-semibold text-base mb-4">Task Queue Editor (Revisi Foto dari Klien)</h2>
          <div className="space-y-3">
            {revisions.map(r => (
              <div key={r.id} className="flex items-start justify-between gap-4 bg-[#0f172a] rounded-lg p-4 border border-[#2d3748]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded font-bold uppercase">PENDING REVISION</span>
                    <span className="text-white text-sm font-medium">{r.fileName}</span>
                    <span className="text-[#64748b] text-xs">(Booking ID: {r.bookingCode})</span>
                  </div>
                  {r.note && <p className="text-[#94a3b8] text-sm">"{r.note}"</p>}
                  <p className="text-[#475569] text-xs">Dikirim pada: {new Date().toLocaleDateString("id-ID")}</p>
                </div>
                <button
                  onClick={() => dismissRevision(r.id)}
                  className="shrink-0 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Tandai Selesai Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
