import { useState } from "react";
import { useListBookings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Bookings() {
  const [status, setStatus] = useState<string>("all");
  const { data: bookings, isLoading, error } = useListBookings({ status: status !== "all" ? (status as any) : undefined });

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

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Bookings</h1>
        <Button>New Booking</Button>
      </div>

      <div className="flex space-x-2 overflow-auto pb-2">
        {["all", "pending", "dp_paid", "fully_paid", "shooting", "editing", "delivered", "closed"].map((s) => (
          <Button 
            key={s} 
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className="capitalize"
          >
            {s.replace('_', ' ')}
          </Button>
        ))}
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {bookings.map(booking => (
              <div key={booking.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">{booking.packageName} • {new Date(booking.eventDate).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">${booking.totalAmount?.toLocaleString()}</span>
                  <Badge variant="secondary" className="uppercase px-2 py-1">{booking.status}</Badge>
                  <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-primary hover:underline">
                    View
                  </Link>
                </div>
              </div>
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
