import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  getListTeamMembersQueryKey,
  TeamRole,
} from "@workspace/api-client-react";
import type { TeamMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Plus } from "lucide-react";

const roles = Object.values(TeamRole);

const emptyForm = {
  name: "",
  role: "photographer" as string,
  photoUrl: "",
  bio: "",
  portfolioUrl: "",
  whatsapp: "",
  ratePerEvent: 0,
  paidAmount: 0,
  eventsCount: 0
};

export default function Team() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: members, isLoading, error } = useListTeamMembers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTeamMembersQueryKey() });

  const createMember = useCreateTeamMember({
    mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setForm(emptyForm); toast({ title: "Team member added" }); } },
  });
  const updateMember = useUpdateTeamMember({
    mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditingMember(null); setForm(emptyForm); toast({ title: "Team member updated" }); } },
  });
  const deleteMember = useDeleteTeamMember({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "Team member removed" }); } },
  });

  const openCreate = () => { setEditingMember(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setForm({
      name: m.name,
      role: m.role,
      photoUrl: m.photoUrl ?? "",
      bio: m.bio ?? "",
      portfolioUrl: m.portfolioUrl ?? "",
      whatsapp: m.whatsapp ?? "",
      ratePerEvent: m.ratePerEvent ?? 0,
      paidAmount: m.paidAmount ?? 0,
      eventsCount: m.eventsCount ?? 0
    });
    setDialogOpen(true);
  };

  const submit = () => {
    const data = {
      name: form.name,
      role: form.role as any,
      photoUrl: form.photoUrl || undefined,
      bio: form.bio || undefined,
      portfolioUrl: form.portfolioUrl || undefined,
      whatsapp: form.whatsapp || undefined,
      ratePerEvent: Number(form.ratePerEvent) || 0,
      paidAmount: Number(form.paidAmount) || 0,
      eventsCount: Number(form.eventsCount) || 0
    };
    if (editingMember) updateMember.mutate({ id: editingMember.id, data });
    else createMember.mutate({ data });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setForm(prev => ({ ...prev, photoUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !members) {
    return <div className="p-8 text-destructive">Failed to load team</div>;
  }

  return (
    <div className="p-8 space-y-8 text-white bg-[#0f172a] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold">Team / Freelance</h1>
          <p className="text-slate-400 text-xs mt-1">Kelola kru freelance, asisten, fotografer, videografer, dan tarif mereka.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">
          <Plus className="h-4 w-4 mr-1" /> Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Card key={m.id} className="bg-[#111827] border-[#1e293b]">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={m.photoUrl ?? undefined} />
                  <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{m.name}</div>
                  <Badge variant="secondary" className="capitalize bg-slate-800 text-slate-300 border-none">{m.role.replace("_", " ")}</Badge>
                </div>
              </div>
              {m.bio && <p className="text-sm text-slate-400">{m.bio}</p>}
              {m.portfolioUrl && (
                <a href={m.portfolioUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline block">
                  View Portfolio
                </a>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-450">
                {m.whatsapp && (
                  <div>
                    <span className="text-slate-500 block font-bold text-[8px] uppercase">WhatsApp</span>
                    <span className="font-semibold text-slate-300">{m.whatsapp}</span>
                  </div>
                )}
                {m.ratePerEvent !== undefined && m.ratePerEvent !== null && (
                  <div>
                    <span className="text-slate-500 block font-bold text-[8px] uppercase">Tarif / Project</span>
                    <span className="font-semibold text-white">Rp {m.ratePerEvent.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-700 text-rose-400 hover:bg-rose-950/20 hover:text-rose-400">
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1e293b] border-[#2d3748] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMember.mutate({ id: m.id })} className="bg-rose-600 hover:bg-rose-700 text-white">Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {members.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">No team members yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-[#2d3748] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0f172a] border-[#2d3748] text-white" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-slate-300">Role / Posisi</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="capitalize bg-[#0f172a] border-[#2d3748] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#2d3748] text-white">
                  {roles.map((r) => <SelectItem key={r} value={r} className="capitalize focus:bg-[#2d3748] focus:text-white">{r.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Contact WhatsApp</Label>
              <Input placeholder="Contoh: 628123456789" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="bg-[#0f172a] border-[#2d3748] text-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Photo URL / Upload</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={form.photoUrl.startsWith("data:") ? "Local Image Selected" : form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="https://... atau klik Upload"
                  className="bg-[#0f172a] border-[#2d3748] text-white flex-1"
                  disabled={form.photoUrl.startsWith("data:")}
                />
                {form.photoUrl.startsWith("data:") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm(prev => ({ ...prev, photoUrl: "" }))}
                    className="text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10 shrink-0"
                  >
                    Hapus
                  </Button>
                )}
                <label className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-xs font-bold px-3 py-2.5 rounded-md cursor-pointer shrink-0 transition-colors">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Tarif per Project (IDR)</Label>
              <Input type="number" placeholder="Contoh: 350000" value={form.ratePerEvent || ""} onChange={(e) => setForm({ ...form, ratePerEvent: Number(e.target.value) })} className="bg-[#0f172a] border-[#2d3748] text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Jumlah Project</Label>
                <Input type="number" value={form.eventsCount || ""} placeholder="0" onChange={(e) => setForm({ ...form, eventsCount: Number(e.target.value) })} className="bg-[#0f172a] border-[#2d3748] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Sudah Dibayar</Label>
                <Input type="number" value={form.paidAmount || ""} placeholder="0" onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} className="bg-[#0f172a] border-[#2d3748] text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="bg-[#0f172a] border-[#2d3748] text-white resize-none" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-slate-300">Portfolio URL</Label>
              <Input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="https://..." className="bg-[#0f172a] border-[#2d3748] text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.name || createMember.isPending || updateMember.isPending} onClick={submit} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">
              {editingMember ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
