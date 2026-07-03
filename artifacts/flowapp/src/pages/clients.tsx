import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListClients, useCreateClient, getListClientsQueryKey, ClientOrigin } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const ORIGIN_MAP: Record<string, { label: string; cls: string }> = {
  local:           { label: "DALAM KOTA",    cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  out_of_city:     { label: "LUAR KOTA",     cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  out_of_island:   { label: "LUAR PULAU",    cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  international:   { label: "INTERNASIONAL", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Clients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: clients, isLoading, error } = useListClients();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", city: "", clientOrigin: "local" });

  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setDialogOpen(false);
        setForm({ name: "", email: "", whatsapp: "", city: "", clientOrigin: "local" });
        toast({ title: "Client ditambahkan" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-[#1e293b]" />
        <Skeleton className="h-64 bg-[#1e293b]" />
      </div>
    );
  }

  if (error || !clients) {
    return <div className="p-6 text-red-400">Gagal memuat data klien.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-white font-bold text-2xl">CRM &amp; Client Database</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
              <Plus className="h-4 w-4 mr-1" /> Tambah Klien
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white">
            <DialogHeader><DialogTitle>Klien Baru</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Nama Lengkap</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-[#0f172a] border-[#374151] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-[#0f172a] border-[#374151] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Nomor WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+62..." className="bg-[#0f172a] border-[#374151] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Alamat / Kota</Label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="bg-[#0f172a] border-[#374151] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs">Kategori Asal</Label>
                <Select value={form.clientOrigin} onValueChange={v => setForm({ ...form, clientOrigin: v })}>
                  <SelectTrigger className="bg-[#0f172a] border-[#374151] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGIN_MAP).map(([v, { label }]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.name || !form.email || !form.whatsapp || createClient.isPending}
                onClick={() => createClient.mutate({ data: { name: form.name, email: form.email, whatsapp: form.whatsapp, city: form.city || undefined, clientOrigin: form.clientOrigin as any } })}
                className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold"
              >
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* CRM Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0f172a]/50 border-b border-[#2d3748] text-[#64748b] text-left">
                <th className="px-4 py-3 font-medium">Nama Pemesan</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nomor WhatsApp</th>
                <th className="px-4 py-3 font-medium">Alamat / Kota</th>
                <th className="px-4 py-3 font-medium">Kategori Asal</th>
                <th className="px-4 py-3 font-medium">Status Akun</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const origin = ORIGIN_MAP[client.clientOrigin ?? "local"];
                const init = initials(client.name);
                return (
                  <tr key={client.id} className="border-b border-[#2d3748] hover:bg-[#0f172a]/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-2 hover:text-[#A3E635] transition-colors">
                        <div className="h-7 w-7 rounded-full bg-[#374151] flex items-center justify-center text-[10px] font-bold text-[#A3E635] shrink-0">
                          {init}
                        </div>
                        <span className="text-white font-medium">{client.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">{client.email}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${client.whatsapp?.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="text-[#A3E635] hover:underline"
                      >
                        {client.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">{client.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${origin?.cls ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                        {origin?.label ?? client.clientOrigin ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-green-500/20 text-green-400 border-green-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[#475569]">Belum ada klien. Tambahkan klien baru di atas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
