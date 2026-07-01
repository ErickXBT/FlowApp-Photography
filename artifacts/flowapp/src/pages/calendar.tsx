import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetCalendarBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-200 text-yellow-900",
  dp_paid: "bg-blue-200 text-blue-900",
  fully_paid: "bg-teal-200 text-teal-900",
  shooting: "bg-primary/30 text-foreground",
  editing: "bg-purple-200 text-purple-900",
  delivered: "bg-green-200 text-green-900",
  closed: "bg-muted text-muted-foreground",
};

export default function CalendarView() {
  const { data: bookings, isLoading, error } = useGetCalendarBookings();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map: Record<string, typeof bookings> = {};
    (bookings ?? []).forEach((b) => {
      const key = new Date(b.eventDate).toDateString();
      map[key] = map[key] ? [...(map[key] as any[]), b] : [b];
    });
    return map;
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !bookings) {
    return <div className="p-8 text-destructive">Failed to load calendar</div>;
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = selectedDate ? (byDate[selectedDate] as any[] | undefined) ?? [] : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Calendar</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium w-40 text-center">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="aspect-square" />;
                const key = date.toDateString();
                const dayBookings = (byDate[key] as any[]) ?? [];
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(key)}
                    className={`aspect-square rounded-md border p-1 flex flex-col items-start gap-0.5 text-left hover:bg-muted/50 transition-colors overflow-hidden ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <span className="text-xs font-medium">{date.getDate()}</span>
                    {dayBookings.slice(0, 2).map((b) => (
                      <span key={b.id} className={`text-[10px] px-1 rounded truncate w-full ${statusColors[b.status] ?? "bg-muted"}`}>
                        {b.clientName}
                      </span>
                    ))}
                    {dayBookings.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayBookings.length - 2} more</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "Select a day"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDate && selectedBookings.length === 0 && (
              <p className="text-muted-foreground text-sm">No bookings on this day.</p>
            )}
            {selectedBookings.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="block border rounded-md p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">{b.clientName}</div>
                <div className="text-sm text-muted-foreground">{b.packageName}</div>
                <Badge variant="secondary" className="mt-2 capitalize">{b.status.replace("_", " ")}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
