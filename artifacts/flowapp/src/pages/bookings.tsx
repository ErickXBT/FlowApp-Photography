import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBookings,
  useCreateBooking,
  useListClients,
  useListPackages,
  getListBookingsQueryKey,
  getGetDashboardSummaryQueryKey,
  ClientOrigin,
} from "@workspace/api-client-react";
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
import { fmtIDR } from "@/lib/utils";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dp_paid: "bg-blue-100 text-blue-800",
  fully_paid: "bg-teal-100 text-teal-800",
  shooting: "bg-primary/20 text-foreground",
  editing: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

export default function Bookings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", packageId: "", eventDate: "", clientOrigin: "local" });

  const { data: bookings, isLoading, error } = useListBookings({ status: status !== "all" ? (status as any) : undefined });
  const { data: clients } = useListClients();
  const { data: packages } = useListPackages();

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDialogOpen(false);
        setForm({ clientId: "", packageId: "", eventDate: "", clientOrigin: "local" });
        toast({ title: "Booking created" });
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

  if (error || !bookings) {
    return <div className="p-8 text-destructive">Failed to load bookings</div>;
  }

  const clientOptions = Array.isArray(clients) ? clients : [];
  const packageOptions = Array.isArray(packages) ? packages : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Bookings</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Booking</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <Select value={form.packageId} onValueChange={(v) => setForm({ ...form, packageId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} — {fmtIDR(p.price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Client Origin</Label>
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
                disabled={!form.clientId || !form.packageId || !form.eventDate || createBooking.isPending}
                onClick={() => createBooking.mutate({
                  data: {
                    clientId: Number(form.clientId),
                    packageId: Number(form.packageId),
                    eventDate: form.eventDate,
                    clientOrigin: form.clientOrigin as any,
                  },
                })}
              >
                Create Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-2 overflow-auto pb-2">
        {["all", "pending", "dp_paid", "fully_paid", "shooting", "editing", "delivered", "closed"].map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className="capitalize whitespace-nowrap"
          >
            {s.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {bookings.map(booking => (
              <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">{booking.packageName} • {new Date(booking.eventDate).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{fmtIDR(booking.totalAmount ?? 0)}</span>
                  <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${statusColors[booking.status] ?? ""}`}>
                    {booking.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No bookings found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
