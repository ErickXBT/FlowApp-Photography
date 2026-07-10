import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";
import {
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronRight,
  CreditCard,
  QrCode,
  Coins,
  Smartphone,
  CheckCircle2,
  Sliders,
  DollarSign
} from "lucide-react";

export default function FormBookingSettings() {
  const { toast } = useToast();
  const formatCurrency = (val: number) => fmtIDR(val);
  const [eventType, setEventType] = useState("Umum");
  const [dpType, setDpType] = useState<"percent" | "nominal">("percent");
  const [dpPercentage, setDpPercentage] = useState(75);
  const [dpNominal, setDpNominal] = useState(500000);
  
  // Payment methods toggles
  const [transferActive, setTransferActive] = useState(true);
  const [qrisActive, setQrisActive] = useState(true);
  const [cashActive, setCashActive] = useState(false);

  // Form step in mobile preview
  const [activeStep, setActiveStep] = useState(1);

  // Toast helper for copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book`);
    toast({
      title: "Link Copied!",
      description: "Link booking form publik disalin ke clipboard."
    });
  };

  const handleOpenLink = () => {
    window.open(`${window.location.origin}/book`, "_blank");
  };

  // DP summary values
  const dpValues: Record<string, string> = {
    Umum: `${dpPercentage}%`,
    Wedding: "50%",
    Akad: "50%",
    Resepsi: "50%",
    Lamaran: "50%",
    Prewedding: "50%",
    Wisuda: "50%",
    Maternity: "50%",
    Newborn: "50%",
    Family: "50%",
    Komersil: "50%",
    "Custom/Lainnya": "50%",
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h1 className="text-2xl font-bold">Form Booking Publik</h1>
          <p className="text-slate-400 text-xs mt-1">
            Kelola dan bagikan form booking online untuk klien Anda.
          </p>
        </div>
        
        {/* Preview actions */}
        <div className="flex gap-2">
          <button
            onClick={() => toast({ title: "Preview Refreshed" })}
            className="p-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> Salin Link
          </button>
          <button
            onClick={handleOpenLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] rounded-lg text-xs font-bold transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Buka Form
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 p-1 bg-[#111827] rounded-lg border border-[#1e293b] w-fit">
        <span className="px-4 py-2 text-xs font-bold rounded-md bg-[#1e293b] text-white border border-[#2d3748] cursor-pointer">
          Pengaturan Umum
        </span>
        <span
          onClick={() => toast({ title: "Custom Form", description: "Fitur custom form editor premium. Coming soon!" })}
          className="px-4 py-2 text-xs font-semibold rounded-md text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          Custom Form
        </span>
      </div>

      {/* Grid: Left Panel Form Management, Right Panel Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* DP Settings card */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#A3E635]" />
              <h2 className="text-sm font-bold text-slate-200">Pengaturan Pembayaran</h2>
            </div>
            <p className="text-xs text-slate-400">Atur minimum DP berbeda untuk setiap tipe acara.</p>

            {/* Dropdowns */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Tipe Acara</Label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                  >
                    {Object.keys(dpValues).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Minimum DP — {eventType}</Label>
                  <div className="flex p-0.5 bg-[#0f172a] rounded-lg border border-[#1e293b]">
                    <button
                      onClick={() => setDpType("percent")}
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${
                        dpType === "percent" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Persentase (%)
                    </button>
                    <button
                      onClick={() => setDpType("nominal")}
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${
                        dpType === "nominal" ? "bg-[#1e293b] text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Nominal (Rp)
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider for Percentage or Input for Nominal */}
              <div className="py-2 space-y-3 bg-[#0f172a]/40 p-4 rounded-xl border border-[#1e293b]">
                {dpType === "percent" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Min. DP Persen</span>
                      <span className="text-[#A3E635]">{dpPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={dpPercentage}
                      onChange={(e) => setDpPercentage(Number(e.target.value))}
                      className="w-full accent-[#A3E635] bg-slate-700 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Min. DP Rupiah</span>
                      <span className="text-[#A3E635]">{fmtIDR(dpNominal)}</span>
                    </div>
                    <input
                      type="number"
                      min="50000"
                      step="50000"
                      value={dpNominal}
                      onChange={(e) => setDpNominal(Number(e.target.value))}
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs focus:outline-none text-white focus:border-[#A3E635]"
                    />
                  </div>
                )}
              </div>

              {/* DP List view per type */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ringkasan DP</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(dpValues).map((type) => {
                    const active = type === eventType;
                    const displayVal = active
                      ? dpType === "percent"
                        ? `${dpPercentage}%`
                        : fmtIDR(dpNominal)
                      : dpValues[type];
                    return (
                      <div
                        key={type}
                        className={`text-[9px] px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 transition-all ${
                          active
                            ? "bg-[#A3E635]/15 border-[#A3E635] text-[#A3E635]"
                            : "bg-[#0f172a] border-[#1e293b] text-slate-400"
                        }`}
                      >
                        <span>{type}:</span>
                        <span className="font-bold">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Toggle card */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#A3E635]" />
              <h2 className="text-sm font-bold text-slate-200">Metode Pembayaran</h2>
            </div>
            <p className="text-xs text-slate-400">
              Pilih metode pembayaran yang tampil di form booking, atur rekening bank yang aktif, dan upload gambar QRIS.
            </p>

            {/* Methods list */}
            <div className="space-y-3">
              {/* Transfer Bank */}
              <div className="flex items-center justify-between p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg mt-0.5">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Transfer Bank</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Bank BNI • Rek: 123456 • A.N: Erick Satria</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferActive}
                    onChange={(e) => setTransferActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#A3E635]"></div>
                </label>
              </div>

              {/* QRIS */}
              <div className="flex items-center justify-between p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg mt-0.5">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">QRIS</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Gambar QRIS siap dipakai oleh klien</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrisActive}
                    onChange={(e) => setQrisActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#A3E635]"></div>
                </label>
              </div>

              {/* Cash */}
              <div className="flex items-center justify-between p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg mt-0.5">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Cash</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Bukti pembayaran otomatis nonaktif</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cashActive}
                    onChange={(e) => setCashActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#A3E635]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Phone Mockup Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
            <Smartphone className="h-4 w-4" /> Live Mobile Preview
          </div>

          {/* Phone Frame */}
          <div className="w-72 bg-black border-[6px] border-slate-800 rounded-[30px] aspect-[9/18.5] shadow-2xl relative overflow-hidden flex flex-col">
            {/* Speaker & Notch */}
            <div className="absolute top-0 inset-x-0 h-4 bg-black flex justify-center items-start z-20">
              <div className="w-20 h-3 bg-black rounded-b-xl flex justify-center items-center">
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>

            {/* Status Bar */}
            <div className="pt-4 px-5 pb-1.5 flex justify-between items-center text-[8px] text-slate-400 bg-slate-900/60 font-semibold z-10 shrink-0">
              <span>10:34</span>
              <div className="flex gap-1">
                <span>5G</span>
                <span>🔋 75%</span>
              </div>
            </div>

            {/* Mobile View Screen content */}
            <div className="flex-1 bg-slate-950 overflow-y-auto px-4 py-4 flex flex-col space-y-4">
              {/* Logo / Header */}
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                  📸
                </div>
                <div className="text-xs font-black text-white mt-1">Erick Satria Studio</div>
                <p className="text-[7px] text-slate-500 mt-0.5">Silakan isi formulir di bawah ini untuk booking.</p>
              </div>

              {/* Stepper bar */}
              <div className="grid grid-cols-4 gap-1 border-y border-slate-900 py-2">
                {[
                  { step: 1, label: "Klien" },
                  { step: 2, label: "Paket" },
                  { step: 3, label: "Detail" },
                  { step: 4, label: "Bayar" },
                ].map((s) => {
                  const active = s.step === activeStep;
                  const passed = s.step < activeStep;
                  return (
                    <div key={s.step} className="flex flex-col items-center text-center">
                      <div
                        className={`h-4 w-4 rounded-full text-[8px] flex items-center justify-center font-bold transition-all ${
                          active
                            ? "bg-[#A3E635] text-[#0f172a]"
                            : passed
                            ? "bg-green-500/20 text-green-400 border border-green-500/25"
                            : "bg-slate-900 text-slate-600"
                        }`}
                      >
                        {passed ? "✔" : s.step}
                      </div>
                      <span className="text-[6px] text-slate-500 font-bold mt-1 uppercase">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step Forms */}
              {activeStep === 1 && (
                <div className="space-y-2.5 flex-1">
                  <span className="text-[8px] font-black text-[#A3E635] uppercase tracking-wider block">Informasi Klien</span>
                  <div className="space-y-2 text-[8px] text-slate-300">
                    <div className="space-y-1">
                      <label className="font-semibold block">Nama Lengkap *</label>
                      <input
                        type="text"
                        disabled
                        placeholder="Nama lengkap Anda"
                        className="w-full bg-[#111827] border border-[#1e293b] rounded p-1.5 text-[8px] text-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Nomor WhatsApp *</label>
                      <div className="flex border border-[#1e293b] rounded bg-[#111827] overflow-hidden">
                        <span className="bg-[#1e293b] border-r border-[#1e293b] p-1 text-[8px] text-slate-400">🇮🇩 +62</span>
                        <input
                          type="text"
                          disabled
                          placeholder="8123456789"
                          className="flex-1 bg-transparent p-1 text-[8px] text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Instagram</label>
                      <input
                        type="text"
                        disabled
                        placeholder="@username"
                        className="w-full bg-[#111827] border border-[#1e293b] rounded p-1.5 text-[8px] text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-2.5 flex-1">
                  <span className="text-[8px] font-black text-[#A3E635] uppercase tracking-wider block">Pilih Paket</span>
                  <div className="space-y-1.5">
                    {/* Package 1 */}
                    <div className="p-2 border border-[#A3E635]/30 bg-[#A3E635]/5 rounded-lg flex justify-between items-center text-[8px]">
                      <div>
                        <div className="font-bold text-white">Paket Gold</div>
                        <div className="text-[6px] text-slate-400 mt-0.5">2 jam • File Siap</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#A3E635]">{formatCurrency(4000000)}</div>
                      </div>
                    </div>
                    {/* Package 2 */}
                    <div className="p-2 border border-slate-900 bg-slate-900/40 rounded-lg flex justify-between items-center text-[8px] opacity-75">
                      <div>
                        <div className="font-bold text-slate-300">Paket Wedding 1 jam</div>
                        <div className="text-[6px] text-slate-500 mt-0.5">2 jam</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-300">{formatCurrency(300000)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-2.5 flex-1">
                  <span className="text-[8px] font-black text-[#A3E635] uppercase tracking-wider block">Detail Sesi</span>
                  <div className="space-y-1.5 text-[7px] text-slate-300">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Tipe Acara</span>
                      <span className="font-bold">{eventType}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Tanggal</span>
                      <span className="font-bold">12 Mei 2026</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-500">Jadwal</span>
                      <span className="font-bold">10.00 - 12.00</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-2.5 flex-1">
                  <span className="text-[8px] font-black text-[#A3E635] uppercase tracking-wider block">Pembayaran DP</span>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[8px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Tagihan:</span>
                        <span className="font-bold text-white">{formatCurrency(4000000)}</span>
                      </div>
                      <div className="flex justify-between text-[#A3E635] font-bold">
                        <span>Minimal DP ({dpPercentage}%):</span>
                        <span>{formatCurrency(dpType === "percent" ? 4000000 * (dpPercentage / 100) : dpNominal)}</span>
                      </div>
                    </div>
                    
                    {/* List active payment methods in preview */}
                    <div className="space-y-1">
                      <span className="text-[6px] font-bold text-slate-500 uppercase tracking-wide block">Metode Pembayaran</span>
                      {transferActive && (
                        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[7px] flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="h-2 w-2 text-green-400" /> Transfer Bank
                        </div>
                      )}
                      {qrisActive && (
                        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[7px] flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="h-2 w-2 text-green-400" /> QRIS
                        </div>
                      )}
                      {cashActive && (
                        <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[7px] flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="h-2 w-2 text-green-400" /> Cash
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Stepper controls */}
              <div className="flex gap-2 pt-2 shrink-0">
                <button
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[8px] font-bold rounded-lg border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setActiveStep(prev => (prev === 4 ? 1 : prev + 1))}
                  className="flex-1 py-1.5 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-[8px] font-bold rounded-lg transition-all"
                >
                  {activeStep === 4 ? "Restart" : "Lanjut"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
