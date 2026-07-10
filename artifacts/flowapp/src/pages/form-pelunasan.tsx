import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetBooking } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  CreditCard,
  QrCode,
  Coins,
  CheckCircle2,
  Upload,
  FileCheck
} from "lucide-react";

export default function FormPelunasan() {
  const [match, params] = useRoute<{ id: string }>("/form-pelunasan/:id");
  const id = Number(params?.id || 9); // Fallback to 9
  const { toast } = useToast();

  const { data: booking, isLoading, error } = useGetBooking(id);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "qris" | "cash">("bank");
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-[#0f172a] min-h-screen text-white flex flex-col items-center justify-center">
        <Skeleton className="h-10 w-48 bg-[#1e293b]" />
        <Skeleton className="h-96 w-full max-w-2xl bg-[#1e293b]" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-destructive bg-[#0f172a] min-h-screen text-center flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold">Booking / Invoice tidak ditemukan</h2>
        <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const invoice = booking.invoice;
  const packagePrice = booking.totalAmount || 0;
  const addonPrice = invoice ? invoice.total - invoice.subtotal : 0;
  const grandTotal = invoice ? invoice.total : packagePrice;
  const paidAmount = invoice ? invoice.paidAmount : 0;
  const balance = grandTotal - paidAmount;

  const invoiceNum = `INV-${new Date(booking.createdAt).getFullYear()}-${String(booking.id).padStart(4, "0")}`;

  const handleUploadProof = () => {
    setProofFile("bukti_transfer_mock.jpg");
    toast({
      title: "Bukti Transfer terpilih",
      description: "File bukti_transfer_mock.jpg siap diunggah."
    });
  };

  const handleSubmitPayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Pelunasan terkirim!",
        description: "Bukti pelunasan Anda telah dikirim untuk diverifikasi admin."
      });
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a] flex flex-col items-center">
      {/* Top navbar info */}
      <div className="w-full max-w-2xl flex justify-between items-center print:hidden border-b border-[#1e293b] pb-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="text-[10px] bg-green-500/10 text-green-400 font-bold border border-green-500/20 px-2 py-0.5 rounded uppercase">
          Form Pelunasan
        </span>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Page Title */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Studio</h1>
          <h2 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Form Pelunasan - {booking.clientName}</h2>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
            Silakan cek rincian booking Anda di bawah ini, lalu lanjutkan pembayaran pelunasan sesuai instruksi yang tersedia.
          </p>
        </div>

        {/* Invoice Final Card */}
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="py-4 border-b border-[#1e293b] flex flex-row justify-between items-center bg-[#0f172a]/20">
            <CardTitle className="text-xs font-bold text-slate-300">Invoice Final</CardTitle>
            <span className="text-[10px] text-slate-500 font-bold">
              Kode Booking: <span className="text-[#A3E635] font-mono">{invoiceNum}</span>
            </span>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            {/* Table detail list */}
            <div className="space-y-3.5 border-b border-[#1e293b]/70 pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Klien</span>
                <span className="font-bold text-white">{booking.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket</span>
                <span className="font-bold text-white">{booking.packageName || "Custom Package"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Acara</span>
                <span className="font-bold text-white">{booking.locationName || "Umum"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal</span>
                <span className="font-bold text-white">
                  {new Date(booking.eventDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}{" "}
                  {new Date(booking.eventDate).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#1e293b]/40 pt-3">
                <span className="text-slate-500">Total Awal</span>
                <span className="font-semibold text-white">{fmtIDR(packagePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paket Awal</span>
                <span className="font-semibold text-white">{fmtIDR(packagePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Add-on Paket</span>
                <span className="font-semibold text-white">{fmtIDR(addonPrice)}</span>
              </div>
            </div>

            {/* Final Addon items list stub */}
            <div className="p-4 bg-[#0f172a]/50 rounded-xl border border-dashed border-[#2d3748] space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Rincian Add-on Akhir</span>
                <span>0 item</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">Belum ada add-on akhir untuk booking ini.</p>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Add-on Akhir</span>
                <span className="font-semibold text-white">{fmtIDR(0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Final</span>
                <span className="font-semibold text-white">{fmtIDR(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-green-400 font-medium">
                <span>DP Dibayar</span>
                <span>- {fmtIDR(paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-[#1e293b] pt-3 text-sm font-bold">
                <span className="text-slate-300">Sisa Pelunasan</span>
                <span className="text-amber-500 font-black">{fmtIDR(balance)}</span>
              </div>
            </div>

            {/* Download Link */}
            <button
              onClick={() => toast({ title: "Invoice download started" })}
              className="flex items-center gap-1.5 text-[10px] text-[#A3E635] hover:text-white transition-colors font-bold mt-2 pt-1 uppercase tracking-wide cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Download Invoice Final
            </button>
          </CardContent>
        </Card>

        {/* Kirim Pelunasan Form Card */}
        <Card className="bg-[#111827] border-[#1e293b]">
          <CardHeader className="py-4 border-b border-[#1e293b] bg-[#0f172a]/20">
            <CardTitle className="text-xs font-bold text-slate-300">Kirim Pelunasan</CardTitle>
            <p className="text-[10px] text-slate-500 mt-1">
              Pilih metode pembayaran, lakukan pembayaran, lalu upload bukti bayar untuk diverifikasi admin.
            </p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Payment methods selector */}
            <div className="space-y-3">
              {/* Transfer Bank Option */}
              <div
                onClick={() => setPaymentMethod("bank")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                  paymentMethod === "bank"
                    ? "bg-[#A3E635]/5 border-[#A3E635]"
                    : "bg-[#0f172a] border-[#1e293b] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg mt-0.5">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">Transfer Bank</div>
                    {paymentMethod === "bank" && (
                      <div className="text-[10px] text-slate-400 mt-1.5 space-y-0.5">
                        <div>Bank BNI</div>
                        <div>No Rekening: <span className="font-mono text-white font-bold">123456</span></div>
                        <div>Nama Penerima: <span className="text-white font-bold">Erick Satria</span></div>
                      </div>
                    )}
                  </div>
                </div>
                {paymentMethod === "bank" && <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />}
              </div>

              {/* QRIS Option */}
              <div
                onClick={() => setPaymentMethod("qris")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                  paymentMethod === "qris"
                    ? "bg-[#A3E635]/5 border-[#A3E635]"
                    : "bg-[#0f172a] border-[#1e293b] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg mt-0.5">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">QRIS</div>
                    {paymentMethod === "qris" && (
                      <div className="text-[10px] text-slate-400 mt-2 flex flex-col items-center">
                        <div className="w-32 h-32 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                          {/* Fake QR code */}
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">QRIS CODE</div>
                        </div>
                        <span className="mt-1 text-[8px]">Scan barcode di atas menggunakan e-wallet Anda.</span>
                      </div>
                    )}
                  </div>
                </div>
                {paymentMethod === "qris" && <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />}
              </div>

              {/* Cash Option */}
              <div
                onClick={() => setPaymentMethod("cash")}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                  paymentMethod === "cash"
                    ? "bg-[#A3E635]/5 border-[#A3E635]"
                    : "bg-[#0f172a] border-[#1e293b] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg mt-0.5">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">Cash</div>
                  </div>
                </div>
                {paymentMethod === "cash" && <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />}
              </div>
            </div>

            {/* Proof Upload Area */}
            {paymentMethod !== "cash" && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Unggah Bukti Bayar</span>
                <div
                  onClick={handleUploadProof}
                  className="border border-dashed border-[#2d3748] bg-[#0f172a]/60 hover:bg-[#1e293b]/30 p-6 rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="h-6 w-6 text-slate-400" />
                  {proofFile ? (
                    <span className="text-xs text-green-400 font-bold">{proofFile}</span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-300">Klik untuk upload bukti bayar</span>
                      <span className="text-[9px] text-slate-500">Mendukung format JPG, PNG, atau PDF</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Confirm Submit button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={isSubmitting || (paymentMethod !== "cash" && !proofFile)}
              className="w-full bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs mt-2 py-5"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Pelunasan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
