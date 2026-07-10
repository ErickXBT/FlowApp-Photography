import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Instagram, Link as LinkIcon, Trash2, AlertTriangle, Youtube, Music, ArrowLeft, Check, Lock, Globe } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { ImageUpload } from "@/components/ui/image-upload";

interface TenantProfile {
  id: number;
  slug: string;
  studioName: string;
  bio?: string;
  profilePhotoUrl?: string;
  bannerUrl?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  tiktok?: string;
  youtube?: string;
  ctaText?: string;
  pricelistUrl?: string;


  // Default Project Configurations
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
  customClientWelcomeMsg?: string;
  dashboardDurationDisplay: string;

  // SEO Metadata Default
  seoMetaTitle?: string;
  seoMetaDesc?: string;
  seoKeywords?: string;

  // Deskripsi Menu
  descPilihFoto?: string;
  descDownloadFoto?: string;
  descFotoTambahan?: string;
  descFotoCetak?: string;

  // Template Pesan
  tplLinkClient?: string;
  tplLinkTambahan?: string;
  tplHasilAwal?: string;
  tplHasilTambahan?: string;
  tplRequestRaw?: string;
  tplPengingatOriginal?: string;
  tplPengingatTambahan?: string;

  // Cetak Settings
  defaultPrintSizes?: string;
  defaultPrintPricing?: string;

  // Client Desk
  supportWhatsApp?: string;
  supportEmail?: string;
  clientDeskActive: boolean;
  clientDeskApiKey?: string;

  // Telegram Bot Settings
  telegramBotToken?: string;
  telegramChatId?: string;
}

