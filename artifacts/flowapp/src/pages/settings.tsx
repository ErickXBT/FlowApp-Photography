import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Instagram, Link as LinkIcon, Trash2 } from "lucide-react";
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
  ctaText?: string;
}

interface LandingItem {
  id: number;
  title?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

export default function Settings() {
  const { user, loading } = useRequireAuth("vendor");
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [gallery, setGallery] = useState<LandingItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ title: "", type: "photo", url: "", thumbnailUrl: "" });
  const [galleryLoading, setGalleryLoading] = useState(true);

  const loadProfile = async () => {
    const res = await fetch("/api/landing/me/profile", { credentials: "include" });
    if (res.ok) setProfile(await res.json());
  };

  const loadGallery = async () => {
    const res = await fetch("/api/landing/me/catalog", { credentials: "include" });
    if (res.ok) setGallery(await res.json());
    setGalleryLoading(false);
  };

  useEffect(() => {
    if (!loading && user) { loadProfile(); loadGallery(); }
  }, [loading, user]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/landing/me/profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (res.ok) { setProfile(data); setMessage("✓ Profil berhasil disimpan."); }
    else setMessage(data.error ?? "Gagal menyimpan profil.");
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

  if (loading || !user) return <div className="min-h-screen bg-[#0f172a] p-6"><Skeleton className="h-8 w-64 mb-4 bg-[#1e293b]" /><Skeleton className="h-72 bg-[#1e293b]" /></div>;

  const publicUrl = profile ? `${window.location.origin}/p/${profile.slug}` : "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Vendor Settings</h1>
          <p className="mt-1 text-[#64748b] text-sm">Atur profil publik tenant, QR code, dan katalog digital untuk landing page Anda.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#2d3748] bg-[#111827] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">QR Link</div>
            <div className="font-semibold text-white text-sm">{profile?.slug ? `/${profile.slug}` : "..."}</div>
          </div>
          {profile && (
            <div className="rounded-2xl border border-[#2d3748] bg-[#111827] p-4">
              <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">Live URL</div>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#A3E635] hover:text-[#d9f99d] break-all">{publicUrl}</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Profile & Branding */}
        <Card className="bg-[#1e293b] border-[#2d3748]">
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

            {/* Banner Upload */}
            <ImageUpload
              label="Banner"
              value={profile?.bannerUrl ?? ""}
              onChange={url => setProfile(p => p ? { ...p, bannerUrl: url } : null)}
              accept="image/*"
            />

            {/* Profile Photo Upload */}
            <ImageUpload
              label="Profile Photo"
              value={profile?.profilePhotoUrl ?? ""}
              onChange={url => setProfile(p => p ? { ...p, profilePhotoUrl: url } : null)}
              accept="image/*"
            />

            <div className="grid gap-4 lg:grid-cols-3">
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
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} disabled={saving || !profile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] font-bold text-sm">
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </Button>
              {message && <span className={`text-sm ${message.startsWith("✓") ? "text-[#A3E635]" : "text-red-400"}`}>{message}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Live Preview + QR + Gallery */}
        <div className="space-y-5">
          {/* Live Preview */}
          <Card className="bg-[#1e293b] border-[#2d3748]">
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
                      <div className="text-xs text-[#64748b] line-clamp-2">{profile?.bio ?? "Deskripsi singkat studio Anda."}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-[#94a3b8]">
                    {profile?.whatsapp && <div className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-[#A3E635]" /> WhatsApp: {profile.whatsapp}</div>}
                    {profile?.instagram && <div className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-[#A3E635]" /> Instagram: {profile.instagram}</div>}
                    {profile?.website && <div className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5 text-[#A3E635]" /> Website: {profile.website}</div>}
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
          <Card className="bg-[#1e293b] border-[#2d3748]">
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

                {/* Media upload */}
                <ImageUpload
                  label="Media (Foto / Video)"
                  value={itemForm.url}
                  onChange={url => setItemForm(f => ({ ...f, url }))}
                  accept={itemForm.type === "video" ? "video/*,image/*" : "image/*"}
                />

                {/* Thumbnail upload */}
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
    </div>
  );
}
