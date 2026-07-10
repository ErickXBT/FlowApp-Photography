import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInvoice,
  useUpdateInvoicePayment,
  getGetInvoiceQueryKey,
  getListInvoicesQueryKey,
  getGetBookingQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  DollarSign,
  FileCheck,
  Building,
  CreditCard,
  User,
  Phone
} from "lucide-react";

export default function InvoiceDetail() {
  const [match, params] = useRoute<{ id: string }>("/invoices/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoice, isLoading, error } = useGetInvoice(id);
  const [paidAmount, setPaidAmount] = useState("");
  const [hideNominal] = useState(() => localStorage.getItem("hide_nominal") === "true");

  const recordPayment = useUpdateInvoicePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        if (invoice) queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(invoice.bookingId) });
        setPaidAmount("");
        toast({ title: "Payment recorded successfully" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-[#0f172a] min-h-screen text-white">
        <Skeleton className="h-10 w-64 bg-[#1e293b]" />
        <Skeleton className="h-[500px] w-full bg-[#1e293b]" />
      </div>
    );
  }

  if (error || !invoice) {
    return <div className="p-8 text-destructive bg-[#0f172a] min-h-screen">Failed to load invoice</div>;
  }

  const formatCurrency = (val: number) => {
    if (hideNominal) return "Rp ••••••";
    return fmtIDR(val);
  };

  const balance = invoice.total - invoice.paidAmount;
  const isPaid = balance <= 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a] print:bg-white print:text-black">
      {/* Back & Print controls */}
      <div className="flex justify-between items-center print:hidden border-b border-[#1e293b] pb-4">
        <Link href="/invoices" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Invoice
        </Link>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold gap-1.5 text-slate-300">
            <Printer className="h-4 w-4" /> Cetak Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Invoice PDF Sheet Template (8 cols) */}
        <div className="lg:col-span-8 bg-white text-black p-8 rounded-2xl shadow-xl space-y-8 min-h-[750px] border border-slate-200 font-sans print:shadow-none print:border-none print:p-0">
          
          {/* Top Logo / Cop section */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Studio</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Studio Management</p>
              <p className="text-xs text-slate-400 mt-1">Jl Mawar, Surabaya, Jawa Timur</p>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black text-slate-950 tracking-wider">INVOICE</h1>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">{invoice.invoiceNumber}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(invoice.issueDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
          </div>

          {/* Client Details block */}
          <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Detail Klien</span>
            <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <User className="h-3.5 w-3.5 text-slate-400" /> {invoice.clientName}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {invoice.booking.whatsappClient || "—"}
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50/30">
                  <td className="px-4 py-4 font-bold text-slate-800">
                    {invoice.booking.packageName || "Custom Package"}
                    <p className="text-[9px] text-slate-400 font-normal mt-0.5">{invoice.booking.specialRequest || "Sesi pemotretan studio"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">
                    {new Date(invoice.booking.eventDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {isPaid ? "Lunas" : "Belum Lunas"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-black text-slate-900">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Payment Details info (BNI / Mandiri) */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Informasi Pembayaran</span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> Bank BNI
                </div>
                <div className="font-medium">Nomor Rekening: <span className="font-mono font-bold text-slate-900">123456</span></div>
                <div className="font-medium">Nama Rekening: <span className="font-bold text-slate-900">Erick Satria</span></div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block text-right">Rincian Harga Awal</span>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Paket Awal:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-on Paket:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.total - invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-700">
                  <span>Sub Total:</span>
                  <span className="text-slate-900">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>DP Dibayar:</span>
                  <span>- {formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-slate-200 pt-2.5 text-sm font-black text-slate-900 bg-slate-50/50 p-2 rounded">
                  <span>Sisa Pembayaran:</span>
                  <span className="text-indigo-600 font-bold">{formatCurrency(balance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-center text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-8 mt-12 uppercase tracking-wide">
            Terima kasih atas kepercayaan Anda. Invoice ini digenerate otomatis oleh Client Desk.
          </div>
        </div>

        {/* Right Side: Admin Payment Recording (4 cols) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader className="py-4 border-b border-[#1e293b]">
              <CardTitle className="text-sm font-bold text-slate-200">Manajemen Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-3.5 bg-[#0f172a]/50 rounded-xl border border-[#1e293b] text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-white">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>Telah Dibayar:</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-indigo-400 font-bold border-t border-[#1e293b] pt-2">
                  <span>Sisa Pelunasan:</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
              </div>

              {/* Record Input */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-slate-300">Catat Jumlah Pelunasan Baru</Label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</div>
                  <Input
                    type="number"
                    min={0}
                    value={paidAmount}
                    placeholder="Masukkan nominal"
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="bg-[#0f172a] border-[#1e293b] pl-9 text-xs focus:border-[#A3E635]"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-xs"
                disabled={!paidAmount || recordPayment.isPending}
                onClick={() => recordPayment.mutate({ id, data: { paidAmount: Number(paidAmount) } })}
              >
                Simpan & Update Invoice
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#111827] border-[#1e293b]">
            <CardHeader className="py-4 border-b border-[#1e293b]">
              <CardTitle className="text-sm font-bold text-slate-200">Detail Booking Terkait</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3 text-slate-300">
              <div className="flex justify-between"><span className="text-slate-500">Nama Klien</span><span className="font-bold">{invoice.clientName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Paket</span><span className="font-bold">{invoice.booking.packageName || "Custom"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tanggal Acara</span><span className="font-bold">{new Date(invoice.booking.eventDate).toLocaleDateString("id-ID")}</span></div>
              <Button asChild variant="outline" className="w-full text-xs font-semibold mt-2 border-[#1e293b] hover:bg-slate-800 text-slate-200">
                <Link href={`/bookings/${invoice.bookingId}`}>Detail Booking</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
