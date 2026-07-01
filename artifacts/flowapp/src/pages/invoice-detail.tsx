import { useState } from "react";
import { useParams, Link } from "wouter";
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

const statusVariant: Record<string, string> = {
  unpaid: "bg-red-200 text-red-900",
  partial: "bg-yellow-200 text-yellow-900",
  paid: "bg-green-200 text-green-900",
};

export default function InvoiceDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoice, isLoading, error } = useGetInvoice(id);
  const [paidAmount, setPaidAmount] = useState("");

  const recordPayment = useUpdateInvoicePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        if (invoice) queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(invoice.bookingId) });
        setPaidAmount("");
        toast({ title: "Payment recorded" });
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

  if (error || !invoice) {
    return <div className="p-8 text-destructive">Failed to load invoice</div>;
  }

  const balance = invoice.total - invoice.paidAmount;

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">{invoice.clientName}</p>
        </div>
        <Badge className={`capitalize text-sm px-3 py-1 ${statusVariant[invoice.status] ?? ""}`}>{invoice.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {invoice.lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                <span>{item.label}</span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-3 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>${invoice.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${invoice.total.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Paid</span><span>${invoice.paidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-medium"><span>Balance Due</span><span>${balance.toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Booking</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{invoice.booking.packageName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Event Date</span><span>{new Date(invoice.booking.eventDate).toLocaleDateString()}</span></div>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href={`/bookings/${invoice.bookingId}`}>View Booking</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Record Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>New Paid Amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={paidAmount}
                  placeholder={String(invoice.paidAmount)}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!paidAmount || recordPayment.isPending}
                onClick={() => recordPayment.mutate({ id, data: { paidAmount: Number(paidAmount) } })}
              >
                Save Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
