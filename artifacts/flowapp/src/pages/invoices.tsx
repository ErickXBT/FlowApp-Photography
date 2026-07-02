import { useListInvoices } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fmtIDR } from "@/lib/utils";

const statusVariant: Record<string, string> = {
  unpaid: "bg-red-200 text-red-900",
  partial: "bg-yellow-200 text-yellow-900",
  paid: "bg-green-200 text-green-900",
};

export default function Invoices() {
  const { data: invoices, isLoading, error } = useListInvoices();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !invoices) {
    return <div className="p-8 text-destructive">Failed to load invoices</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-serif font-bold">Invoices</h1>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{inv.invoiceNumber}</div>
                  <div className="text-sm text-muted-foreground">{inv.clientName} • Due {new Date(inv.dueDate).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold">{fmtIDR(inv.total)}</div>
                    <div className="text-xs text-muted-foreground">Paid {fmtIDR(inv.paidAmount)}</div>
                  </div>
                  <Badge className={`capitalize ${statusVariant[inv.status] ?? ""}`}>{inv.status}</Badge>
                </div>
              </Link>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No invoices found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
