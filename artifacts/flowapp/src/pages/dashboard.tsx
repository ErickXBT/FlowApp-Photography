import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtIDR } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetDashboardSummary,
  useListBookings,
  useListInvoices,
} from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Folder,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  MapPin,
  Sparkles,
  Tag,
  DollarSign
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [hideNominal, setHideNominal] = useState(() => localStorage.getItem("hide_nominal") === "true");
  const { user } = useAuth();

  // Load backend summaries
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();
  const { data: invoices, isLoading: invoicesLoading } = useListInvoices();

  const toggleHideNominal = () => {
    const newVal = !hideNominal;
    setHideNominal(newVal);
    localStorage.setItem("hide_nominal", String(newVal));
  };

  const formatCurrency = (amount: number) => {
    if (hideNominal) return "Rp ••••••";
    return fmtIDR(amount);
  };

  // Find closest upcoming booking
  const now = new Date();
  const upcomingBookings = bookings
    ? bookings
        .filter((b) => new Date(b.eventDate) >= now)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    : [];
  const closestBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  // Calculate days remaining for closest booking
  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hari ini";
    if (days < 0) return `${Math.abs(days)} hari lalu`;
    return `${days} hari lagi`;
  };

  // Sesi Hari Ini count
  const sessionsToday = bookings
    ? bookings.filter((b) => new Date(b.eventDate).toDateString() === now.toDateString()).length
    : 0;

  // Perlu Konfirmasi count (status = pending)
  const pendingConfirmations = bookings
    ? bookings.filter((b) => b.status === "pending").length
    : 0;

  // Generate charts data
  // 1. Line chart: Revenue last 30 days
  const lineChartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const dayInvoices = invoices
      ? invoices.filter((inv) => new Date(inv.issueDate || "").toDateString() === d.toDateString())
      : [];
    const totalPaid = dayInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    lineChartData.push({
      name: dateLabel,
      pemasukan: totalPaid,
    });
  }

  // 2. Bar chart: Monthly revenue for last 12 months
  const barChartData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = monthNames[d.getMonth()] + " " + String(d.getFullYear()).substring(2);
    const monthInvoices = invoices
      ? invoices.filter(
          (inv) =>
            new Date(inv.issueDate || "").getMonth() === d.getMonth() &&
            new Date(inv.issueDate || "").getFullYear() === d.getFullYear()
        )
      : [];
    const totalPaid = monthInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    barChartData.push({
      name: monthLabel,
      pemasukan: totalPaid,
    });
  }

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-[#2d3748] p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-400 mb-1">{payload[0].payload.name}</p>
          <p className="text-[#A3E635] font-bold">
            Pemasukan: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const isDataLoading = summaryLoading || bookingsLoading || invoicesLoading;

  if (isDataLoading) {
    return (
      <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 bg-[#1e293b]" />
          <Skeleton className="h-10 w-36 bg-[#1e293b]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-[#1e293b] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96 bg-[#1e293b] rounded-xl" />
          <Skeleton className="h-96 bg-[#1e293b] rounded-xl" />
        </div>
      </div>
    );
  }

  // Get active studio owner name from session or profile
  const studioName = user?.name || "Studio Owner";

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Welcome & Hide Nominal Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            👋 Selamat datang, <span className="text-[#A3E635]">{studioName}</span>!
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Berikut ringkasan operasional dan finansial studio foto Anda hari ini.
          </p>
        </div>
        <button
          onClick={toggleHideNominal}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors"
        >
          {hideNominal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {hideNominal ? "Tampilkan nominal" : "Sembunyikan nominal"}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL BOOKING */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Booking</div>
            <div className="text-2xl font-black text-white mt-1.5">{summary?.totalBookings ?? 0} Booking</div>
          </div>
          <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5" />
          </div>
        </div>

        {/* BOOKING BULAN INI */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Booking Bulan Ini</div>
            <div className="text-2xl font-black text-white mt-1.5">{summary?.upcomingShoots ?? 0} Booking</div>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* TOTAL PEMASUKAN */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Pemasukan</div>
            <div className="text-2xl font-black text-[#A3E635] mt-1.5">{formatCurrency(summary?.totalRevenue ?? 0)}</div>
          </div>
          <div className="h-10 w-10 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* MENUNGGU PELUNASAN */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Menunggu Pelunasan</div>
            <div className="text-2xl font-black text-red-400 mt-1.5">{formatCurrency(summary?.outstandingAmount ?? 0)}</div>
          </div>
          <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Booking Terdekat & Ringkasan Hari Ini / Aksi Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Terdekat */}
        <div className="lg:col-span-6 bg-[#111827] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Booking Terdekat</h2>
            </div>
            {closestBooking && (
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {getDaysRemaining(closestBooking.eventDate)}
                </span>
                <Link href={`/bookings/${closestBooking.id}`}>
                  <span className="p-1 bg-[#1e293b] hover:bg-[#2d3748] rounded border border-[#2d3748] text-slate-400 hover:text-white cursor-pointer transition-colors">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          {closestBooking ? (
            <div className="space-y-3.5 flex-1 py-1">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-white flex items-center gap-1.5">
                  👤 {closestBooking.clientName}
                </div>
                <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  File Siap
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>
                    {new Date(closestBooking.eventDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    pukul{" "}
                    {new Date(closestBooking.eventDate).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {closestBooking.locationAddress || closestBooking.locationName || "Lokasi belum ditentukan"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-[#A3E635] font-semibold">{closestBooking.packageName || "Custom Package"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs flex-1">
              <AlertCircle className="h-8 w-8 mb-2 text-slate-600" />
              Tidak ada booking terdekat yang dijadwalkan.
            </div>
          )}
        </div>

        {/* Ringkasan Hari Ini & Aksi Cepat */}
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Sesi Hari Ini */}
            <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Sesi Hari Ini</div>
                <div className="text-xl font-black text-white mt-0.5">{sessionsToday} Sesi</div>
              </div>
            </div>

            {/* Perlu Konfirmasi */}
            <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Perlu Konfirmasi</div>
                <div className="text-xl font-black text-white mt-0.5">{pendingConfirmations} Pending</div>
              </div>
            </div>
          </div>

          {/* Aksi Cepat */}
          <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setLocation("/book")}
                className="flex flex-col items-center justify-center py-3 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <Plus className="h-5 w-5 text-[#A3E635] mb-1.5" />
                <span className="text-[10px] font-medium">Baru</span>
              </button>
              <button
                onClick={() => setLocation("/bookings")}
                className="flex flex-col items-center justify-center py-3 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5 text-indigo-400 mb-1.5" />
                <span className="text-[10px] font-medium">Daftar</span>
              </button>
              <button
                onClick={() => setLocation("/calendar")}
                className="flex flex-col items-center justify-center py-3 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <Calendar className="h-5 w-5 text-amber-400 mb-1.5" />
                <span className="text-[10px] font-medium">Kalender</span>
              </button>
              <button
                onClick={() => setLocation("/finance-summary")}
                className="flex flex-col items-center justify-center py-3 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <TrendingUp className="h-5 w-5 text-green-400 mb-1.5" />
                <span className="text-[10px] font-medium">Keuangan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Pemasukan 30 Hari Terakhir</h2>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="pemasukan" stroke="#A3E635" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Pemasukan per Bulan (1 Tahun)</h2>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pemasukan" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Booking Terbaru Table */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e293b] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-white">Booking Terbaru</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Transaksi terakhir dari klien Anda</p>
          </div>
          <button
            onClick={() => setLocation("/bookings")}
            className="flex items-center gap-1.5 text-xs text-[#A3E635] hover:text-[#84cc16] font-bold transition-colors"
          >
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#0f172a]/40 text-slate-400 font-semibold">
                <th className="px-5 py-3">Klien</th>
                <th className="px-5 py-3">Paket</th>
                <th className="px-5 py-3">Tanggal Booking</th>
                <th className="px-5 py-3">Jadwal</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recentBookings?.map((booking: any) => (
                <tr
                  key={booking.id}
                  className="border-b border-[#1e293b] hover:bg-[#1e293b]/20 transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-white">{booking.clientName}</td>
                  <td className="px-5 py-3.5 text-slate-300">{booking.packageName || "Custom Package"}</td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {new Date(booking.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {new Date(booking.eventDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      booking.status === "delivered" || booking.status === "closed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : booking.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {booking.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-right text-white">
                    {formatCurrency(Number(booking.totalAmount || 0))}
                  </td>
                </tr>
              ))}
              {(!summary?.recentBookings || summary.recentBookings.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada transaksi booking.
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
