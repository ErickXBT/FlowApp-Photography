import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtIDR } from "@/lib/utils";
import {
  Folder,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Check,
  CheckCircle2,
  ArrowLeft,
  Info,
  Copy,
  ExternalLink,
  Calendar,
  Phone,
  Lock,
  Clock,
  Sparkles,
  DollarSign,
  Briefcase,
  FileText
} from "lucide-react";

interface Booking {
  id: number;
  bookingCode?: string;
  clientName: string;
  clientWhatsapp?: string;
  clientCity?: string;
  eventDate: string;
  totalAmount: number;
  status: string;
  googleDriveLink?: string;
  detectSubfolder?: boolean;
  whatsappClient?: string;
  whatsappAdmin?: string;
  maxPhotos?: number;
  pilihFotoEnabled?: boolean;
  downloadFotoEnabled?: boolean;
  pilihFotoDuration?: string;
  pilihFotoPassword?: string;
  downloadFotoDuration?: string;
  downloadFotoPassword?: string;
  pilihFotoTambahanEnabled?: boolean;
  pilihFotoCetakEnabled?: boolean;
}

interface TenantProfile {
  id: number;
  slug: string;
  studioName: string;
  defaultWhatsappAdmin?: string;
  defaultMaxPhotos: number;
  defaultPilihFotoPassword?: string;
  defaultDownloadFotoPassword?: string;
  defaultSamePasswordDownload: boolean;
  defaultSamePasswordTambahan: boolean;
  defaultSamePasswordCetak: boolean;
  defaultDetectSubfolder: boolean;
  defaultPilihFotoEnabled: boolean;
  defaultDownloadFotoEnabled: boolean;
  defaultTambahanFotoEnabled: boolean;
  defaultCetakFotoEnabled: boolean;
  defaultPilihFotoDuration: string;
  defaultDownloadDuration: string;
}

