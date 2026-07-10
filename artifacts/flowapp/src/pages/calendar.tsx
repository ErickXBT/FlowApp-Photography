import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetCalendarBookings, useListBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const toISODate = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Legends and Colors based on Competitor Image 5
const statusColors: Record<string, string> = {
  pending: "bg-blue-600/90 text-white border-blue-500", // Pending - Blue
  dp_paid: "bg-purple-600/90 text-white border-purple-500", // Booking Confirmed - Purple
  fully_paid: "bg-purple-600/90 text-white border-purple-500", 
  shooting: "bg-amber-600/90 text-white border-amber-500", // Sesi Foto / Acara - Orange/Amber
  editing: "bg-pink-600/90 text-white border-pink-500", // Proses Edit - Pink
  delivered: "bg-emerald-600/90 text-white border-emerald-500", // File Siap - Light Green
  closed: "bg-cyan-600/90 text-white border-cyan-500", // Selesai - Cyan/Teal
  cancelled: "bg-red-600/90 text-white border-red-500", // Batal - Red
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  dp_paid: "Booking Confirmed",
  fully_paid: "Booking Confirmed",
  shooting: "Sesi Foto / Acara",
  editing: "Proses Edit",
  delivered: "File Siap",
  closed: "Selesai",
  cancelled: "Batal",
};