interface LandingItem {
  id: number;
  title?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

const durationOptions = ["Selamanya", "1 hari", "3 hari", "5 hari", "7 hari", "14 hari", "30 hari", "Custom"];

const ToggleSwitch = ({ checked, onChange, label, subtitle, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; subtitle?: string; disabled?: boolean }) => {
  return (
    <div className={`flex items-center justify-between p-4 bg-[#0f172a] border border-[#374151] rounded-xl ${disabled ? "opacity-50" : ""}`}>
      <div>
        <div className="font-semibold text-white text-xs">{label}</div>
        {subtitle && <div className="text-[10px] text-[#64748b] mt-0.5">{subtitle}</div>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-[#A3E635]" : "bg-[#374151]"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5 bg-[#0f172a]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default function Settings() {
  const { user, loading } = useRequireAuth("vendor");
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [gallery, setGallery] = useState<LandingItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ title: "", type: "photo", url: "", thumbnailUrl: "" });
  const [galleryLoading, setGalleryLoading] = useState(true);

  // New settings tab controllers
  const [mainTab, setMainTab] = useState<"public" | "project">("public");
  const [activeSubTab, setActiveSubTab] = useState<"umum" | "seo" | "deskripsi" | "template" | "cetak" | "desk" | "telegram">("umum");
  const [lastFocusedField, setLastFocusedField] = useState<"title" | "desc" | "keywords" | "tplLinkClient" | "tplLinkTambahan" | "tplHasilAwal" | "tplHasilTambahan" | "tplRequestRaw" | "tplPengingatOriginal" | "tplPengingatTambahan">("title");

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/landing/me/profile", { credentials: "include" });
      if (res.ok) setProfile(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadGallery = async () => {
    const res = await fetch("/api/landing/me/catalog", { credentials: "include" });
    if (res.ok) setGallery(await res.json());
    setGalleryLoading(false);
  };

  useEffect(() => {
    if (!loading && user) { loadProfile(); loadGallery(); }
  }, [loading, user]);

  // Handle password default synchronization
  useEffect(() => {
    if (profile) {
      setProfile(p => {
        if (!p) return null;
        let changed = false;
        
        const newDload = p.defaultSamePasswordDownload ? (p.defaultPilihFotoPassword ?? "") : p.defaultDownloadFotoPassword;
        if (newDload !== p.defaultDownloadFotoPassword) changed = true;

        if (changed) {
          return {
            ...p,
            defaultDownloadFotoPassword: newDload
          };
        }
        return p;
      });
    }
  }, [profile?.defaultPilihFotoPassword, profile?.defaultSamePasswordDownload]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/landing/me/profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (res.ok) { setProfile(data); setMessage("✓ Perubahan berhasil disimpan."); }
    else setMessage(data.error ?? "Gagal menyimpan perubahan.");
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/landing/me/catalog", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemForm),
    });
    if (res.ok) {
      const newItem = await res.json();
      setGallery(cur => [newItem, ...cur]);
      setItemForm({ title: "", type: "photo", url: "", thumbnailUrl: "" });
      setMessage("✓ Gallery item ditambahkan."); setTimeout(() => setMessage(null), 3000);
    } else {
      const err = await res.json();
      setMessage(err.error ?? "Gagal menambahkan gallery item.");
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    await fetch(`/api/landing/me/catalog/${id}`, { method: "DELETE", credentials: "include" });
    setGallery(cur => cur.filter(i => i.id !== id));
  };

  const handleAddToken = (token: string) => {
    setProfile(p => {
      if (!p) return null;
      if (lastFocusedField === "title") {
        return { ...p, seoMetaTitle: (p.seoMetaTitle ?? "") + token };
      } else if (lastFocusedField === "desc") {
        return { ...p, seoMetaDesc: (p.seoMetaDesc ?? "") + token };
      } else if (lastFocusedField === "keywords") {
        return { ...p, seoKeywords: (p.seoKeywords ?? "") + (p.seoKeywords ? ", " : "") + token };
      } else if (lastFocusedField === "tplLinkClient") {
        return { ...p, tplLinkClient: (p.tplLinkClient ?? "") + token };
      } else if (lastFocusedField === "tplLinkTambahan") {
        return { ...p, tplLinkTambahan: (p.tplLinkTambahan ?? "") + token };
      } else if (lastFocusedField === "tplHasilAwal") {
        return { ...p, tplHasilAwal: (p.tplHasilAwal ?? "") + token };
      } else if (lastFocusedField === "tplHasilTambahan") {
        return { ...p, tplHasilTambahan: (p.tplHasilTambahan ?? "") + token };
      } else if (lastFocusedField === "tplRequestRaw") {
        return { ...p, tplRequestRaw: (p.tplRequestRaw ?? "") + token };
      } else if (lastFocusedField === "tplPengingatOriginal") {
        return { ...p, tplPengingatOriginal: (p.tplPengingatOriginal ?? "") + token };
      } else if (lastFocusedField === "tplPengingatTambahan") {
        return { ...p, tplPengingatTambahan: (p.tplPengingatTambahan ?? "") + token };
      }
      return p;
    });
  };

  const renderTemplatePreview = (templateText: string | undefined, defaultText: string) => {
    const text = templateText || defaultText;
    return text
      .replace(/\{\{client_name\}\}/g, "Dian Sastrowardoyo")
      .replace(/\{\{link\}\}/g, `${window.location.origin}/client/bookings/8`)
      .replace(/\{\{count\}\}/g, String(profile?.defaultMaxPhotos || 10))
      .replace(/\{\{password\}\}/g, profile?.defaultPilihFotoPassword || "pilih123")
      .replace(/\{\{duration\}\}/g, profile?.defaultPilihFotoDuration || "30 hari")
      .replace(/\{\{download_duration\}\}/g, profile?.defaultDownloadDuration || "∞ Selamanya")
      .replace(/\{\{print_sizes\}\}/g, profile?.defaultPrintSizes || "4R, 10R")
      .replace(/\{\{print_duration\}\}/g, "7 hari")
      .replace(/\{\{list\}\}/g, "- DSC_1092.JPG\n- DSC_1098.JPG\n- DSC_1105.JPG")
      .replace(/\{\{selected_count\}\}/g, "8")
      .replace(/\{\{selected_list\}\}/g, "- DSC_1092.JPG\n- DSC_1098.JPG")
      .replace(/\{\{project_link\}\}/g, `${window.location.origin}/client/bookings/8`);
  };



  if (loading || !user || profileLoading) return <div className="min-h-screen bg-[#0f172a] p-6"><Skeleton className="h-8 w-64 mb-4 bg-[#1e293b]" /><Skeleton className="h-72 bg-[#1e293b]" /></div>;

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Profil Studio Belum Terhubung</h2>
        <p className="text-slate-400 max-w-sm mb-6 text-sm">
          Sesi Anda saat ini tidak memiliki ID Studio (Tenant). Ini biasanya terjadi jika database baru saja disinkronkan.
          Silakan logout dan login kembali untuk menyegarkan sesi Anda.
        </p>
        <Button onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          window.location.href = "/login";
        }} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold">
          Logout & Login Ulang
        </Button>
      </div>
    );
  }

  const publicUrl = profile ? `${window.location.origin}/p/${profile.slug}` : "";

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-[#0f172a]">
      {/* Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-[#1e293b] pb-4">
        <div>
          <h1 className="text-white font-bold text-2xl">Pengaturan Vendor</h1>
          <p className="mt-1 text-[#64748b] text-sm">Konfigurasi profile, katalog, durasi link, password, dan SEO halaman klien.</p>
        </div>
        
        {/* Main Tab Controller Switcher */}
        <div className="flex gap-2 p-1 bg-[#1e293b] rounded-lg border border-[#2d3748] max-w-md w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setMainTab("public")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              mainTab === "public"
                ? "bg-[#A3E635] text-[#0f172a]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Landing Page & Katalog
          </button>
          <button
            type="button"
            onClick={() => setMainTab("project")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              mainTab === "project"
                ? "bg-[#A3E635] text-[#0f172a]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Konfigurasi Project (Defaults)
          </button>
        </div>
      </div>

      {/* Main Settings Sub-Tab renderers */}
      {mainTab === "public" ? (
        /* ──── MAIN VIEW 1: LANDING PAGE & CATALOG ──── */
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Profile & Branding */}
            <Card className="bg-[#1e293b] border-[#2d3748] text-white">
              <CardHeader><CardTitle className="text-white text-base">Profile & Branding</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Studio Name</Label>
                    <Input value={profile?.studioName ?? ""} onChange={e => setProfile(p => p ? { ...p, studioName: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">CTA Text</Label>
                    <Input value={profile?.ctaText ?? ""} onChange={e => setProfile(p => p ? { ...p, ctaText: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="Booking Sekarang" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Bio</Label>
                  <Textarea value={profile?.bio ?? ""} onChange={e => setProfile(p => p ? { ...p, bio: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" rows={4} />
                </div>

                <ImageUpload
                  label="Banner"
                  value={profile?.bannerUrl ?? ""}
                  onChange={url => setProfile(p => p ? { ...p, bannerUrl: url } : null)}
                  accept="image/*"
                />

                <ImageUpload
                  label="Profile Photo"
                  value={profile?.profilePhotoUrl ?? ""}
                  onChange={url => setProfile(p => p ? { ...p, profilePhotoUrl: url } : null)}
                  accept="image/*"
                />

                <ImageUpload
                  label="Upload Pricelist (Foto / PDF)"
                  value={profile?.pricelistUrl ?? ""}
                  onChange={url => setProfile(p => p ? { ...p, pricelistUrl: url } : null)}
                  accept="image/*,application/pdf"
                />

                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Atau Tautan Pricelist Eksternal</Label>
                  <Input value={profile?.pricelistUrl ?? ""} onChange={e => setProfile(p => p ? { ...p, pricelistUrl: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="https://drive.google.com/..." />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">WhatsApp</Label>
                    <Input value={profile?.whatsapp ?? ""} onChange={e => setProfile(p => p ? { ...p, whatsapp: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="+62812xxxxxxx" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Instagram</Label>
                    <Input value={profile?.instagram ?? ""} onChange={e => setProfile(p => p ? { ...p, instagram: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="@studio" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Website</Label>
                    <Input value={profile?.website ?? ""} onChange={e => setProfile(p => p ? { ...p, website: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="https://" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">TikTok</Label>
                    <Input value={profile?.tiktok ?? ""} onChange={e => setProfile(p => p ? { ...p, tiktok: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="@tiktok" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">YouTube</Label>
                    <Input value={profile?.youtube ?? ""} onChange={e => setProfile(p => p ? { ...p, youtube: e.target.value } : null)} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="https://youtube.com/..." />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                    {saving ? "Menyimpan..." : "Simpan Profil"}
                  </Button>
                  {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview + QR + Gallery */}
          <div className="space-y-5">
            {/* Live Preview */}
            <Card className="bg-[#1e293b] border-[#2d3748] text-white">
              <CardHeader><CardTitle className="text-white text-base">Live Preview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-[#2d3748] bg-[#111827]">
                  {profile?.bannerUrl ? (
                    <img src={profile.bannerUrl} alt="Banner" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="h-36 bg-[#1e293b] flex items-center justify-center text-[#475569] text-sm">Banner Preview</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-[#374151] overflow-hidden shrink-0">
                        {profile?.profilePhotoUrl && <img src={profile.profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{profile?.studioName ?? "Studio Anda"}</div>
                        <div className="text-xs text-[#64748b] whitespace-pre-wrap line-clamp-4">{profile?.bio ?? "Deskripsi singkat studio Anda."}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-[#94a3b8]">
                      {profile?.whatsapp && <div className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-[#A3E635]" /> WhatsApp: {profile.whatsapp}</div>}
                      {profile?.instagram && <div className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-[#A3E635]" /> Instagram: {profile.instagram}</div>}
                      {profile?.website && <div className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5 text-[#A3E635]" /> Website: {profile.website}</div>}
                      {profile?.tiktok && <div className="flex items-center gap-2"><Music className="h-3.5 w-3.5 text-[#A3E635]" /> TikTok: {profile.tiktok}</div>}
                      {profile?.youtube && <div className="flex items-center gap-2"><Youtube className="h-3.5 w-3.5 text-[#A3E635]" /> YouTube: {profile.youtube}</div>}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#64748b]">Scan di atas untuk akses cepat ke landing page Anda.</p>
                {profile && (
                  <div className="rounded-2xl border border-[#2d3748] bg-[#0f172a] p-4 flex justify-center">
                    <QRCodeCanvas value={publicUrl} size={140} bgColor="#0F172A" fgColor="#A3E635" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Landing Gallery */}
            <Card className="bg-[#1e293b] border-[#2d3748] text-white">
              <CardHeader><CardTitle className="text-white text-base">Landing Gallery</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateGalleryItem} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[#94a3b8] text-xs">Judul</Label>
                      <Input value={itemForm.title} onChange={e => setItemForm(f => ({ ...f, title: e.target.value }))} className="bg-[#0f172a] border-[#374151] text-white text-sm" placeholder="Foto Prewedding" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#94a3b8] text-xs">Tipe</Label>
                      <select
                        value={itemForm.type}
                        onChange={e => setItemForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full bg-[#0f172a] border border-[#374151] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3E635]"
                      >
                        <option value="photo">photo</option>
                        <option value="video">video</option>
                      </select>
                    </div>
                  </div>

                  <ImageUpload
                    label="Media (Foto / Video)"
                    value={itemForm.url}
                    onChange={url => setItemForm(f => ({ ...f, url }))}
                    accept={itemForm.type === "video" ? "video/*,image/*" : "image/*"}
                  />

                  <ImageUpload
                    label="Thumbnail"
                    value={itemForm.thumbnailUrl}
                    onChange={url => setItemForm(f => ({ ...f, thumbnailUrl: url }))}
                    accept="image/*"
                  />

                  <Button type="submit" disabled={!itemForm.url} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm w-full">
                    Tambah Gallery Item
                  </Button>
                </form>

                <Separator className="bg-[#2d3748]" />

                <div className="space-y-2">
                  {galleryLoading ? <Skeleton className="h-20 bg-[#0f172a]" /> : gallery.length === 0 ? (
                    <p className="text-xs text-[#475569]">Belum ada item gallery. Tambahkan di atas.</p>
                  ) : (
                    gallery.map(item => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#2d3748] bg-[#0f172a] p-3">
                        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="h-10 w-14 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{item.title ?? item.type}</div>
                          <div className="text-[10px] text-[#64748b]">{item.type} • {item.url.split("/").pop()}</div>
                        </div>
                        <button onClick={() => handleDeleteGalleryItem(item.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ──── MAIN VIEW 2: DEFAULT PROJECT CONFIGURATIONS (COMPETITOR UI) ──── */
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-[#1e293b] rounded-xl border border-[#2d3748] text-slate-300">
            {[
              { id: "umum" as const, label: "Umum" },
              { id: "seo" as const, label: "SEO" },
              { id: "deskripsi" as const, label: "Deskripsi Menu" },
              { id: "template" as const, label: "Template Pesan" },
              { id: "cetak" as const, label: "Cetak" },
              { id: "desk" as const, label: "Client Desk" },
              { id: "telegram" as const, label: "Bot Telegram" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeSubTab === tab.id
                    ? "bg-[#0f172a] text-white border border-[#374151]"
                    : "text-slate-400 hover:text-white hover:bg-[#0f172a]/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Render Tab Contents */}
          {activeSubTab === "umum" && (
            <div className="space-y-6">
              {/* Card 1: Konfigurasi Umum */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardHeader>
                  <CardTitle className="text-white text-base">Konfigurasi Umum</CardTitle>
                  <p className="text-xs text-[#64748b]">Pengaturan dasar untuk akun admin Anda</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* WhatsApp Admin Default */}
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">WhatsApp Admin Default</Label>
                    <div className="flex gap-2 max-w-md">
                      <select className="bg-[#0f172a] border border-[#374151] text-white text-xs rounded-lg px-3 py-2 w-28 focus:outline-none">
                        <option>ID +62</option>
                      </select>
                      <Input
                        value={profile.defaultWhatsappAdmin ? profile.defaultWhatsappAdmin.replace(/^\+62/, "") : ""}
                        onChange={e => setProfile(p => p ? { ...p, defaultWhatsappAdmin: `+62${e.target.value.replace(/\D/g, "")}` } : null)}
                        placeholder="812xxxxxxxx"
                        className="bg-[#0f172a] border-[#374151] text-white text-xs flex-1"
                      />
                    </div>
                    <span className="text-[10px] text-[#64748b] block">Nomor ini akan otomatis terisi saat membuat proyek baru</span>
                  </div>

                  {/* Nama Vendor / Studio */}
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Nama Vendor / Studio</Label>
                    <Input
                      value={profile.studioName}
                      onChange={e => setProfile(p => p ? { ...p, studioName: e.target.value } : null)}
                      placeholder="Contoh: RyanStudio"
                      className="bg-[#0f172a] border-[#374151] text-white text-xs max-w-md"
                    />
                    <span className="text-[10px] text-[#64748b] block">Nama ini akan muncul di URL link client. Contoh: fastpik.id/id/client/nama-vendor/xxxxx</span>
                    <a href="#" className="inline-flex items-center gap-1 text-[10px] text-[#A3E635] hover:underline pt-1">
                      <Globe className="h-3 w-3" /> Mau hubungkan ke domain milikmu sendiri? Cek di sini ya!
                    </a>
                  </div>

                  {/* Custom Kalimat Halaman Awal Klien */}
                  <div className="space-y-2">
                    <Label className="text-[#94a3b8] text-xs">Custom Kalimat Halaman Awal Klien</Label>
                    <div className="text-[10px] text-[#64748b]">Tulis kalimat yang ingin tampil di halaman awal klien. Kosongkan jika ingin memakai kalimat bawaan.</div>
                    
                    {/* Indonesian ID & English US tab headers */}
                    <div className="flex gap-2 border-b border-[#374151] max-w-md">
                      <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                      <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English US</button>
                    </div>

                    <Textarea
                      value={profile.customClientWelcomeMsg ?? ""}
                      onChange={e => setProfile(p => p ? { ...p, customClientWelcomeMsg: e.target.value } : null)}
                      placeholder="Contoh: Silakan pilih yang ingin Anda lakukan"
                      className="bg-[#0f172a] border-[#374151] text-white text-xs max-w-md"
                      rows={3}
                    />
                  </div>

                  {/* Tampilan Durasi di Dashboard */}
                  <div className="space-y-2">
                    <Label className="text-[#94a3b8] text-xs block">Tampilan Durasi di Dashboard</Label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                        <input
                          type="radio"
                          name="dashboardDuration"
                          checked={profile.dashboardDurationDisplay === "pilih_foto"}
                          onChange={() => setProfile(p => p ? { ...p, dashboardDurationDisplay: "pilih_foto" } : null)}
                          className="accent-[#A3E635] h-4 w-4"
                        />
                        Durasi Link Pilih Foto
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                        <input
                          type="radio"
                          name="dashboardDuration"
                          checked={profile.dashboardDurationDisplay === "download"}
                          onChange={() => setProfile(p => p ? { ...p, dashboardDurationDisplay: "download" } : null)}
                          className="accent-[#A3E635] h-4 w-4"
                        />
                        Durasi Link Download
                      </label>
                    </div>
                    <span className="text-[10px] text-[#64748b] block">Pilih durasi mana yang ditampilkan di setiap project card</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Default Project */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardHeader>
                  <CardTitle className="text-white text-base">Default Project</CardTitle>
                  <p className="text-xs text-[#64748b]">Nilai default saat membuat project baru</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sub-section: Umum */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Umum</h4>
                    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                      {/* Maksimal Foto */}
                      <div className="space-y-1.5">
                        <Label className="text-[#94a3b8] text-xs">Maksimal Foto</Label>
                        <Input
                          type="number"
                          value={profile.defaultMaxPhotos}
                          onChange={e => setProfile(p => p ? { ...p, defaultMaxPhotos: Number(e.target.value) } : null)}
                          className="bg-[#0f172a] border-[#374151] text-white text-xs"
                        />
                      </div>
                      
                      {/* Default Password Pilih Foto */}
                      <div className="space-y-1.5">
                        <Label className="text-[#94a3b8] text-xs">Default Password Pilih Foto</Label>
                        <Input
                          value={profile.defaultPilihFotoPassword ?? ""}
                          onChange={e => setProfile(p => p ? { ...p, defaultPilihFotoPassword: e.target.value } : null)}
                          placeholder="Kosongkan jika tidak ingin default password"
                          className="bg-[#0f172a] border-[#374151] text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
                      {/* Default Password Download Foto */}
                      <div className="space-y-2 border border-[#374151] bg-[#0f172a] p-3 rounded-xl">
                        <Label className="text-white text-xs font-semibold">Default Password Download Foto</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={profile.defaultSamePasswordDownload}
                            onChange={e => setProfile(p => p ? { ...p, defaultSamePasswordDownload: e.target.checked } : null)}
                            className="accent-[#A3E635] h-3.5 w-3.5"
                            id="same-pwd-dl"
                          />
                          <label htmlFor="same-pwd-dl" className="text-[9px] text-[#94a3b8] cursor-pointer">Pakai password Pilih Foto</label>
                        </div>
                        <Input
                          value={profile.defaultSamePasswordDownload ? (profile.defaultPilihFotoPassword ?? "") : (profile.defaultDownloadFotoPassword ?? "")}
                          disabled={profile.defaultSamePasswordDownload}
                          onChange={e => setProfile(p => p ? { ...p, defaultDownloadFotoPassword: e.target.value } : null)}
                          placeholder="Password download"
                          className="bg-[#0f172a] border-[#374151] text-white text-xs disabled:opacity-40"
                        />
                      </div>

                      {/* Default Password Pilih Foto Tambahan */}
                      <div className="space-y-2 border border-[#374151] bg-[#0f172a] p-3 rounded-xl">
                        <Label className="text-white text-xs font-semibold">Default Password Foto Tambahan</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={profile.defaultSamePasswordTambahan}
                            onChange={e => setProfile(p => p ? { ...p, defaultSamePasswordTambahan: e.target.checked } : null)}
                            className="accent-[#A3E635] h-3.5 w-3.5"
                            id="same-pwd-add"
                          />
                          <label htmlFor="same-pwd-add" className="text-[9px] text-[#94a3b8] cursor-pointer">Pakai password Pilih Foto</label>
                        </div>
                        <Input
                          value={profile.defaultSamePasswordTambahan ? (profile.defaultPilihFotoPassword ?? "") : ""}
                          disabled
                          placeholder="Password tambahan"
                          className="bg-[#0f172a] border-[#374151] text-white text-xs disabled:opacity-40"
                        />
                      </div>

                      {/* Default Password Foto Cetak */}
                      <div className="space-y-2 border border-[#374151] bg-[#0f172a] p-3 rounded-xl">
                        <Label className="text-white text-xs font-semibold">Default Password Foto Cetak</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={profile.defaultSamePasswordCetak}
                            onChange={e => setProfile(p => p ? { ...p, defaultSamePasswordCetak: e.target.checked } : null)}
                            className="accent-[#A3E635] h-3.5 w-3.5"
                            id="same-pwd-print"
                          />
                          <label htmlFor="same-pwd-print" className="text-[9px] text-[#94a3b8] cursor-pointer">Pakai password Pilih Foto</label>
                        </div>
                        <Input
                          value={profile.defaultSamePasswordCetak ? (profile.defaultPilihFotoPassword ?? "") : ""}
                          disabled
                          placeholder="Password cetak"
                          className="bg-[#0f172a] border-[#374151] text-white text-xs disabled:opacity-40"
                        />
                      </div>
                    </div>

                    <div className="max-w-3xl">
                      <ToggleSwitch
                        checked={profile.defaultDetectSubfolder}
                        onChange={v => setProfile(p => p ? { ...p, defaultDetectSubfolder: v } : null)}
                        label="Deteksi Subfolder"
                        subtitle="Membaca subfolder Google Drive secara otomatis saat ditarik ke RAW PHOTOS."
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#2d3748]" />

                  {/* Sub-section: Fitur Link Client */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fitur Link Client</h4>
                      <p className="text-[10px] text-[#64748b]">Yang aktif akan otomatis menyala saat membuat project baru.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                      <ToggleSwitch
                        checked={profile.defaultPilihFotoEnabled}
                        onChange={v => setProfile(p => p ? { ...p, defaultPilihFotoEnabled: v } : null)}
                        label="Pilih Foto"
                        subtitle="Client bisa memilih foto untuk diedit."
                      />
                      <ToggleSwitch
                        checked={profile.defaultDownloadFotoEnabled}
                        onChange={v => setProfile(p => p ? { ...p, defaultDownloadFotoEnabled: v } : null)}
                        label="Download Foto"
                        subtitle="Client bisa mengunduh foto dari link ini."
                      />
                      <ToggleSwitch
                        checked={profile.defaultTambahanFotoEnabled}
                        onChange={v => setProfile(p => p ? { ...p, defaultTambahanFotoEnabled: v } : null)}
                        label="Tambahan Foto"
                        subtitle="Client boleh menambah foto dari link yang sama."
                      />
                      <ToggleSwitch
                        checked={profile.defaultCetakFotoEnabled}
                        onChange={v => setProfile(p => p ? { ...p, defaultCetakFotoEnabled: v } : null)}
                        label="Cetak Foto"
                        subtitle="Aktifkan fitur cetak di Pengaturan Cetak terlebih dahulu."
                        disabled={!profile.defaultPrintSizes}
                      />
                    </div>
                  </div>

                  <Separator className="bg-[#2d3748]" />

                  {/* Sub-section: Atur Durasi & Detail */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Atur Durasi & Detail</h4>
                      <p className="text-[10px] text-[#64748b]">Detail hanya muncul untuk fitur yang aktif.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                      <div className="space-y-1.5 p-4 border border-[#A3E635] rounded-xl bg-[#0f172a]">
                        <Label className="text-white text-xs font-semibold flex items-center gap-1">⏰ Durasi Pilih Foto</Label>
                        <select
                          value={profile.defaultPilihFotoDuration}
                          onChange={e => setProfile(p => p ? { ...p, defaultPilihFotoDuration: e.target.value } : null)}
                          className="w-full bg-[#0f172a] border border-[#374151] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                        >
                          {durationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt === "Selamanya" ? "∞ Selamanya" : opt === "Custom" ? "✏ Custom" : opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 p-4 border border-[#3b82f6] rounded-xl bg-[#0f172a]">
                        <Label className="text-white text-xs font-semibold flex items-center gap-1">⏰ Durasi Download</Label>
                        <select
                          value={profile.defaultDownloadDuration}
                          onChange={e => setProfile(p => p ? { ...p, defaultDownloadDuration: e.target.value } : null)}
                          className="w-full bg-[#0f172a] border border-[#374151] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635]"
                        >
                          {durationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt === "Selamanya" ? "∞ Selamanya" : opt === "Custom" ? "✏ Custom" : opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#64748b] block">Nilai ini akan otomatis terisi saat membuat project baru, bisa diubah per project.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}

          {activeSubTab === "seo" && (
            <Card className="bg-[#1e293b] border-[#2d3748] text-white max-w-4xl">
              <CardHeader>
                <CardTitle className="text-white text-base">🔎 SEO Halaman Klien Publik</CardTitle>
                <p className="text-xs text-[#64748b]">Atur metadata default untuk halaman link klien agar lebih rapi saat muncul di pencarian dan saat dibagikan.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Meta Title */}
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Meta Title</Label>
                  <Input
                    value={profile.seoMetaTitle ?? ""}
                    onFocus={() => setLastFocusedField("title")}
                    onChange={e => setProfile(p => p ? { ...p, seoMetaTitle: e.target.value } : null)}
                    placeholder="Contoh: Galeri Foto {{client_name}} | {{vendor_name}}"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                  />
                  <span className="text-[10px] text-[#64748b] block">Tampil di tab browser dan hasil pencarian.</span>
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Meta Description</Label>
                  <Textarea
                    value={profile.seoMetaDesc ?? ""}
                    onFocus={() => setLastFocusedField("desc")}
                    onChange={e => setProfile(p => p ? { ...p, seoMetaDesc: e.target.value } : null)}
                    placeholder="Contoh: Lihat dan pilih foto Anda dengan mudah di {{vendor_name}}."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <span className="text-[10px] text-[#64748b] block">Ringkasan pendek yang tampil di hasil pencarian dan preview link.</span>
                </div>

                {/* Keywords */}
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs">Keywords</Label>
                  <Input
                    value={profile.seoKeywords ?? ""}
                    onFocus={() => setLastFocusedField("keywords")}
                    onChange={e => setProfile(p => p ? { ...p, seoKeywords: e.target.value } : null)}
                    placeholder="contoh: galeri foto, foto klien, studio foto"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                  />
                  <span className="text-[10px] text-[#64748b] block">Pisahkan dengan koma.</span>
                </div>

                {/* Variabel SEO Card */}
                <div className="p-4 bg-[#0f172a] border border-[#374151] rounded-xl space-y-3">
                  <div>
                    <h4 className="text-white text-xs font-semibold">Variabel SEO</h4>
                    <p className="text-[10px] text-[#64748b]">Klik token untuk menambahkan ke posisi kursor.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "{{vendor_name}}",
                      "{{tenant_name}}",
                      "{{client_name}}",
                      "{{project_id}}",
                      "{{locale}}"
                    ].map(tok => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => handleAddToken(tok)}
                        className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#2d3748] border border-[#2d3748] hover:border-[#A3E635] text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                      >
                        {tok}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orange alert notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] font-semibold">
                  Jika kolom SEO dikosongkan, Fastpik otomatis memakai judul dan deskripsi default berdasarkan nama tenant/vendor.
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                    {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                  </Button>
                  {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSubTab === "deskripsi" && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base">Deskripsi Menu</h3>
                <p className="text-xs text-[#64748b]">Ubah teks deskripsi di bawah tiap menu pada link klien. Kosongkan untuk memakai teks bawaan.</p>
              </div>

              {/* Pilih Foto Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>📷</span>
                    <span>Pilih Foto</span>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.descPilihFoto ?? ""}
                    onChange={e => setProfile(p => p ? { ...p, descPilihFoto: e.target.value } : null)}
                    placeholder="Kosongkan untuk teks bawaan"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Download Foto Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>📥</span>
                    <span>Download Foto</span>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.descDownloadFoto ?? ""}
                    onChange={e => setProfile(p => p ? { ...p, descDownloadFoto: e.target.value } : null)}
                    placeholder="Kosongkan untuk teks bawaan"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Pilih Foto Tambahan Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>💵</span>
                    <span>Pilih Foto Tambahan</span>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.descFotoTambahan ?? ""}
                    onChange={e => setProfile(p => p ? { ...p, descFotoTambahan: e.target.value } : null)}
                    placeholder="Kosongkan untuk teks bawaan"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Pilih Foto Cetak Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span>🖨</span>
                    <span>Pilih Foto Cetak</span>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.descFotoCetak ?? ""}
                    onChange={e => setProfile(p => p ? { ...p, descFotoCetak: e.target.value } : null)}
                    placeholder="Kosongkan untuk teks bawaan"
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}

          {activeSubTab === "template" && (
            <div className="space-y-6 max-w-4xl">
              {/* Alert Header Bar */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-[#A3E635]" />
                <span>Template pesanmu sekarang mendukung emoji di semua platform, termasuk WhatsApp Desktop, iOS, dan Android. Silakan gunakan emoji sesuka hati! 🚀</span>
              </div>

              {/* Link Client Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>📖</span> Link Client (Admin → Klien)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Template umum untuk mengirim link utama ke klien.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{link}}", "{{count}}", "{{password}}", "{{duration}}", "{{download_duration}}", "{{print_sizes}}", "{{print_duration}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplLinkClient ?? ""}
                    onFocus={() => setLastFocusedField("tplLinkClient")}
                    onChange={e => setProfile(p => p ? { ...p, tplLinkClient: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplLinkClient, "Halo {{client_name}},\n\nBerikut adalah link galeri foto proyek Anda:\n{{link}}\n\nJumlah foto maksimal yang dipilih: {{count}} foto.\nPassword Pilih Foto: {{password}}\nDurasi: {{duration}}\n\nSilakan pilih foto pilihan Anda. Terima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Link Tambahan Foto Card */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>📖</span> Link Tambahan Foto (Admin → Klien)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Template untuk mengarahkan klien membuka link utama lalu memilih menu Tambahan Foto.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{link}}", "{{count}}", "{{password}}", "{{duration}}", "{{download_duration}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplLinkTambahan ?? ""}
                    onFocus={() => setLastFocusedField("tplLinkTambahan")}
                    onChange={e => setProfile(p => p ? { ...p, tplLinkTambahan: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplLinkTambahan, "Halo {{client_name}},\n\nJika ingin menambah atau membeli foto tambahan, silakan buka link galeri Anda:\n{{link}}\n\nLalu pilih menu Tambahan Foto.\nPassword: {{password}}\nDurasi Download: {{download_duration}}\n\nTerima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Hasil Awal (Klien → Admin) */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>📥</span> Hasil Awal (Klien → Admin)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Pesan saat klien mengirimkan foto yang dipilih.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{count}}", "{{list}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplHasilAwal ?? ""}
                    onFocus={() => setLastFocusedField("tplHasilAwal")}
                    onChange={e => setProfile(p => p ? { ...p, tplHasilAwal: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplHasilAwal, "Halo Admin,\n\nSaya {{client_name}} telah selesai memilih {{count}} foto pilihan saya.\n\nBerikut adalah daftar fotonya:\n{{list}}\n\nMohon segera diproses. Terima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Hasil Tambahan (Klien → Admin) */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>📥</span> Hasil Tambahan (Klien → Admin)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Pesan saat klien mengirimkan pilihan foto tambahan.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{count}}", "{{list}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplHasilTambahan ?? ""}
                    onFocus={() => setLastFocusedField("tplHasilTambahan")}
                    onChange={e => setProfile(p => p ? { ...p, tplHasilTambahan: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplHasilTambahan, "Halo Admin,\n\nSaya {{client_name}} telah memilih {{count}} foto tambahan baru.\n\nBerikut adalah daftar fotonya:\n{{list}}\n\nTerima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Request RAW (Admin → Freelance) */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>📩</span> Request RAW (Admin → Freelance)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Pesan WhatsApp untuk meminta file RAW ke freelancer yang dipilih.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{selected_count}}", "{{selected_list}}", "{{project_link}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplRequestRaw ?? ""}
                    onFocus={() => setLastFocusedField("tplRequestRaw")}
                    onChange={e => setProfile(p => p ? { ...p, tplRequestRaw: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplRequestRaw, "Halo Freelance,\n\nMohon siapkan file RAW untuk client {{client_name}}.\n\nJumlah foto dipilih: {{selected_count}} foto.\nDaftar foto:\n{{selected_list}}\n\nLink proyek: {{project_link}}\n\nTerima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Pengingat (Original) */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>🔔</span> Pengingat (Original)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Pesan WhatsApp yang dikirim sebagai pengingat klien untuk memilih foto.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{link}}", "{{count}}", "{{password}}", "{{duration}}", "{{download_duration}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplPengingatOriginal ?? ""}
                    onFocus={() => setLastFocusedField("tplPengingatOriginal")}
                    onChange={e => setProfile(p => p ? { ...p, tplPengingatOriginal: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplPengingatOriginal, "Halo {{client_name}},\n\nIni pengingat untuk memilih foto Anda di link berikut:\n{{link}}\n\nJumlah foto pilihan: {{count}} foto.\nPassword: {{password}}\nSisa durasi: {{duration}}.\n\nTerima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Pengingat (Foto Tambahan) */}
              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>🔔</span> Pengingat (Foto Tambahan)
                    </h4>
                    <p className="text-[10px] text-[#64748b]">Pesan WhatsApp pengingat khusus untuk klien dengan foto tambahan.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-bold">Variables</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{client_name}}", "{{link}}", "{{count}}", "{{password}}", "{{duration}}", "{{download_duration}}"
                      ].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleAddToken(v)}
                          className="px-2 py-1 bg-[#0f172a] border border-[#374151] hover:border-[#A3E635] text-slate-300 rounded text-[10px] font-mono"
                        >
                          {v.replace(/[{}]/g, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 border-b border-[#374151] max-w-md">
                    <button type="button" className="px-3 py-1 text-xs border-b-2 border-[#A3E635] font-semibold text-white">Indonesian ID</button>
                    <button type="button" className="px-3 py-1 text-xs text-slate-400 cursor-not-allowed">English us</button>
                  </div>
                  <Textarea
                    value={profile.tplPengingatTambahan ?? ""}
                    onFocus={() => setLastFocusedField("tplPengingatTambahan")}
                    onChange={e => setProfile(p => p ? { ...p, tplPengingatTambahan: e.target.value } : null)}
                    placeholder="Tulis template pesan dalam Bahasa Indonesia..."
                    className="bg-[#0f172a] border-[#374151] text-white text-xs"
                    rows={4}
                  />
                  <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-slate-300">
                    <div className="text-[10px] text-[#64748b] font-semibold">Preview:</div>
                    <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-[#94a3b8]">
                      {renderTemplatePreview(profile.tplPengingatTambahan, "Halo {{client_name}},\n\nIni pengingat untuk menyelesaikan pembayaran foto tambahan Anda di link berikut:\n{{link}}\n\nSisa durasi download: {{download_duration}}.\n\nTerima kasih!")}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}

          {activeSubTab === "cetak" && (
            <div className="space-y-6 max-w-4xl">
              <Card className="bg-[#121926] border-[#20293a] text-white">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>🖨</span> Fitur Pilih Cetak
                    </h4>
                    <p className="text-[10px] text-[#64748b] mt-0.5">Aktifkan fitur pilih foto untuk cetak oleh klien</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#374151] rounded-xl">
                    <span className="font-semibold text-white text-xs">Fitur Pilih Cetak</span>
                    <button
                      type="button"
                      onClick={() => setProfile(p => p ? { ...p, defaultCetakFotoEnabled: !p.defaultCetakFotoEnabled } : null)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profile.defaultCetakFotoEnabled ? "bg-[#A3E635]" : "bg-[#374151]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile.defaultCetakFotoEnabled ? "translate-x-5 bg-[#0f172a]" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}

          {activeSubTab === "desk" && (
            <div className="space-y-6 max-w-4xl">
              <Card className="bg-[#121926] border-[#20293a] text-white">
                <CardContent className="pt-6 space-y-5">
                  <div>
                    <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span>🔗</span> Client Desk
                    </h4>
                    <p className="text-[10px] text-[#64748b] mt-0.5">Hubungkan Fastpik sebagai tujuan sinkronisasi project dari Client Desk.</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#374151] rounded-xl">
                    <div>
                      <span className="font-semibold text-white text-xs block">Aktifkan Integrasi Client Desk</span>
                      <span className="text-[10px] text-[#64748b]">Jika Aktif, Fastpik bisa menerima sinkronisasi dari Client Desk</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(p => p ? { ...p, clientDeskActive: !p.clientDeskActive } : null)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profile.clientDeskActive ? "bg-[#A3E635]" : "bg-[#374151]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile.clientDeskActive ? "translate-x-5 bg-[#0f172a]" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Status Integrasi</Label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold ${
                        profile.clientDeskActive && profile.clientDeskApiKey
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          profile.clientDeskActive && profile.clientDeskApiKey ? "bg-emerald-400" : "bg-slate-400"
                        }`} />
                        {profile.clientDeskActive && profile.clientDeskApiKey ? "Aktif" : "Belum aktif atau API key belum dibuat"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#94a3b8] text-xs">API Key Client Desk</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => {
                          const randKey = "fastpik_sk_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                          setProfile(p => p ? { ...p, clientDeskApiKey: randKey } : null);
                        }}
                        className="bg-[#1e293b] hover:bg-[#2d3748] border border-[#374151] text-xs text-white"
                      >
                        Generate API Key
                      </Button>
                      {profile.clientDeskApiKey && (
                        <Input
                          readOnly
                          value={profile.clientDeskApiKey}
                          className="bg-[#0f172a] border-[#374151] text-white text-xs font-mono max-w-md flex-1"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs">Log Sync Terakhir</Label>
                    <div className="p-3 bg-[#0f172a] border border-[#374151] rounded-xl text-xs space-y-1 text-[#64748b]">
                      <div>Belum ada sinkronisasi</div>
                      <div>Status: <span className="font-semibold">idle</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}

          {activeSubTab === "telegram" && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-base">🤖 Telegram Bot Notifications</h3>
                <p className="text-xs text-[#64748b]">Dapatkan notifikasi instan langsung di aplikasi Telegram saat klien menyelesaikan pemilihan foto mereka.</p>
              </div>

              <Card className="bg-[#1e293b] border-[#2d3748] text-white">
                <CardContent className="pt-6 space-y-4">
                  {/* Bot Token */}
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs font-semibold">Token Bot Telegram</Label>
                    <Input
                      value={profile.telegramBotToken ?? ""}
                      onChange={e => setProfile(p => p ? { ...p, telegramBotToken: e.target.value } : null)}
                      placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="bg-[#0f172a] border-[#374151] text-white text-xs font-mono"
                    />
                    <span className="text-[10px] text-[#64748b] block">Buat bot baru melalui chat dengan @BotFather di Telegram untuk mendapatkan token ini.</span>
                  </div>

                  {/* Chat ID */}
                  <div className="space-y-1.5">
                    <Label className="text-[#94a3b8] text-xs font-semibold">ID Chat Penerima (Telegram Chat ID)</Label>
                    <Input
                      value={profile.telegramChatId ?? ""}
                      onChange={e => setProfile(p => p ? { ...p, telegramChatId: e.target.value } : null)}
                      placeholder="Contoh: 987654321 atau ID Grup (dimulai tanda minus)"
                      className="bg-[#0f172a] border-[#374151] text-white text-xs font-mono"
                    />
                    <span className="text-[10px] text-[#64748b] block">Kirim pesan '/start' ke bot Anda, lalu gunakan bot seperti @userinfobot untuk mengetahui ID Chat Anda.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </Button>
                {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