export default function StatusBookingPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"daftar" | "status-edit" | "status-tambahan">("daftar");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Client photos selection view states
  const [viewingBookingSelection, setViewingBookingSelection] = useState<Booking | null>(null);
  const [viewingFiles, setViewingFiles] = useState<any[]>([]);
  const [viewingFilesLoading, setViewingFilesLoading] = useState(false);

  const handleViewSelection = async (booking: Booking) => {
    setViewingBookingSelection(booking);
    setViewingFilesLoading(true);
    setViewingFiles([]);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/files`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setViewingFiles(data.filter(f => f.selected && f.folderType === "raw"));
        }
      }
    } catch (e) {
      console.error("Error fetching selected files:", e);
    } finally {
      setViewingFilesLoading(false);
    }
  };

  // Form states for Create Project
  const [clientName, setClientName] = useState("");
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [detectSubfolder, setDetectSubfolder] = useState(false);
  const [clientCountryCode, setClientCountryCode] = useState("+62");
  const [clientPhone, setClientPhone] = useState("");
  const [adminCountryCode, setAdminCountryCode] = useState("+62");
  const [adminPhone, setAdminPhone] = useState("");
  const [maxPhotos, setMaxPhotos] = useState(5);
  const [pilihFotoEnabled, setPilihFotoEnabled] = useState(true);
  const [downloadFotoEnabled, setDownloadFotoEnabled] = useState(true);
  const [pilihFotoDuration, setPilihFotoDuration] = useState("Selamanya");
  const [pilihFotoPassword, setPilihFotoPassword] = useState("");
  const [downloadFotoDuration, setDownloadFotoDuration] = useState("Selamanya");
  const [downloadFotoPassword, setDownloadFotoPassword] = useState("");
  const [samePassword, setSamePassword] = useState(true);
  const [pilihFotoTambahanEnabled, setPilihFotoTambahanEnabled] = useState(false);
  const [pilihFotoCetakEnabled, setPilihFotoCetakEnabled] = useState(false);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);

  // Form submission loading states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/landing/me/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.slug) {
          setProfile(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookings(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, []);

  // Synchronize passwords if checkbox is checked
  useEffect(() => {
    if (samePassword) {
      setDownloadFotoPassword(pilihFotoPassword);
    }
  }, [pilihFotoPassword, samePassword]);

  // Prepopulate form fields with tenant defaults when form is opened
  useEffect(() => {
    if (showCreateForm && profile) {
      setDetectSubfolder(profile.defaultDetectSubfolder ?? false);
      
      const adminNo = profile.defaultWhatsappAdmin ? profile.defaultWhatsappAdmin.replace(/^\+62/, "") : "";
      setAdminPhone(adminNo);
      
      setMaxPhotos(profile.defaultMaxPhotos ?? 10);
      setPilihFotoEnabled(profile.defaultPilihFotoEnabled ?? true);
      setPilihFotoDuration(profile.defaultPilihFotoDuration ?? "Selamanya");
      setDownloadFotoDuration(profile.defaultDownloadDuration ?? "Selamanya");
      
      const defaultPwd = profile.defaultPilihFotoPassword ?? "";
      setPilihFotoPassword(defaultPwd);
      setSamePassword(profile.defaultSamePasswordDownload ?? true);
      
      if (profile.defaultSamePasswordDownload) {
        setDownloadFotoPassword(defaultPwd);
      } else {
        setDownloadFotoPassword(profile.defaultDownloadFotoPassword ?? "");
      }
      
      setPilihFotoTambahanEnabled(profile.defaultTambahanFotoEnabled ?? false);
      setPilihFotoCetakEnabled(profile.defaultCetakFotoEnabled ?? false);
    }
  }, [showCreateForm, profile]);

  const handleCopyLink = (bookingId: number) => {
    const link = `${window.location.origin}/client/bookings/${bookingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(bookingId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !googleDriveLink) {
      setSubmitError("Nama Klien dan Link Google Drive wajib diisi.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const fullClientPhone = clientPhone ? `${clientCountryCode}${clientPhone.replace(/^0+/, "")}` : "";
      const fullAdminPhone = adminPhone ? `${adminCountryCode}${adminPhone.replace(/^0+/, "")}` : "";

      // 1. Create client first to get clientId
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          whatsapp: fullClientPhone,
          email: `${clientName.toLowerCase().replace(/\s+/g, "")}@example.com`
        })
      });

      if (!clientRes.ok) {
        const errData = await clientRes.json();
        throw new Error(errData.error || "Gagal membuat klien baru.");
      }

      const clientData = await clientRes.json();
      const clientId = clientData.id;

      // 2. Create booking project
      const bookingPayload = {
        clientId,
        eventDate: new Date(eventDate).toISOString(),
        googleDriveLink,
        detectSubfolder,
        whatsappClient: fullClientPhone,
        whatsappAdmin: fullAdminPhone,
        maxPhotos,
        pilihFotoEnabled,
        downloadFotoEnabled,
        pilihFotoDuration,
        pilihFotoPassword,
        downloadFotoDuration,
        downloadFotoPassword: samePassword ? pilihFotoPassword : downloadFotoPassword,
        pilihFotoTambahanEnabled,
        pilihFotoCetakEnabled,
        clientOrigin: "local"
      };

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload)
      });

      if (!bookingRes.ok) {
        const errData = await bookingRes.json();
        throw new Error(errData.error || "Gagal membuat project baru.");
      }

      setSubmitSuccess("Project baru berhasil dibuat!");
      // Reset form fields
      setClientName("");
      setGoogleDriveLink("");
      setDetectSubfolder(false);
      setClientPhone("");
      setAdminPhone("");
      setMaxPhotos(5);
      setPilihFotoEnabled(true);
      setDownloadFotoEnabled(true);
      setPilihFotoDuration("Selamanya");
      setPilihFotoPassword("");
      setDownloadFotoDuration("Selamanya");
      setDownloadFotoPassword("");
      setSamePassword(true);
      setPilihFotoTambahanEnabled(false);
      setPilihFotoCetakEnabled(false);

      // Load updated bookings & back to list
      await loadBookings();
      setTimeout(() => {
        setShowCreateForm(false);
        setSubmitSuccess("");
      }, 1000);

    } catch (err: any) {
      setSubmitError(err.message || "Terjadi kesalahan saat memproses.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    loadBookings();
  };

  // Status mapping logic for Tab 2 (Status Klien Edit)
  const getClientEditStatus = (b: Booking) => {
    if (b.status === "completed" || b.status === "delivered") return "ditinjau";
    if (b.status === "editing" || b.status === "confirmed") return "sedang-memilih";
    return "belum-memilih";
  };

  // Status mapping logic for Tab 3 (Status Tambahan Foto)
  const getClientTambahanStatus = (b: Booking) => {
    if (!b.pilihFotoTambahanEnabled) return null;
    if (b.status === "completed") return "ditinjau";
    if (b.status === "editing") return "sedang-memilih";
    return "belum-memilih";
  };

  // Counters for Tab 2 (Status Klien Edit)
  const editCounters = bookings.reduce(
    (acc, b) => {
      const status = getClientEditStatus(b);
      if (status === "belum-memilih") acc.belum++;
      else if (status === "sedang-memilih") acc.sedang++;
      else if (status === "ditinjau") acc.ditinjau++;
      return acc;
    },
    { belum: 0, sedang: 0, ditinjau: 0 }
  );

  // Counters for Tab 3 (Status Tambahan Foto)
  const tambahanCounters = bookings.reduce(
    (acc, b) => {
      const status = getClientTambahanStatus(b);
      if (status === "belum-memilih") acc.belum++;
      else if (status === "sedang-memilih") acc.sedang++;
      else if (status === "ditinjau") acc.ditinjau++;
      return acc;
    },
    { belum: 0, sedang: 0, ditinjau: 0 }
  );

  const filteredBookings = bookings.filter(b =>
    b.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Top Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-4">
        <div className="flex gap-2 p-1 bg-[#1e293b] rounded-lg border border-[#2d3748]">
          <button
            onClick={() => {
              setActiveTab("daftar");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "daftar"
                ? "bg-[#A3E635] text-[#0f172a]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Daftar Project
          </button>
          <button
            onClick={() => {
              setActiveTab("status-edit");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "status-edit"
                ? "bg-[#A3E635] text-[#0f172a]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Status Klien Edit
          </button>
          <button
            onClick={() => {
              setActiveTab("status-tambahan");
              setShowCreateForm(false);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "status-tambahan"
                ? "bg-[#A3E635] text-[#0f172a]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Status Tambahan Foto
          </button>
        </div>

        {activeTab !== "daftar" && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Main Viewport */}
      {activeTab === "daftar" && (
        <div className="space-y-6">
          {!showCreateForm ? (
            /* PROJECT LIST VIEW */
            bookingsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 bg-[#1e293b] rounded-xl" />
                <Skeleton className="h-80 bg-[#1e293b] rounded-xl" />
              </div>
            ) : bookings.length === 0 ? (
              /* EMPTY STATE SCREEN */
              <div className="flex flex-col items-center justify-center py-20 bg-[#1e293b] rounded-xl border border-[#2d3748] text-center px-4">
                <div className="p-4 bg-[#0f172a] rounded-full border border-[#2d3748] text-[#64748b] mb-4">
                  <Folder className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Belum ada proyek</h3>
                <p className="text-slate-400 max-w-sm mb-6 text-sm">
                  Buat proyek baru untuk mulai melayani klien dan mengirimkan file dengan otomatisasi invoicing.
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold rounded-lg transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Project Baru
                  </button>
                  <button className="px-6 py-3 bg-[#2d3748] hover:bg-[#374151] border border-[#475569] text-white font-bold rounded-lg transition-colors text-sm">
                    Buat Batch
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE PROJECT LIST */
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h2 className="text-lg font-bold">Semua Project Aktif</h2>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold rounded-lg transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Project Baru
                  </button>
                </div>

                <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#64748b] border-b border-[#2d3748] bg-[#0f172a]/50">
                          <th className="text-left px-5 py-3.5 font-medium">Proyek ID</th>
                          <th className="text-left px-5 py-3.5 font-medium">Detail Klien</th>
                          <th className="text-left px-5 py-3.5 font-medium">Tanggal Event</th>
                          <th className="text-left px-5 py-3.5 font-medium">Batas Foto</th>
                          <th className="text-left px-5 py-3.5 font-medium">Drive Link</th>
                          <th className="text-left px-5 py-3.5 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr
                            key={b.id}
                            className="border-b border-[#2d3748] hover:bg-[#0f172a]/40 transition-colors"
                          >
                            <td className="px-5 py-4 text-[#A3E635] font-mono font-medium">
                              PRJ-{String(b.id).padStart(4, "0")}
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-white font-semibold">{b.clientName}</div>
                              {b.clientWhatsapp && (
                                <div className="text-[#64748b] text-xs mt-0.5 flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {b.clientWhatsapp}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-[#94a3b8]">
                              {b.eventDate
                                ? new Date(b.eventDate).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })
                                : "TBD"}
                            </td>
                            <td className="px-5 py-4 text-[#94a3b8] font-semibold">
                              {b.maxPhotos || 0} Foto
                            </td>
                            <td className="px-5 py-4 text-[#64748b]">
                              {b.googleDriveLink ? (
                                <a
                                  href={b.googleDriveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1 text-xs truncate max-w-xs"
                                >
                                  Open Drive <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopyLink(b.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f172a] hover:bg-[#2d3748] border border-[#2d3748] text-xs rounded transition-colors text-slate-300 hover:text-white"
                                >
                                  {copiedId === b.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-[#A3E635]" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy Link
                                    </>
                                  )}
                                </button>
                                <a
                                   href={`/client/bookings/${b.id}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex items-center gap-1 px-2.5 py-1.5 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-xs font-bold rounded transition-colors"
                                 >
                                  View <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* CREATE PROJECT NEW FORM VIEW */
            <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-6 max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#2d3748] pb-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Daftar
                </button>
                <h2 className="text-lg font-bold text-white">Buat Project Baru</h2>
              </div>

              {/* Warnings / Vendor Check */}
              {profileLoading ? (
                <Skeleton className="h-20 bg-[#0f172a] rounded-lg" />
              ) : !profile ? (
                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200">
                  <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Isi Nama Vendor / Studio dulu</h4>
                    <p className="text-xs text-amber-300/80">
                      Nama Vendor diperlukan sebelum membuat project agar link client memakai format /client/nama-vendor/project-id.
                    </p>
                    <button
                      onClick={() => setLocation("/settings")}
                      className="px-3 py-1.5 bg-amber-500 text-[#0f172a] font-bold text-xs rounded hover:bg-amber-400 transition-colors"
                    >
                      Buka Settings
                    </button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama Klien */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300">Nama Klien *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Masukkan nama klien..."
                      className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  {/* Tanggal Event */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300">Tanggal Event *</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  {/* Google Drive Link */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-300">Link Google Drive *</label>
                    <input
                      type="url"
                      required
                      value={googleDriveLink}
                      onChange={e => setGoogleDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  {/* Deteksi Subfolder */}
                  <div className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#2d3748] rounded-lg md:col-span-2">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-white">Deteksi Subfolder</div>
                      <div className="text-xs text-slate-400">
                        Otomatis membaca subfolder di dalam Google Drive (seperti 'Edited', 'Raw')
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detectSubfolder}
                        onChange={e => setDetectSubfolder(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A3E635]"></div>
                    </label>
                  </div>

                  {/* WhatsApp Klien */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300">WhatsApp Klien</label>
                    <div className="flex">
                      <select
                        value={clientCountryCode}
                        onChange={e => setClientCountryCode(e.target.value)}
                        className="bg-[#0f172a] border border-r-0 border-[#2d3748] text-slate-300 text-sm rounded-l-lg px-3 py-2.5 focus:outline-none"
                      >
                        <option value="+62">ID +62</option>
                        <option value="+1">US +1</option>
                        <option value="+65">SG +65</option>
                        <option value="+60">MY +60</option>
                      </select>
                      <input
                        type="text"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="81234567890"
                        className="flex-1 bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-r-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Admin */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300">WhatsApp Admin / CS</label>
                    <div className="flex">
                      <select
                        value={adminCountryCode}
                        onChange={e => setAdminCountryCode(e.target.value)}
                        className="bg-[#0f172a] border border-r-0 border-[#2d3748] text-slate-300 text-sm rounded-l-lg px-3 py-2.5 focus:outline-none"
                      >
                        <option value="+62">ID +62</option>
                        <option value="+1">US +1</option>
                        <option value="+65">SG +65</option>
                        <option value="+60">MY +60</option>
                      </select>
                      <input
                        type="text"
                        value={adminPhone}
                        onChange={e => setAdminPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="81234567890"
                        className="flex-1 bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-r-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                      />
                    </div>
                  </div>

                  {/* Maksimal Foto */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300">Maksimal Foto Terpilih</label>
                    <input
                      type="number"
                      min="1"
                      value={maxPhotos}
                      onChange={e => setMaxPhotos(Number(e.target.value))}
                      className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>
                </div>

                {/* Main Menu Checkboxes */}
                <div className="space-y-3 border-t border-[#2d3748] pt-5">
                  <h3 className="text-sm font-bold text-white">Menu Utama</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pilihFotoEnabled}
                        onChange={e => setPilihFotoEnabled(e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#0f172a] text-[#A3E635] focus:ring-0"
                      />
                      <span className="text-sm text-slate-300">Pilih Foto</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={downloadFotoEnabled}
                        onChange={e => setDownloadFotoEnabled(e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#0f172a] text-[#A3E635] focus:ring-0"
                      />
                      <span className="text-sm text-slate-300">Download Foto</span>
                    </label>
                  </div>
                </div>

                {/* Durations and Passwords Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#0f172a] p-4 rounded-xl border border-[#2d3748]">
                  {/* Batas Waktu & Password Pilih Foto */}
                  {pilihFotoEnabled && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#A3E635] uppercase tracking-wide">
                        Pengaturan Pilih Foto
                      </h4>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Batas Waktu Pilih</label>
                        <select
                          value={pilihFotoDuration}
                          onChange={e => setPilihFotoDuration(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#2d3748] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                        >
                          <option value="Selamanya">Selamanya</option>
                          <option value="7 Hari">7 Hari</option>
                          <option value="14 Hari">14 Hari</option>
                          <option value="30 Hari">30 Hari</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Password Pilih Foto (Optional)</label>
                        <input
                          type="password"
                          value={pilihFotoPassword}
                          onChange={e => setPilihFotoPassword(e.target.value)}
                          placeholder="Password..."
                          className="w-full bg-[#1e293b] border border-[#2d3748] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Batas Waktu & Password Download Foto */}
                  {downloadFotoEnabled && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#A3E635] uppercase tracking-wide">
                        Pengaturan Download Foto
                      </h4>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Batas Waktu Download</label>
                        <select
                          value={downloadFotoDuration}
                          onChange={e => setDownloadFotoDuration(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#2d3748] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                        >
                          <option value="Selamanya">Selamanya</option>
                          <option value="7 Hari">7 Hari</option>
                          <option value="14 Hari">14 Hari</option>
                          <option value="30 Hari">30 Hari</option>
                        </select>
                      </div>

                      {pilihFotoEnabled && (
                        <label className="flex items-center gap-2 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={samePassword}
                            onChange={e => setSamePassword(e.target.checked)}
                            className="rounded border-[#2d3748] bg-[#1e293b] text-[#A3E635] focus:ring-0"
                          />
                          <span className="text-xs text-slate-400">
                            Password sama dengan Password Pilih
                          </span>
                        </label>
                      )}

                      {!samePassword && (
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400">Password Download (Optional)</label>
                          <input
                            type="password"
                            value={downloadFotoPassword}
                            onChange={e => setDownloadFotoPassword(e.target.value)}
                            placeholder="Password..."
                            className="w-full bg-[#1e293b] border border-[#2d3748] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Toggles */}
                <div className="space-y-3 border-t border-[#2d3748] pt-5">
                  <h3 className="text-sm font-bold text-white">Layanan Tambahan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#2d3748] rounded-lg cursor-pointer">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-white">Foto Tambahan (Berbayar)</div>
                        <div className="text-xs text-slate-400">
                          Aktifkan fitur klien membeli foto tambahan di luar batas maksimal
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={pilihFotoTambahanEnabled}
                        onChange={e => setPilihFotoTambahanEnabled(e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#0f172a] text-[#A3E635] focus:ring-0"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#2d3748] rounded-lg cursor-pointer">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-white">Cetak Foto</div>
                        <div className="text-xs text-slate-400">
                          Tawarkan layanan cetak album fisik, kanvas, dll langsung ke klien
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={pilihFotoCetakEnabled}
                        onChange={e => setPilihFotoCetakEnabled(e.target.checked)}
                        className="rounded border-[#2d3748] bg-[#0f172a] text-[#A3E635] focus:ring-0"
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Messages */}
                {submitError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    {submitError}
                  </p>
                )}
                {submitSuccess && (
                  <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                    {submitSuccess}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end border-t border-[#2d3748] pt-5">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-2.5 border border-[#2d3748] bg-[#1e293b] hover:bg-[#2d3748] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !profile}
                    className="px-6 py-2.5 bg-[#A3E635] hover:bg-[#84cc16] disabled:opacity-50 text-[#0f172a] font-bold text-sm rounded-lg transition-colors"
                  >
                    {submitting ? "Memproses..." : "Buat Project"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === "status-edit" && (
        <div className="space-y-6">
          {/* Status Header & Counter Cards */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Status Klien Memilih Foto (Retouch)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Belum Memilih */}
              <div className="bg-[#1e293b] rounded-xl border border-red-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{editCounters.belum}</div>
                  <div className="text-xs text-slate-400 font-medium">Belum Memilih</div>
                </div>
              </div>

              {/* Sedang Memilih */}
              <div className="bg-[#1e293b] rounded-xl border border-amber-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">{editCounters.sedang}</div>
                  <div className="text-xs text-slate-400 font-medium">Sedang Memilih</div>
                </div>
              </div>

              {/* Sudah Ditinjau */}
              <div className="bg-[#1e293b] rounded-xl border border-green-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-500 border border-green-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{editCounters.ditinjau}</div>
                  <div className="text-xs text-slate-400 font-medium">Sudah Ditinjau</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & List view */}
          <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama klien..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
                />
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin-slow" />
                Realtime + fallback 5 menit
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-3">
              {filteredBookings.map(b => {
                const status = getClientEditStatus(b);
                let badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                let label = "Belum Memilih";
                if (status === "sedang-memilih") {
                  badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  label = "Sedang Memilih";
                } else if (status === "ditinjau") {
                  badgeColor = "bg-green-500/10 text-green-400 border border-green-500/20";
                  label = "Sudah Ditinjau";
                }

                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0f172a] rounded-lg border border-[#2d3748] gap-3"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{b.clientName}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Code: PRJ-{String(b.id).padStart(4, "0")}</span>
                        {b.eventDate && (
                          <span>
                            Event:{" "}
                            {new Date(b.eventDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${badgeColor}`}>
                        {label}
                      </span>
                      {status !== "belum-memilih" && (
                        <button
                          onClick={() => handleViewSelection(b)}
                          className="px-3 py-1.5 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Lihat Pilihan
                        </button>
                      )}
                      <a
                        href={`/client/bookings/${b.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#1e293b] hover:bg-[#2d3748] rounded-md transition-colors text-slate-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {filteredBookings.length === 0 && (
                <div className="flex flex-col items-center py-12 text-slate-500 text-sm">
                  <Folder className="h-8 w-8 mb-2 text-slate-600" />
                  Belum ada aktivitas dari klien
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "status-tambahan" && (
        <div className="space-y-6">
          {/* Status Header & Counter Cards */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Status Tambahan Foto Berbayar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Belum Memilih */}
              <div className="bg-[#1e293b] rounded-xl border border-red-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{tambahanCounters.belum}</div>
                  <div className="text-xs text-slate-400 font-medium">Belum Memilih Tambahan</div>
                </div>
              </div>

              {/* Sedang Memilih */}
              <div className="bg-[#1e293b] rounded-xl border border-amber-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">{tambahanCounters.sedang}</div>
                  <div className="text-xs text-slate-400 font-medium">Sedang Memilih Tambahan</div>
                </div>
              </div>

              {/* Tambahan Ditinjau */}
              <div className="bg-[#1e293b] rounded-xl border border-green-500/30 p-5 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-500 border border-green-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{tambahanCounters.ditinjau}</div>
                  <div className="text-xs text-slate-400 font-medium">Tambahan Ditinjau</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & List view */}
          <div className="bg-[#1e293b] rounded-xl border border-[#2d3748] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama klien..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#2d3748] text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#A3E635]"
                />
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin-slow" />
                Realtime + fallback 5 menit
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-3">
              {filteredBookings
                .filter(b => b.pilihFotoTambahanEnabled)
                .map(b => {
                  const status = getClientTambahanStatus(b);
                  let badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                  let label = "Belum Memilih Tambahan";
                  if (status === "sedang-memilih") {
                    badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                    label = "Sedang Memilih Tambahan";
                  } else if (status === "ditinjau") {
                    badgeColor = "bg-green-500/10 text-green-400 border border-green-500/20";
                    label = "Tambahan Ditinjau";
                  }

                  return (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0f172a] rounded-lg border border-[#2d3748] gap-3"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">{b.clientName}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>Code: PRJ-{String(b.id).padStart(4, "0")}</span>
                          {b.eventDate && (
                            <span>
                              Event:{" "}
                              {new Date(b.eventDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${badgeColor}`}>
                          {label}
                        </span>
                        <a
                          href={`/client/bookings/${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1e293b] hover:bg-[#2d3748] rounded-md transition-colors text-slate-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}

              {filteredBookings.filter(b => b.pilihFotoTambahanEnabled).length === 0 && (
                <div className="flex flex-col items-center py-12 text-slate-500 text-sm">
                  <Folder className="h-8 w-8 mb-2 text-slate-600" />
                  Belum ada aktivitas dari klien
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Client Selection Modal */}
      {viewingBookingSelection && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#2d3748] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2d3748] flex justify-between items-center bg-[#0f172a]/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Foto Pilihan Klien: {viewingBookingSelection.clientName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proyek PRJ-{String(viewingBookingSelection.id).padStart(4, "0")} — Batas Foto: {viewingBookingSelection.maxPhotos ?? 5}
                </p>
              </div>
              <button
                onClick={() => setViewingBookingSelection(null)}
                className="p-1.5 bg-[#2d3748] hover:bg-[#374151] rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {viewingFilesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square bg-[#0f172a] rounded-xl" />
                  ))}
                </div>
              ) : viewingFiles.length === 0 ? (
                <div className="text-center py-12 text-[#64748b] bg-[#0f172a]/30 rounded-xl border border-[#2d3748]/50">
                  <Folder className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Klien belum memilih foto atau tidak ada pilihan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Banner for Copy */}
                  <div className="p-4 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-[#A3E635] uppercase tracking-wide">
                        Salin Nama File untuk Lightroom / Explorer
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Salin semua nama file di bawah ini dalam format daftar dipisahkan koma untuk memudahkan filtering di software editor Anda.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const fileNames = viewingFiles.map(f => f.fileName).join(", ");
                        navigator.clipboard.writeText(fileNames).then(() => {
                          alert("Daftar nama file berhasil disalin ke clipboard!");
                        });
                      }}
                      className="px-4 py-2 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Salin Daftar Nama File ({viewingFiles.length})
                    </button>
                  </div>

                  {/* Textarea displaying filenames */}
                  <textarea
                    readOnly
                    value={viewingFiles.map(f => f.fileName).join(", ")}
                    rows={2}
                    className="w-full bg-[#0f172a] border border-[#2d3748] rounded-xl p-3 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:border-[#A3E635]"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />

                  {/* Grid of Selected Photos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {viewingFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-[#0f172a]/50 border border-[#2d3748] rounded-xl overflow-hidden relative group aspect-square flex flex-col"
                      >
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                          <p className="text-[10px] text-white font-medium truncate">{file.fileName}</p>
                          <a
                            href={file.fileUrl.replace("sz=w800", "sz=w1600")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-[#A3E635] hover:underline mt-0.5 inline-block"
                          >
                            Buka Gambar Penuh
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#2d3748] bg-[#0f172a]/50 flex justify-end gap-3">
              <button
                onClick={() => setViewingBookingSelection(null)}
                className="px-5 py-2 border border-[#2d3748] bg-[#2d3748] hover:bg-[#374151] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
