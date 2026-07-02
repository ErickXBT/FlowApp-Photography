import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListClients, useCreateClient, getListClientsQueryKey, ClientOrigin } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

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
        toast({ title: "Client added" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !clients) {
    return <div className="p-8 text-destructive">Failed to load clients</div>;
  }

  const originColors: Record<string, string> = {
    local: "bg-green-100 text-green-800",
    out_of_city: "bg-blue-100 text-blue-800",
    out_of_island: "bg-purple-100 text-purple-800",
    international: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Clients</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+62..." />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Origin</Label>
                <Select value={form.clientOrigin} onValueChange={(v) => setForm({ ...form, clientOrigin: v })}>
                  <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(ClientOrigin).map((o) => (
                      <SelectItem key={o} value={o} className="capitalize">{o.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.name || !form.email || !form.whatsapp || createClient.isPending}
                onClick={() => createClient.mutate({
                  data: { name: form.name, email: form.email, whatsapp: form.whatsapp, city: form.city || undefined, clientOrigin: form.clientOrigin as any },
                })}
              >
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {clients.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.email} • {client.whatsapp}</div>
                </div>
                <div className="flex items-center gap-3">
                  {client.clientOrigin && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${originColors[client.clientOrigin] ?? "bg-muted text-muted-foreground"}`}>
                      {client.clientOrigin.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No clients found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
