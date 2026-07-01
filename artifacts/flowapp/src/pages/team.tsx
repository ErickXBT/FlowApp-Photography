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

const emptyForm = { name: "", role: "photographer" as string, photoUrl: "", bio: "", portfolioUrl: "" };

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
    setForm({ name: m.name, role: m.role, photoUrl: m.photoUrl ?? "", bio: m.bio ?? "", portfolioUrl: m.portfolioUrl ?? "" });
    setDialogOpen(true);
  };

  const submit = () => {
    const data = { name: form.name, role: form.role as any, photoUrl: form.photoUrl || undefined, bio: form.bio || undefined, portfolioUrl: form.portfolioUrl || undefined };
    if (editingMember) updateMember.mutate({ id: editingMember.id, data });
    else createMember.mutate({ data });
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Team</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Member</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={m.photoUrl ?? undefined} />
                  <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{m.name}</div>
                  <Badge variant="secondary" className="capitalize">{m.role.replace("_", " ")}</Badge>
                </div>
              </div>
              {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}
              {m.portfolioUrl && (
                <a href={m.portfolioUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block">
                  View Portfolio
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><Trash2 className="h-3 w-3 mr-1 text-destructive" /> Remove</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMember.mutate({ id: m.id })}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {members.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No team members yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Photo URL</Label>
              <Input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Portfolio URL</Label>
              <Input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.name || createMember.isPending || updateMember.isPending} onClick={submit}>
              {editingMember ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
