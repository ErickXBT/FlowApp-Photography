import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Camera, Globe2, MessageCircle, Instagram, Link as LinkIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

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
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  };

  const loadGallery = async () => {
    const res = await fetch("/api/landing/me/catalog", { credentials: "include" });
    if (res.ok) {
      setGallery(await res.json());
    }
    setGalleryLoading(false);
  };

  useEffect(() => {
    if (!loading && user) {
      loadProfile();
      loadGallery();
    }
  }, [loading, user]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/landing/me/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data);
      setMessage("Profil berhasil disimpan.");
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage(data.error ?? "Gagal menyimpan profil.");
    }
    setSaving(false);
  };

  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/landing/me/catalog", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: itemForm.title,
        type: itemForm.type,
        url: itemForm.url,
        thumbnailUrl: itemForm.thumbnailUrl,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setGallery((current) => [item, ...current]);
      setItemForm({ title: "", type: "photo", url: "", thumbnailUrl: "" });
      setMessage("Gallery item ditambahkan.");
      setTimeout(() => setMessage(null), 3000);
    } else {
      const error = await res.json();
      setMessage(error.error ?? "Gagal menambahkan gallery item.");
    }
  };

  const handleDeleteGalleryItem = async (id: number) => {
    await fetch(`/api/landing/me/catalog/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setGallery((current) => current.filter((item) => item.id !== id));
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#111827] p-6"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-72" /></div>;
  }

  const publicUrl = profile ? `${window.location.origin}/p/${profile.slug}` : "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Vendor Settings</h1>
          <p className="mt-2 text-gray-400 max-w-2xl">Atur profil publik tenant, QR code, dan katalog digital untuk landing page Anda.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#374151] bg-[#111827] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">QR Link</div>
            <div className="mt-3 font-semibold text-white">{profile?.slug ? `/${profile.slug}` : "..."}</div>
          </div>
          {profile && (
            <div className="rounded-3xl border border-[#374151] bg-[#111827] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">Live URL</div>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-3 block text-sm font-semibold text-[#A3E635] hover:text-[#d9f99d] break-words">{publicUrl}</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-[#1F2937] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-white">Profile & Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Studio Name</Label>
                <Input value={profile?.studioName ?? ""} onChange={(e) => setProfile(profile ? { ...profile, studioName: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">CTA Text</Label>
                <Input value={profile?.ctaText ?? ""} onChange={(e) => setProfile(profile ? { ...profile, ctaText: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" placeholder="Book now / Chat now / Request a quote" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Bio</Label>
              <Textarea value={profile?.bio ?? ""} onChange={(e) => setProfile(profile ? { ...profile, bio: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" rows={4} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300">Banner URL</Label>
                <Input value={profile?.bannerUrl ?? ""} onChange={(e) => setProfile(profile ? { ...profile, bannerUrl: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Profile Photo URL</Label>
                <Input value={profile?.profilePhotoUrl ?? ""} onChange={(e) => setProfile(profile ? { ...profile, profilePhotoUrl: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp</Label>
                <Input value={profile?.whatsapp ?? ""} onChange={(e) => setProfile(profile ? { ...profile, whatsapp: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" placeholder="0812xxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Instagram</Label>
                <Input value={profile?.instagram ?? ""} onChange={(e) => setProfile(profile ? { ...profile, instagram: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" placeholder="@studio" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Website</Label>
                <Input value={profile?.website ?? ""} onChange={(e) => setProfile(profile ? { ...profile, website: e.target.value } : null)} className="bg-[#111827] border-[#4B5563] text-white" placeholder="https://" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold" disabled={saving || !profile}>
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </Button>
            {message && <div className="text-sm text-[#A3E635]">{message}</div>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#1F2937] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-white">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-[#374151] bg-[#111827]">
                {profile?.bannerUrl ? (
                  <img src={profile.bannerUrl} alt="Banner" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-[#111827] text-gray-500">Banner Preview</div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-[#374151]">
                      {profile?.profilePhotoUrl ? (
                        <img src={profile.profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">{profile?.studioName ?? "Studio Anda"}</div>
                      <div className="text-sm text-gray-400">{profile?.bio ?? "Deskripsi singkat studio Anda akan tampil di sini."}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-gray-300">
                    {profile?.whatsapp ? <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#A3E635]" /> WhatsApp: {profile.whatsapp}</div> : null}
                    {profile?.instagram ? <div className="flex items-center gap-2"><Instagram className="h-4 w-4 text-[#A3E635]" /> Instagram: {profile.instagram}</div> : null}
                    {profile?.website ? <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-[#A3E635]" /> Website: {profile.website}</div> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <QrCode className="h-4 w-4 text-[#A3E635]" />
                Scan di atas untuk akses cepat ke landing page Anda.
              </div>
              {profile && (
                <div className="rounded-3xl border border-[#374151] bg-[#111827] p-4">
                  <QRCodeCanvas value={publicUrl} size={160} bgColor="#0F172A" fgColor="#A3E635" className="mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1F2937] border-[#374151]">
            <CardHeader>
              <CardTitle className="text-white">Landing Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateGalleryItem} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Judul</Label>
                    <Input value={itemForm.title} onChange={(e) => setItemForm((cur) => ({ ...cur, title: e.target.value }))} className="bg-[#111827] border-[#4B5563] text-white" placeholder="Foto Prewedding" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Tipe</Label>
                    <Input value={itemForm.type} onChange={(e) => setItemForm((cur) => ({ ...cur, type: e.target.value }))} className="bg-[#111827] border-[#4B5563] text-white" placeholder="photo / video" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Media URL</Label>
                  <Input value={itemForm.url} onChange={(e) => setItemForm((cur) => ({ ...cur, url: e.target.value }))} className="bg-[#111827] border-[#4B5563] text-white" placeholder="https://..." required />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Thumbnail URL</Label>
                  <Input value={itemForm.thumbnailUrl} onChange={(e) => setItemForm((cur) => ({ ...cur, thumbnailUrl: e.target.value }))} className="bg-[#111827] border-[#4B5563] text-white" placeholder="https://..." />
                </div>
                <Button type="submit" className="bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold">Tambah Gallery Item</Button>
              </form>
              <Separator />
              <div className="space-y-3">
                {galleryLoading ? (
                  <Skeleton className="h-24" />
                ) : gallery.length === 0 ? (
                  <div className="text-gray-500">Belum ada item gallery. Tambahkan di atas.</div>
                ) : (
                  <div className="space-y-3">
                    {gallery.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#374151] bg-[#111827] p-3">
                        <div>
                          <div className="text-sm font-medium text-white">{item.title ?? item.type}</div>
                          <div className="text-xs text-gray-400">{item.type} • {item.url}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGalleryItem(item.id)} className="text-red-400 hover:text-red-300">Hapus</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
