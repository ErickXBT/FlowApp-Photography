import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetClient, useUpdateClient, getGetClientQueryKey, getListClientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";

export default function ClientDetail() {
  const [match, params] = useRoute<{ id: string }>("/clients/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading, error } = useGetClient(id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", city: "", province: "", country: "", notes: "" });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        email: client.email,
        whatsapp: client.whatsapp,
        city: client.city ?? "",
        province: client.province ?? "",
        country: client.country ?? "",
        notes: client.notes ?? "",
      });
    }
  }, [client]);

  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setEditing(false);
        toast({ title: "Client updated" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !client) {
    return <div className="p-8 text-destructive">Failed to load client</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold">{client.name}</h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
        {!editing && <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Contact & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateClient.mutate({ id, data: form })} disabled={updateClient.isPending}>Save</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span>{client.whatsapp}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{[client.city, client.province, client.country].filter(Boolean).join(", ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Origin</span><Badge variant="outline">{client.clientOrigin ?? "—"}</Badge></div>
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block mb-1">Notes</span>
                  <p>{client.notes || "No notes yet."}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Spent</span><span className="font-bold text-lg">{fmtIDR(client.totalSpent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bookings</span><span>{client.bookings.length}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Booking History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {client.bookings.map((b) => (
              <Link key={b.id} href={`/bookings/${b.id}`} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium">{b.packageName}</div>
                  <div className="text-sm text-muted-foreground">{new Date(b.eventDate).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{fmtIDR(b.totalAmount)}</span>
                  <Badge variant="secondary" className="capitalize">{b.status.replace("_", " ")}</Badge>
                </div>
              </Link>
            ))}
            {client.bookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
