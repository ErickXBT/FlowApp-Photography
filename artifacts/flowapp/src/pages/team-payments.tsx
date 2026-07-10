import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";
import {
  Users,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck,
  ClipboardList
} from "lucide-react";

interface PaymentRow {
  id: number;
  name: string;
  role: string;
  eventsCount: number;
  ratePerEvent: number;
  totalEarned: number;
  paidAmount: number;
  balance: number;
  status: "Lunas" | "Belum Lunas";
}

export default function TeamPayments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [payments, setPayments] = useState<PaymentRow[]>([
    { id: 1, name: "Ryan Eko Pramono", role: "Photographer Utama", eventsCount: 12, ratePerEvent: 350000, totalEarned: 4200000, paidAmount: 4200000, balance: 0, status: "Lunas" },
    { id: 2, name: "Hendra Wijaya", role: "Second Photographer", eventsCount: 8, ratePerEvent: 250000, totalEarned: 2000000, paidAmount: 1500000, balance: 500000, status: "Belum Lunas" },
    { id: 3, name: "Siti Rahma", role: "Videographer", eventsCount: 10, ratePerEvent: 300000, totalEarned: 3000000, paidAmount: 3000000, balance: 0, status: "Lunas" },
    { id: 4, name: "Budi Santoso", role: "Assistant / Lighting", eventsCount: 6, ratePerEvent: 150000, totalEarned: 900000, paidAmount: 600000, balance: 300000, status: "Belum Lunas" },
    { id: 5, name: "Dewi Lestari", role: "Editor / Retoucher", eventsCount: 15, ratePerEvent: 100000, totalEarned: 1500000, paidAmount: 1500000, balance: 0, status: "Lunas" },
  ]);

  const handlePay = (id: number) => {
    setPayments(prev =>
      prev.map(row => {
        if (row.id === id) {
          toast({
            title: "Pembayaran Berhasil!",
            description: `Pembayaran sisa Rp ${row.balance.toLocaleString()} kepada ${row.name} berhasil diproses.`
          });
          return {
            ...row,
            paidAmount: row.totalEarned,
            balance: 0,
            status: "Lunas"
          };
        }
        return row;
      })
    );
  };

  const totalPayroll = payments.reduce((sum, item) => sum + item.totalEarned, 0);
  const totalPaid = payments.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalOutstanding = payments.reduce((sum, item) => sum + item.balance, 0);

  const filteredPayments = payments.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || item.role.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Pembayaran Tim</h1>
          <p className="text-slate-400 text-xs mt-0.5">Kelola gaji, insentif, dan outstanding saldo kru freelance Anda.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Earned */}
        <Card className="bg-[#111827] border-[#1e293b] overflow-hidden relative">
          <div className="absolute right-3 top-3 h-12 w-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Total Akumulasi Gaji</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-black text-white">{fmtIDR(totalPayroll)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Total pengeluaran gaji kru terdaftar</p>
          </CardContent>
        </Card>

        {/* Paid Amount */}
        <Card className="bg-[#111827] border-[#1e293b] overflow-hidden relative">
          <div className="absolute right-3 top-3 h-12 w-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6" />
          </div>
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Total Terbayar</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-black text-green-400">{fmtIDR(totalPaid)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Gaji yang sudah selesai ditransfer</p>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="bg-[#111827] border-[#1e293b] overflow-hidden relative">
          <div className="absolute right-3 top-3 h-12 w-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase">Sisa Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-black text-amber-500">{fmtIDR(totalOutstanding)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Jumlah honor yang belum dibayarkan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#111827] p-4 rounded-xl border border-[#1e293b]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama kru atau role..."
            className="pl-9 bg-[#0f172a] border-[#1e293b] text-white text-xs py-2"
          />
        </div>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635]"
        >
          <option value="all">Semua Posisi</option>
          <option value="Photographer">Photographer</option>
          <option value="Videographer">Videographer</option>
          <option value="Lighting">Assistant</option>
          <option value="Editor">Editor</option>
        </select>
      </div>

      {/* Payments List Table */}
      <Card className="bg-[#111827] border-[#1e293b] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a]/80 text-slate-400 border-b border-[#1e293b] font-bold">
                <tr>
                  <th className="p-4">Nama Kru</th>
                  <th className="p-4">Role / Posisi</th>
                  <th className="p-4 text-center">Jumlah Project</th>
                  <th className="p-4">Tarif / Project</th>
                  <th className="p-4">Total Gaji</th>
                  <th className="p-4">Sudah Dibayar</th>
                  <th className="p-4">Sisa Saldo</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      Tidak ada data kru yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(row => (
                    <tr key={row.id} className="hover:bg-[#0f172a]/20 transition-colors">
                      <td className="p-4 font-bold text-white">{row.name}</td>
                      <td className="p-4 text-slate-400">{row.role}</td>
                      <td className="p-4 text-center font-semibold">{row.eventsCount} event</td>
                      <td className="p-4 text-slate-300">{fmtIDR(row.ratePerEvent)}</td>
                      <td className="p-4 font-bold text-white">{fmtIDR(row.totalEarned)}</td>
                      <td className="p-4 text-green-400 font-medium">{fmtIDR(row.paidAmount)}</td>
                      <td className="p-4 font-bold text-amber-500">{fmtIDR(row.balance)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          className={
                            row.status === "Lunas"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {row.balance > 0 ? (
                          <Button
                            onClick={() => handlePay(row.id)}
                            size="sm"
                            className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-[10px] py-1 px-3.5 rounded-lg"
                          >
                            Bayar Lunas
                          </Button>
                        ) : (
                          <span className="text-[10px] text-green-500 font-bold flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Terbayar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
