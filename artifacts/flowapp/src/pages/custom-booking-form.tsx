import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Link2,
  Copy,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  X
} from "lucide-react";

interface CustomForm {
  id: number;
  formName: string;
  clientName: string;
  packageName: string;
  standardPrice: number;
  customPrice: number;
  dpPercentage: number;
  eventDate: string;
  status: "Aktif" | "Sudah Digunakan" | "Kedaluwarsa";
  link: string;
}

export default function CustomBookingForm() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Custom forms list state
  const [customForms, setCustomForms] = useState<CustomForm[]>([
    {
      id: 1,
      formName: "Booking Khusus John - Akad & Resepsi",
      clientName: "John",
      packageName: "Paket Wedding 1 jam",
      standardPrice: 1500000,
      customPrice: 1200000,
      dpPercentage: 20,
      eventDate: "2026-07-25",
      status: "Aktif",
      link: `${window.location.origin}/book?customForm=1`
    },
    {
      id: 2,
      formName: "Form Prewed Diskon Spesial - Sarah",
      clientName: "Sarah Amelia",
      packageName: "Custom Package",
      standardPrice: 2000000,
      customPrice: 1800000,
      dpPercentage: 30,
      eventDate: "2026-08-12",
      status: "Sudah Digunakan",
      link: `${window.location.origin}/book?customForm=2`
    }
  ]);

  // Form builder fields state
  const [formName, setFormName] = useState("");
  const [clientName, setClientName] = useState("");
  const [packageName, setPackageName] = useState("Paket Wedding 1 jam");
  const [customPrice, setCustomPrice] = useState("");
  const [dpPercentage, setDpPercentage] = useState("30");
  const [eventDate, setEventDate] = useState("");

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !clientName || !customPrice || !eventDate) {
      toast({
        variant: "destructive",
        title: "Input Belum Lengkap",
        description: "Harap isi semua kolom wajib di formulir."
      });
      return;
    }

    const priceNum = Number(customPrice);
    const newId = customForms.length + 1;
    const newForm: CustomForm = {
      id: newId,
      formName,
      clientName,
      packageName,
      standardPrice: priceNum + 200000, // Standard higher
      customPrice: priceNum,
      dpPercentage: Number(dpPercentage),
      eventDate,
      status: "Aktif",
      link: `${window.location.origin}/book?customForm=${newId}`
    };

    setCustomForms(prev => [newForm, ...prev]);
    setModalOpen(false);
    
    // Clear inputs
    setFormName("");
    setClientName("");
    setCustomPrice("");
    setEventDate("");

    toast({
      title: "Link Form Booking Khusus Berhasil Dibuat!",
      description: "Anda bisa langsung menyalin link di daftar form."
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Disalin!",
      description: "Tautan form booking khusus disalin ke clipboard."
    });
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Form Booking Khusus</h1>
            <p className="text-slate-400 text-xs mt-0.5">Buat formulir checkout personal dengan penyesuaian harga khusus klien premium Anda.</p>
          </div>
        </div>
        
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Buat Form Khusus
        </Button>
      </div>

      {/* Booking Form List */}
      <Card className="bg-[#111827] border-[#1e293b]">
        <CardHeader className="py-4 border-b border-[#1e293b]">
          <CardTitle className="text-xs font-bold text-slate-300">Daftar Link Form Booking Khusus</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a]/60 text-slate-400 border-b border-[#1e293b] font-bold">
                <tr>
                  <th className="p-4">Nama Form</th>
                  <th className="p-4">Nama Klien</th>
                  <th className="p-4">Paket Acara</th>
                  <th className="p-4">Harga Normal</th>
                  <th className="p-4">Harga Khusus</th>
                  <th className="p-4 text-center">DP (%)</th>
                  <th className="p-4">Jadwal Target</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {customForms.map(form => (
                  <tr key={form.id} className="hover:bg-[#0f172a]/20 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      {form.formName}
                    </td>
                    <td className="p-4 text-slate-300">{form.clientName}</td>
                    <td className="p-4 text-slate-400 font-medium">{form.packageName}</td>
                    <td className="p-4 text-slate-500 line-through">{fmtIDR(form.standardPrice)}</td>
                    <td className="p-4 font-bold text-[#A3E635]">{fmtIDR(form.customPrice)}</td>
                    <td className="p-4 text-center font-semibold text-white">{form.dpPercentage}%</td>
                    <td className="p-4 text-slate-300 font-semibold">{form.eventDate}</td>
                    <td className="p-4 text-center">
                      <Badge
                        className={
                          form.status === "Aktif"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : form.status === "Sudah Digunakan"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }
                      >
                        {form.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleCopyLink(form.link)}
                        className="p-2 bg-[#1e293b] hover:bg-slate-800 border border-[#2d3748] rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        title="Salin Link Form"
                      >
                        <Copy className="h-3.5 w-3.5" /> Salin Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Creation Modal form popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white">Buat Form Booking Khusus</h3>
                <p className="text-[10px] text-slate-500 mt-1">Formulir booking ini hanya dapat diisi satu kali untuk klien tertentu.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-4 text-xs">
              {/* Form Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Nama Form Khusus *</label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Form Booking Paket Wedding John & Sarah"
                  className="bg-[#0f172a] border-[#1e293b] text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Target Client Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Nama Klien *</label>
                  <Input
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Contoh: John"
                    className="bg-[#0f172a] border-[#1e293b] text-white"
                    required
                  />
                </div>

                {/* Event target date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Tanggal Acara *</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="bg-[#0f172a] border-[#1e293b] text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Select standard package reference */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Paket Referensi *</label>
                  <select
                    value={packageName}
                    onChange={e => setPackageName(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635]"
                  >
                    <option value="Paket Wedding 1 jam">Paket Wedding 1 jam</option>
                    <option value="Paket Studio Portrait">Paket Studio Portrait</option>
                    <option value="Custom Package">Custom Package (Bebas)</option>
                  </select>
                </div>

                {/* Custom price override value */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Harga Khusus (IDR) *</label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    placeholder="Contoh: 1200000"
                    className="bg-[#0f172a] border-[#1e293b] text-white"
                    required
                  />
                </div>
              </div>

              {/* DP Percentage value selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Ketentuan DP (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={dpPercentage}
                    onChange={e => setDpPercentage(e.target.value)}
                    className="flex-1 accent-[#A3E635]"
                  />
                  <span className="font-mono font-bold text-white text-xs shrink-0 w-8">{dpPercentage}%</span>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-[#1e293b] bg-transparent text-slate-300 hover:bg-[#1e293b] font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold"
                >
                  Generate Link Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
