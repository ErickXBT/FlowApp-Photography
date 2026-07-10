import { useState, useEffect } from "react";
import { useListInvoices, useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";
import {
  Search,
  Download,
  Columns,
  Eye,
  EyeOff,
  Info,
  Pencil,
  FileText
} from "lucide-react";

export default function Invoices() {
  const [hideNominal, setHideNominal] = useState(() => localStorage.getItem("hide_nominal") === "true");
  const [activeTab, setActiveTab] = useState<"aktif" | "arsip">("aktif");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: invoices, isLoading, error } = useListInvoices();
  const { data: summary } = useGetDashboardSummary();

  const toggleHideNominal = () => {
    const newVal = !hideNominal;
    setHideNominal(newVal);
    localStorage.setItem("hide_nominal", String(newVal));
  };

  const formatCurrency = (amount: number) => {
    if (hideNominal) return "Rp ••••••";
    return fmtIDR(amount);
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

  if (error || !invoices) {
    return <div className="p-6 text-destructive bg-[#0f172a]">Failed to load invoices</div>;
  }

  // Top metric calculations
  const totalRevenue = summary?.totalRevenue ?? 0;
  const outstandingAmount = summary?.outstandingAmount ?? 0;

  // Monthly revenue count
  const now = new Date();
  const monthlyRevenue = invoices
    ? invoices
        .filter(
          (inv) =>
            new Date(inv.issueDate || "").getMonth() === now.getMonth() &&
            new Date(inv.issueDate || "").getFullYear() === now.getFullYear()
        )
        .reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
    : 0;

  // Filter invoices by Tab and Search
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const isPaid = inv.status === "paid";
    if (activeTab === "arsip") {
      return matchesSearch && isPaid; // Archive maps to paid invoices
    } else {
      return matchesSearch && !isPaid; // Active maps to unpaid or partial invoices
    }
  });

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoice & Pelunasan</h1>
          <p className="text-slate-400 text-xs mt-1">
            Kelola invoice awal, pelunasan, bukti bayar, dan tindak lanjut pembayaran.
          </p>
        </div>

        {/* Global toggles and action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleHideNominal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors"
          >
            {hideNominal ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Sembunyikan nominal
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors">
            <Download className="h-3.5 w-3.5" /> Export Excel
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-xs font-semibold transition-colors">
            <Columns className="h-3.5 w-3.5" /> Kelola kolom
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL PEMASUKAN */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Pemasukan</div>
            <div className="text-xl font-black text-green-400 mt-1">{formatCurrency(totalRevenue)}</div>
            <div className="text-[9px] text-slate-500 mt-1">Dari 14 booking</div>
          </div>
          <div className="h-9 w-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
            ✔
          </div>
        </div>

        {/* PEMASUKAN BULAN INI */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pemasukan Bulan Ini</div>
            <div className="text-xl font-black text-blue-400 mt-1">{formatCurrency(monthlyRevenue)}</div>
            <div className="text-[9px] text-slate-500 mt-1">Transaksi terverifikasi Mei 2026</div>
          </div>
          <div className="h-9 w-9 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
            💵
          </div>
        </div>

        {/* SISA TAGIHAN */}
        <div className="bg-[#111827] border border-[#1e293b] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sisa Tagihan</div>
            <div className="text-xl font-black text-yellow-400 mt-1">{formatCurrency(outstandingAmount)}</div>
            <div className="text-[9px] text-slate-500 mt-1">Dari 9 booking belum lunas</div>
          </div>
          <div className="h-9 w-9 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg flex items-center justify-center">
            🕒
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
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
            placeholder="Cari klien, invoice, paket, lokasi.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] text-white text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#0f172a]/40 text-slate-400 font-semibold">
                <th className="px-4 py-3">NO</th>
                <th className="px-4 py-3">KLIEN</th>
                <th className="px-4 py-3">HARGA TOTAL</th>
                <th className="px-4 py-3">HARGA PAKET</th>
                <th className="px-4 py-3">ADD-ON</th>
                <th className="px-4 py-3">DISKON</th>
                <th className="px-4 py-3">DP DIBAYAR</th>
                <th className="px-4 py-3">BELUM DIBAYAR</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, idx) => {
                const total = Number(inv.total);
                const paid = Number(inv.paidAmount);
                const unpaid = total - paid;
                const packagePrice = total; // Mock package price since add-ons/discounts are separate in layout
                
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-[#1e293b] hover:bg-[#1e293b]/20 transition-colors"
                  >
                    <td className="px-4 py-4 text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-white text-sm">{inv.clientName}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5 font-mono">{inv.invoiceNumber}</div>
                    </td>
                    <td className="px-4 py-4 font-bold text-white">{formatCurrency(total)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatCurrency(packagePrice)}</td>
                    <td className="px-4 py-4 text-slate-400">Rp 0</td>
                    <td className="px-4 py-4 text-slate-400">Rp 0</td>
                    <td className="px-4 py-4 text-slate-300">{formatCurrency(paid)}</td>
                    <td className="px-4 py-4 font-semibold text-yellow-400">{formatCurrency(unpaid)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        inv.status === "paid"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                        {inv.status === "paid" ? "✔ Lunas" : "Belum Lunas"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/invoices/${inv.id}`}>
                          <a
                            title="View Invoice Details"
                            className="p-1.5 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] text-slate-300 hover:text-white rounded-lg transition-colors inline-block"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </a>
                        </Link>
                        <Link href={`/bookings/${inv.bookingId}`}>
                          <a
                            title="Edit Invoice/Booking"
                            className="p-1.5 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] text-slate-300 hover:text-white rounded-lg transition-colors inline-block"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </a>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    Tidak ada data invoice ditemukan.
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