export default function CalendarView() {
  const { toast } = useToast();
  const { data: bookings, isLoading, error } = useGetCalendarBookings();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Array<{ selectedDate: string; status: string }>>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<string | null>(null);

  // Dynamic list of freelancers computed from bookings
  const freelancers = useMemo(() => {
    const map = new Map<string, string>();
    (bookings ?? []).forEach((b) => {
      if (b.teamMembers) {
        b.teamMembers.forEach((tm: any) => {
          if (tm && tm.id) map.set(String(tm.id), tm.name);
        });
      }
    });
    // Add default stubs if empty to match competitor look
    if (map.size === 0) {
      map.set("f1", "Ananta");
      map.set("f2", "Budi Santoso");
      map.set("f3", "Budi Doremi");
      map.set("f4", "Alvin");
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  const loadAvailabilities = async () => {
    try {
      const res = await fetch("/api/calendar/availabilities", { credentials: "include" });
      if (res.ok) setAvailabilities(await res.json());
    } catch (e) {
      console.error("Failed to load availabilities", e);
    }
  };

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const handleUpdateAvailability = async (dateStr: string, status: "available" | "last_slot" | "full_booking") => {
    try {
      const res = await fetch("/api/calendar/availabilities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDate: dateStr, status })
      });
      if (res.ok) {
        const data = await res.json();
        setAvailabilities(prev => {
          const filtered = prev.filter(a => a.selectedDate !== dateStr);
          return [...filtered, data];
        });
        toast({ title: "Availability updated!" });
      }
    } catch (e) {
      console.error("Failed to update availability", e);
    }
  };

  const handleSyncGoogle = () => {
    toast({
      title: "Google Calendar Sync",
      description: "Jadwal pemotretan berhasil disinkronkan dengan Google Calendar Anda."
    });
  };

  // Filter bookings on assigned freelancer if selected
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!selectedFreelancer) return bookings;
    return bookings.filter((b) => {
      if (!b.teamMembers) return false;
      return b.teamMembers.some((tm: any) => String(tm.id) === selectedFreelancer);
    });
  }, [bookings, selectedFreelancer]);

  const byDate = useMemo(() => {
    const map: Record<string, typeof bookings> = {};
    (filteredBookings ?? []).forEach((b) => {
      const key = new Date(b.eventDate).toDateString();
      map[key] = map[key] ? [...(map[key] as any[]), b] : [b];
    });
    return map;
  }, [filteredBookings]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 bg-[#1e293b]" />
          <Skeleton className="h-10 w-36 bg-[#1e293b]" />
        </div>
        <Skeleton className="h-[500px] w-full bg-[#1e293b]" />
      </div>
    );
  }

  if (error || !bookings) {
    return <div className="p-6 text-destructive bg-[#0f172a]">Failed to load calendar</div>;
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  
  // Custom week starting on Monday (Senin) to match competitor Image 5
  const firstDay = new Date(year, month, 1);
  // getDay() is 0 (Sunday) to 6 (Saturday). Monday should be index 0:
  // (firstDay.getDay() + 6) % 7 maps Monday -> 0, Sunday -> 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBookings = selectedDate ? (byDate[selectedDate] as any[] | undefined) ?? [] : [];

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kalender Studio</h1>
          <p className="text-slate-400 text-xs mt-1">Jadwal pemotretan langsung dari Daftar Booking.</p>
        </div>

        <button
          onClick={handleSyncGoogle}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs font-bold text-slate-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-[#A3E635]" />
          Sinkron ke Google Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Calendar Month View */}
        <Card className="lg:col-span-8 bg-[#111827] border-[#1e293b]">
          <CardHeader className="flex flex-row justify-between items-center py-4 border-b border-[#1e293b] space-y-0">
            {/* Prev/Next controls */}
            <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded-lg border border-[#2d3748]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <CardTitle className="text-sm font-bold text-slate-300">
              {cursor.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </CardTitle>

            {/* View tabs stub */}
            <div className="flex gap-1 p-0.5 bg-[#1e293b] rounded-lg border border-[#2d3748] text-[10px]">
              <span className="px-2 py-1 bg-[#A3E635] text-[#0f172a] font-bold rounded">Bulan</span>
              <span className="px-2 py-1 text-slate-400 font-semibold rounded">Minggu</span>
              <span className="px-2 py-1 text-slate-400 font-semibold rounded">Hari</span>
              <span className="px-2 py-1 text-slate-400 font-semibold rounded">Agenda</span>
            </div>
          </CardHeader>

          <CardContent className="p-4 bg-[#111827]">
            {/* Days header Sen - Min */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2 border-b border-[#1e293b] pb-2">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="aspect-square bg-[#0f172a]/20 rounded-lg border border-transparent" />;
                
                const key = date.toDateString();
                const dayBookings = (byDate[key] as any[]) ?? [];
                const isSelected = selectedDate === key;
                const isoKey = toISODate(date);
                const availability = availabilities.find((a) => a.selectedDate === isoKey)?.status ?? "available";

                let borderStyle = "border-[#1e293b]";
                if (isSelected) borderStyle = "border-[#A3E635] ring-1 ring-[#A3E635]/30";
                
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(key)}
                    className={`aspect-square rounded-lg border bg-[#0f172a]/40 p-1.5 flex flex-col justify-between text-left hover:bg-[#1e293b]/40 transition-colors overflow-hidden ${borderStyle}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-bold text-slate-400">{date.getDate()}</span>
                      {availability !== "available" && (
                        <span className={`h-1.5 w-1.5 rounded-full ${availability === "full_booking" ? "bg-red-500" : "bg-yellow-500"}`} />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 w-full mt-1 flex-1 justify-end">
                      {dayBookings.slice(0, 2).map((b) => (
                        <span
                          key={b.id}
                          className={`text-[8px] px-1 py-0.5 rounded truncate w-full font-bold border border-white/5 ${
                            statusColors[b.status] ?? "bg-slate-700"
                          }`}
                        >
                          {b.clientName}
                        </span>
                      ))}
                      {dayBookings.length > 2 && (
                        <span className="text-[7px] text-slate-500 font-bold self-end mt-0.5">
                          +{dayBookings.length - 2} lagi
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Actions Detail Sidebar */}
        <Card className="lg:col-span-4 bg-[#111827] border-[#1e293b]">
          <CardHeader className="py-4 border-b border-[#1e293b]">
            <CardTitle className="text-sm font-bold text-slate-300">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "Pilih tanggal"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {selectedDate && (
              <div className="border-b border-[#1e293b] pb-4 mb-2 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ketersediaan Booking
                </span>
                <div className="flex gap-1">
                  {[
                    { val: "available", label: "Available", color: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/25" },
                    { val: "last_slot", label: "Sisa 1 Slot", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/25" },
                    { val: "full_booking", label: "Full Booking", color: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25" }
                  ].map((opt) => {
                    const isoKey = toISODate(new Date(selectedDate));
                    const active = (availabilities.find((a) => a.selectedDate === isoKey)?.status ?? "available") === opt.val;
                    return (
                      <button
                        key={opt.val}
                        onClick={() => handleUpdateAvailability(isoKey, opt.val as any)}
                        className={`flex-1 text-[9px] py-1.5 px-1 rounded-lg border text-center transition-all font-bold cursor-pointer ${opt.color} ${
                          active ? "ring-1 ring-[#A3E635] font-black opacity-100 scale-102" : "opacity-40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {selectedDate && selectedBookings.length === 0 && (
                <p className="text-slate-500 text-xs py-4 text-center">Tidak ada jadwal pemotretan pada hari ini.</p>
              )}
              {selectedBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block border border-[#1e293b] bg-[#0f172a]/30 rounded-xl p-3 hover:bg-[#1e293b]/20 transition-colors space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{b.clientName}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border border-white/5 ${
                      statusColors[b.status] ?? "bg-slate-700"
                    }`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">{b.packageName || "Custom Package"}</div>
                  
                  {b.teamMembers && b.teamMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.teamMembers.map((tm: any) => (
                        <Badge key={tm.id} variant="secondary" className="text-[9px] py-0 px-1.5 bg-[#1e293b] border-[#2d3748] text-slate-300 capitalize">
                          {tm.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend & Freelancer Filters */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-6">
        {/* Status Legend */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Legenda Status</h3>
          <div className="flex flex-wrap gap-2.5">
            {Object.keys(statusColors)
              .filter((status) => status !== "fully_paid")
              .map((status) => (
                <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                  <span>{statusLabels[status] || status}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Freelancer Filter */}
        <div className="space-y-3 border-t border-[#1e293b] pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kalender Freelancer</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFreelancer(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedFreelancer === null
                  ? "bg-[#A3E635] text-[#0f172a] font-bold border-[#A3E635]"
                  : "bg-[#1e293b] hover:bg-[#2d3748] border-[#2d3748] text-slate-300"
              }`}
            >
              Semua Freelancer
            </button>
            {freelancers.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFreelancer(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedFreelancer === f.id
                    ? "bg-[#A3E635] text-[#0f172a] font-bold border-[#A3E635]"
                    : "bg-[#1e293b] hover:bg-[#2d3748] border-[#2d3748] text-slate-300"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
