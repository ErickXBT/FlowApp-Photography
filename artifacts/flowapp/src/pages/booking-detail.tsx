import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetBooking,
  useUpdateBookingStatus,
  useListBookingFiles,
  useCreateBookingFile,
  useToggleFileSelection,
  useDeleteBookingFile,
  getGetBookingQueryKey,
  getListBookingFilesQueryKey,
  getGetDashboardSummaryQueryKey,
  getListBookingsQueryKey,
  BookingStatus,
  FolderType,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { fmtIDR } from "@/lib/utils";

const statusOptions = Object.values(BookingStatus);
const folderTypes = Object.values(FolderType);

export default function BookingDetail() {
  const [match, params] = useRoute<{ id: string }>("/bookings/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: booking, isLoading, error } = useGetBooking(id);
  const { data: files } = useListBookingFiles(id);

  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [folderType, setFolderType] = useState<string>("edited");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const updateStatus = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Status updated" });
      },
    },
  });

  const createFile = useCreateBookingFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        setFileDialogOpen(false);
        setFileName("");
        setFileUrl("");
        toast({ title: "File added" });
      },
    },
  });

  const toggleSelection = useToggleFileSelection({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
      },
    },
  });

  const deleteFile = useDeleteBookingFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingFilesQueryKey(id) });
        toast({ title: "File removed" });
      },
    },
  });

  const clientPortalUrl = typeof window !== "undefined" ? `${window.location.origin}/client/bookings/${id}` : "";

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !booking) {
    return <div className="p-8 text-destructive">Failed to load booking</div>;
  }

  const filesByFolder: Record<string, typeof files> = {};
  (files ?? []).forEach((f) => {
    filesByFolder[f.folderType] = filesByFolder[f.folderType] ? [...(filesByFolder[f.folderType] as any[]), f] : [f];
  });

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">{booking.client.name}</h1>
          <p className="text-muted-foreground">{booking.package.name} • {new Date(booking.eventDate).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={clientPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-sm font-bold rounded-lg transition-colors"
          >
            Buka Client Portal
          </a>
          <Select
            value={booking.status}
            onValueChange={(status) => updateStatus.mutate({ id, data: { status: status as any } })}
          >
            <SelectTrigger className="w-44 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><Link href={`/clients/${booking.client.id}`} className="font-medium text-primary hover:underline">{booking.client.name}</Link></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{booking.client.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span>{booking.client.whatsapp}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{booking.package.name} ({fmtIDR(booking.package.price)})</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-bold">{fmtIDR(booking.totalAmount)}</span></div>
            {booking.locationName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>
                  {booking.locationName}
                  {booking.mapsLink && (
                    <a href={booking.mapsLink} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">Map</a>
                  )}
                </span>
              </div>
            )}
            {booking.locationAddress && (
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-xs">{booking.locationAddress}</span></div>
            )}
            {booking.teamMembers.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Team</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {booking.teamMembers.map((tm) => (
                    <Badge key={tm.id} variant="secondary" className="capitalize">{tm.name} · {tm.role.replace("_", " ")}</Badge>
                  ))}
                </div>
              </div>
            )}
            {booking.addOns.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Add-ons</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {booking.addOns.map((a) => (
                    <Badge key={a.id} variant="outline">{a.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {booking.moodboardLinks.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Moodboard</span>
                <div className="flex flex-col items-end gap-1">
                  {booking.moodboardLinks.map((l, i) => (
                    <a key={i} href={l} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-xs">{l}</a>
                  ))}
                </div>
              </div>
            )}
            {booking.specialRequest && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground block mb-1">Special Request</span>
                <p>{booking.specialRequest}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {booking.invoice ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-medium">{booking.invoice.invoiceNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{fmtIDR(booking.invoice.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{fmtIDR(booking.invoice.paidAmount)}</span></div>
                <Badge variant="secondary" className="capitalize">{booking.invoice.status}</Badge>
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link href={`/invoices/${booking.invoice.id}`}>View Invoice</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No invoice generated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Delivery Files</CardTitle>
            {clientPortalUrl && (
              <a href={clientPortalUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                Client portal link
              </a>
            )}
          </div>
          <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add File</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Delivery File</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Folder</Label>
                  <Select value={folderType} onValueChange={setFolderType}>
                    <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {folderTypes.map((f) => (
                        <SelectItem key={f} value={f} className="capitalize">{f.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="wedding-final-01.jpg" />
                </div>
                <div className="space-y-2">
                  <Label>File URL</Label>
                  <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!fileName || !fileUrl || createFile.isPending}
                  onClick={() => createFile.mutate({ bookingId: id, data: { folderType: folderType as any, fileName, fileUrl } })}
                >
                  Add File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(filesByFolder).length === 0 && (
            <p className="text-muted-foreground text-sm">No files delivered yet.</p>
          )}
          {Object.entries(filesByFolder).map(([folder, list]) => (
            <div key={folder}>
              <h3 className="font-medium capitalize mb-2 text-sm text-muted-foreground">{folder.replace("_", " ")}</h3>
              <div className="space-y-2">
                {(list as any[]).map((f) => (
                  <div key={f.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={f.selected}
                        onCheckedChange={(checked) => toggleSelection.mutate({ id: f.id, data: { selected: !!checked } })}
                      />
                      <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-sm hover:underline">{f.fileName}</a>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteFile.mutate({ id: f.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
