import { useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  useGetBooking,
  useListBookingFiles,
  useToggleFileSelection,
  getListBookingFilesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtIDR } from "@/lib/utils";
import { useMemo } from "react";

export default function ClientPortal() {
  const [match, params] = useRoute<{ id: string }>("/client/bookings/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: booking, isLoading, error } = useGetBooking(id);
  const { data: files } = useListBookingFiles(id);

  const toggleSelection = useToggleFileSelection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
      },
    },
  });

  const filesByFolder = useMemo(() => {
    const grouped: Record<string, typeof files> = {};
    (files ?? []).forEach((file) => {
      grouped[file.folderType] = grouped[file.folderType]
        ? [...(grouped[file.folderType] as any[]), file]
        : [file];
    });
    return grouped;
  }, [files]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-10 w-72 mb-6" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="rounded-3xl border border-muted p-8 text-center">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <p className="text-muted-foreground mt-2">The booking link is invalid or the booking does not exist.</p>
        </div>
      </div>
    );
  }

  const balance = booking.invoice ? booking.invoice.total - booking.invoice.paidAmount : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-serif font-bold">Your Booking</h1>
          <p className="text-muted-foreground">Review your session details and download delivered files.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span>{booking.client.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{booking.package.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Event Date</span><span>{new Date(booking.eventDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span><Badge className="capitalize">{booking.status.replace(/_/g, " ")}</Badge></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{fmtIDR(booking.totalAmount)}</span></div>
            {booking.invoice && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span>{booking.invoice.invoiceNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span>{fmtIDR(balance)}</span></div>
              </>
            )}
            <div className="pt-2 border-t">
              <h2 className="text-sm font-semibold">Notes</h2>
              <p className="text-sm text-muted-foreground">{booking.specialRequest || "No special requests provided."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Delivered Files</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(filesByFolder).length === 0 ? (
              <p className="text-muted-foreground">No files have been delivered yet. Please check back later.</p>
            ) : (
              Object.entries(filesByFolder).map(([folder, items]) => (
                <div key={folder} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{folder.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">{(items as any[]).length} files</span>
                  </div>
                  <div className="space-y-2">
                    {(items as any[]).map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-muted p-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={file.selected}
                            onCheckedChange={(checked) => toggleSelection.mutate({ id: file.id, data: { selected: !!checked } })}
                          />
                          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                            {file.fileName}
                          </a>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={file.fileUrl} target="_blank" rel="noreferrer">Download</a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/book" className="text-sm text-primary hover:underline">Make a new booking</Link>
          <Button asChild>
            <a href="/" className="text-sm">Back to homepage</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
