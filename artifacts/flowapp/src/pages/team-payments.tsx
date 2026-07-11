import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { fmtIDR } from "@/lib/utils";
import {
  useListTeamPayments,
  useCreateTeamPayment,
  useUpdateTeamPayment,
  useListTeamMembers,
  getListTeamPaymentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck,
  ClipboardList,
  Plus
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({
    freelancerName: "",
    role: "photographer",
    eventsCount: 1,
    ratePerEvent: 300000,
    paidAmount: 0
  });

  const { data: rawPayments, isLoading: paymentsLoading } = useListTeamPayments();
  const { data: teamMembers } = useListTeamMembers();

  const createPayment = useCreateTeamPayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamPaymentsQueryKey() });
        setForm({ freelancerName: "", role: "photographer", eventsCount: 1, ratePerEvent: 300000, paidAmount: 0 });
        setAddDialogOpen(false);
        toast({ title: "Data Pembayaran Kru Ditambahkan" });
      }
    }
  });

  const updatePayment = useUpdateTeamPayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTeamPaymentsQueryKey() });
      }
    }
  });

  const handlePay = async (name: string) => {
    const matchingPayments = (rawPayments ?? []).filter(p => p.freelancerName === name);
    
    let paidCount = 0;
    for (const p of matchingPayments) {
      const totalEarned = p.eventsCount * p.ratePerEvent;
      if (p.paidAmount < totalEarned) {
        await updatePayment.mutateAsync({
          id: p.id,
          data: {
            paidAmount: totalEarned
          }
        });
        paidCount++;
      }
    }

    if (paidCount > 0) {
      toast({
        title: "Pembayaran Berhasil!",
        description: `Seluruh sisa saldo atas nama ${name} berhasil dilunasi.`
      });
    }
  };

  if (paymentsLoading) {
    return (
      <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
        <div className="h-10 w-48 bg-[#1e293b] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#111827] border border-[#1e293b] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Aggregate payments by freelancerName
  const aggregatedPayments: PaymentRow[] = [];
  const mapByName = new Map<string, {
    role: string;
    eventsCount: number;
    totalEarned: number;
    paidAmount: number;
    rates: number[];
  }>();

  (rawPayments ?? []).forEach(p => {
    const name = p.freelancerName;
    const current = mapByName.get(name) || {
      role: p.role,
      eventsCount: 0,
      totalEarned: 0,
      paidAmount: 0,
      rates: []
    };

    current.eventsCount += p.eventsCount;
    current.totalEarned += p.eventsCount * p.ratePerEvent;
    current.paidAmount += p.paidAmount;
    current.rates.push(p.ratePerEvent);
    current.role = p.role;

    mapByName.set(name, current);
  });

  let idx = 1;
  mapByName.forEach((val, name) => {
    const balance = val.totalEarned - val.paidAmount;
    const latestRate = val.rates[val.rates.length - 1] || 0;

    aggregatedPayments.push({
      id: idx++,
      name: name,
      role: val.role,
      eventsCount: val.eventsCount,
      ratePerEvent: latestRate,
      totalEarned: val.totalEarned,
      paidAmount: val.paidAmount,
      balance: balance > 0 ? balance : 0,
      status: balance <= 0 ? "Lunas" : "Belum Lunas"
    });
  });

  const totalPayroll = aggregatedPayments.reduce((sum, item) => sum + item.totalEarned, 0);
  const totalPaid = aggregatedPayments.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalOutstanding = aggregatedPayments.reduce((sum, item) => sum + item.balance, 0);

  const filteredPayments = aggregatedPayments.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || item.role.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Pembayaran Tim</h1>
            <p className="text-slate-400 text-xs mt-0.5">Kelola gaji, insentif, dan outstanding saldo kru freelance Anda secara akumulatif.</p>
          </div>
        </div>

        {/* Input Honor Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs">
              <Plus className="h-4 w-4 mr-1" /> Input Pembayaran Freelance
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Input Pembayaran Freelance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Dropdown Crew */}
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-[11px]">Pilih dari Kru Terdaftar (Opsional)</Label>
                <Select
                  onValueChange={(val) => {
                    if (val === "manual") {
                      setForm(prev => ({ ...prev, freelancerName: "" }));
                    } else {
                      const member = teamMembers?.find(m => String(m.id) === val);
                      if (member) {
                        setForm(prev => ({ ...prev, freelancerName: member.name, role: member.role }));
                      }
                    }
                  }}
                >
                  <SelectTrigger className="bg-[#0f172a] border-[#2d3748] text-white">
                    <SelectValue placeholder="-- Pilih Kru Terdaftar --" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                    <SelectItem value="manual" className="focus:bg-slate-800 text-slate-400">Input Nama Manual...</SelectItem>
                    {(teamMembers ?? []).map(m => (
                      <SelectItem key={m.id} value={String(m.id)} className="focus:bg-[#2d3748] focus:text-white capitalize">
                        {m.name} ({m.role.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Freelancer Name Input */}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Nama Freelance</Label>
                <Input
                  placeholder="Ketik nama freelance..."
                  value={form.freelancerName}
                  onChange={(e) => setForm({ ...form, freelancerName: e.target.value })}
                  className="bg-[#0f172a] border-[#2d3748] text-white"
                />
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Role / Posisi</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-[#0f172a] border-[#2d3748] text-white capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                    {["photographer", "videographer", "mua", "hair_stylist", "editor"].map((r) => (
                      <SelectItem key={r} value={r} className="capitalize focus:bg-[#2d3748] focus:text-white">
                        {r.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Jumlah Project</Label>
                  <Input
                    type="number"
                    value={form.eventsCount}
                    onChange={(e) => setForm({ ...form, eventsCount: Number(e.target.value) })}
                    className="bg-[#0f172a] border-[#2d3748] text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Tarif / Project (IDR)</Label>
                  <Input
                    type="number"
                    value={form.ratePerEvent}
                    onChange={(e) => setForm({ ...form, ratePerEvent: Number(e.target.value) })}
                    className="bg-[#0f172a] border-[#2d3748] text-white"
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Sudah Dibayar (IDR)</Label>
                <Input
                  type="number"
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                  className="bg-[#0f172a] border-[#2d3748] text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.freelancerName || createPayment.isPending}
                onClick={() => createPayment.mutate({ data: form })}
                className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold"
              >
                {createPayment.isPending ? "Menyimpan..." : "Simpan Pembayaran"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama kru atau role..."
            className="pl-9 bg-[#0f172a] border-[#1e293b] text-white text-xs py-2"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635] capitalize"
        >
          <option value="all">Semua Posisi</option>
          <option value="photographer">Photographer</option>
          <option value="videographer">Videographer</option>
          <option value="mua">MUA</option>
          <option value="hair_stylist">Hair Stylist</option>
          <option value="editor">Editor</option>
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
                      Tidak ada data kru yang cocok dengan filter atau belum ada inputan pembayaran.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(row => (
                    <tr key={row.name} className="hover:bg-[#0f172a]/20 transition-colors">
                      <td className="p-4 font-bold text-white capitalize">{row.name}</td>
                      <td className="p-4 text-slate-400 capitalize">{row.role.replace("_", " ")}</td>
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
                            onClick={() => handlePay(row.name)}
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
