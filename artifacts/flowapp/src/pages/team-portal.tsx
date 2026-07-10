import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fmtIDR } from "@/lib/utils";
import {
  Briefcase,
  DollarSign,
  Image,
  FolderOpen,
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  Tag,
  LogOut,
  Navigation,
  Compass,
  UploadCloud,
  FileCheck
} from "lucide-react";

export default function TeamPortal() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleUploadClick = (jobName: string) => {
    toast({
      title: "Upload Files Initiated",
      description: `Buka media uploader untuk Job: ${jobName}.`
    });
  };

  const handleNavigationClick = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, "_blank");
    toast({
      title: "Google Maps dibuka",
      description: `Navigasi ke ${location}`
    });
  };

  const jobs = [
    {
      id: "INV-15032026C68D",
      client: "John",
      status: "delivered",
      statusText: "Sudah Selesai",
      date: "22 Mei 2026",
      time: "10.00 - 12.00",
      location: "Jl Mawar C-12, Surabaya, Jawa Timur, Indonesia",
      category: "Akad",
      pay: 50000,
      jpegProgress: "2/4",
      rawProgress: "0/4",
    },
    {
      id: "INV-31032026G5RM",
      client: "Ryan Eko Pramono",
      status: "editing",
      statusText: "Proses Edit",
      date: "8 Mei 2026",
      time: "11.00 - 15.00",
      location: "Universitas Airlangga - Kampus MERR C, Jl. Dr. Ir. H. Soekarno, Surabaya, Jawa Timur, Indonesia",
      category: "Wisuda",
      pay: 100000,
      jpegProgress: "0/4",
      rawProgress: "0/4",
    },
    {
      id: "INV-06062026L8FR",
      status: "closed",
      client: "Hehhehe",
      statusText: "Selesai",
      date: "29 Mei 2026",
      time: "10.00 - 13.00",
      location: "Jl. Pemuda No. 45, Surabaya, Jawa Timur, Indonesia",
      category: "Akad",
      pay: 50000,
      jpegProgress: "4/4",
      rawProgress: "4/4",
    }
  ];

  const filteredJobs = jobs.filter((j) =>
    j.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Header section with Freelancer info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Portal Tim & Freelancer
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Jadwal penugasan dan kelola pembayaran Anda.
          </p>
        </div>
        
        {/* Profile Card Mock */}
        <div className="flex items-center gap-3 bg-[#111827] border border-[#1e293b] px-4 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold">
            👤
          </div>
          <div>
            <div className="text-xs font-bold text-white">Agus</div>
            <div className="text-[10px] text-slate-400 font-medium">Photographer</div>
          </div>
          <button
            onClick={() => toast({ title: "Logged out from team portal" })}
            className="p-1 bg-[#1e293b] hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-900/30 shrink-0 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* JOB */}
        <div className="bg-[#111827] border border-[#1e293b] p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Job</div>
            <div className="text-2xl font-black text-white mt-1.5">3 Job</div>
          </div>
          <div className="h-9 w-9 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* BELUM DIBAYAR */}
        <div className="bg-[#111827] border border-[#1e293b] p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Belum Dibayar</div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">{fmtIDR(150000)}</div>
          </div>
          <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* UPLOAD JPEG */}
        <div className="bg-[#111827] border border-[#1e293b] p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Upload JPEG</div>
            <div className="text-2xl font-black text-green-400 mt-1.5">6/12</div>
          </div>
          <div className="h-9 w-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center justify-center">
            <Image className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* UPLOAD RAW */}
        <div className="bg-[#111827] border border-[#1e293b] p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Upload RAW</div>
            <div className="text-2xl font-black text-red-400 mt-1.5">0/12</div>
          </div>
          <div className="h-9 w-9 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center">
            <FolderOpen className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari klien, kode booking, tipe, lokasi.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] text-white text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Filter button stubs */}
        <button className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
        </button>
      </div>

      {/* Jobs List container */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="bg-[#111827] border-[#1e293b] overflow-hidden">
            {/* Header of job card */}
            <div className="px-5 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#0f172a]/20">
              <div>
                <h3 className="text-base font-bold text-white">{job.client}</h3>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{job.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={`capitalize text-[9px] px-2 py-0.5 rounded ${
                    job.status === "delivered"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : job.status === "editing"
                      ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  }`}
                >
                  {job.statusText}
                </Badge>
                
                {/* Upload Action */}
                <button
                  onClick={() => handleUploadClick(job.client)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#2d3748] rounded text-[10px] font-bold transition-colors"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-[#A3E635]" /> Upload
                </button>
              </div>
            </div>

            {/* Content of job card (Grid details) */}
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Jadwal */}
              <div className="p-4 bg-[#0f172a]/40 rounded-xl border border-[#1e293b] space-y-2 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Jadwal</span>
                </div>
                <div className="text-xs text-white font-semibold mt-1">
                  {job.date}
                </div>
                <div className="text-[10px] text-slate-400">
                  pukul {job.time}
                </div>
              </div>

              {/* Lokasi */}
              <div className="p-4 bg-[#0f172a]/40 rounded-xl border border-[#1e293b] space-y-2 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lokasi</span>
                </div>
                <div className="text-[10px] text-white line-clamp-2 mt-1">
                  {job.location}
                </div>
                
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => handleNavigationClick(job.location)}
                    className="p-1 bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-[#2d3748] transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#A3E635]" />
                  </button>
                  <button
                    onClick={() => handleNavigationClick(job.location)}
                    className="p-1 bg-[#1e293b] hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-[#2d3748] transition-colors"
                  >
                    <Compass className="h-3.5 w-3.5 text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Tipe Acara */}
              <div className="p-4 bg-[#0f172a]/40 rounded-xl border border-[#1e293b] space-y-2 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tipe Acara</span>
                </div>
                <div className="text-xs text-white font-semibold mt-1">
                  {job.category}
                </div>
                <div className="text-[10px] text-slate-400">
                  Bayaran Freelance: <span className="font-bold text-[#A3E635]">{fmtIDR(job.pay)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredJobs.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">Tidak ada job yang ditugaskan.</div>
        )}
      </div>
    </div>
  );
}
