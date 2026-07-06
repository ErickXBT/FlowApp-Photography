import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Instagram, Globe2, MessageCircle, ArrowRight, Youtube, Music } from "lucide-react";

interface LandingData {
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
  catalog: Array<{ id: number; title?: string; type: string; url: string; thumbnailUrl?: string }>;
}

export default function LandingPage() {
  const [match, params] = useRoute<{ slug: string }>("/p/:slug");
  const [landing, setLanding] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!match || !params?.slug) return;
      setLoading(true);
      const res = await fetch(`/api/landing/${params.slug}`);
      if (!res.ok) {
        setError("Landing page not found.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLanding(data);
      setLoading(false);
    };
    load();
  }, [match, params?.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-white p-6">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-10 w-72 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-4">
          <h1 className="text-3xl font-bold">Halaman tidak ditemukan</h1>
          <p className="text-gray-400">Tenant yang dicari tidak tersedia atau telah dinonaktifkan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="relative overflow-hidden">
        <div className="h-80 bg-[#111827]">
          {landing.bannerUrl ? (
            <img src={landing.bannerUrl} alt="Banner" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="h-full w-full bg-[#111827]" />
          )}
        </div>
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#0F172A]/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-[#374151] bg-[#111827]/90 p-6 shadow-xl shadow-black/10">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-[#A3E635]/40 bg-[#0F172A]">
                  {landing.profilePhotoUrl ? (
                    <img src={landing.profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-[#A3E635]/80">F</div>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-serif font-bold tracking-tight">{landing.studioName}</h1>
                  <p className="mt-2 max-w-xl text-sm text-gray-400 whitespace-pre-wrap">{landing.bio ?? "Studio profesional yang siap membantu kebutuhan foto, MUA, dan event Anda."}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {landing.whatsapp ? (
                  <a href={`https://wa.me/${landing.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#A3E635] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:bg-[#bef264]">
                    <MessageCircle className="h-4 w-4" /> Chat WhatsApp
                  </a>
                ) : null}
                {landing.instagram ? (
                  <a href={`https://instagram.com/${landing.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#374151] bg-[#111827] px-4 py-2 text-sm text-white transition hover:border-[#A3E635] hover:text-[#A3E635]">
                    <Instagram className="h-4 w-4" /> @{landing.instagram.replace(/^@/, "")}
                  </a>
                ) : null}
                {landing.website ? (
                  <a href={landing.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#374151] bg-[#111827] px-4 py-2 text-sm text-white transition hover:border-[#A3E635] hover:text-[#A3E635]">
                    <Globe2 className="h-4 w-4" /> Website
                  </a>
                ) : null}
                {landing.tiktok ? (
                  <a href={landing.tiktok.startsWith("http") ? landing.tiktok : `https://tiktok.com/${landing.tiktok.startsWith("@") ? landing.tiktok : `@${landing.tiktok}`}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#374151] bg-[#111827] px-4 py-2 text-sm text-white transition hover:border-[#A3E635] hover:text-[#A3E635]">
                    <Music className="h-4 w-4" /> TikTok
                  </a>
                ) : null}
                {landing.youtube ? (
                  <a href={landing.youtube.startsWith("http") ? landing.youtube : `https://youtube.com/${landing.youtube}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#374151] bg-[#111827] px-4 py-2 text-sm text-white transition hover:border-[#A3E635] hover:text-[#A3E635]">
                    <Youtube className="h-4 w-4" /> YouTube
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400 uppercase tracking-[0.24em]">Live Menu</div>
                  <div className="text-lg font-semibold text-white">{landing.ctaText ?? "Book Now"}</div>
                  <p className="text-sm text-gray-400">Buka opsi pemesanan langsung dari landing page Anda.</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400 uppercase tracking-[0.24em]">Direct Link</div>
                  <p className="text-sm text-white">{landing.slug}</p>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <Camera className="h-4 w-4 text-[#A3E635]" /> QR ready untuk akses cepat
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#374151] bg-[#111827]/90 p-6 text-center">
              <div className="mb-3 inline-flex rounded-full bg-[#A3E635] p-3 text-[#1F2937]">
                <Camera className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Follow & Book</h2>
              <p className="mt-2 text-sm text-gray-400">Landing page tenant pro dengan galeri foto dan chat langsung.</p>
            </div>
            <div className="grid gap-4">
              <Card className="bg-[#1F2937] border-[#374151]">
                <CardContent>
                  <div className="text-sm uppercase tracking-[0.24em] text-gray-400">Katalog Foto & Video</div>
                  <div className="mt-4 grid gap-3">
                    {landing.catalog.slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-3xl overflow-hidden border border-[#374151] bg-[#0F172A]">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title ?? item.type} className="h-28 w-full object-cover" />
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-[#111827] text-gray-500">No thumbnail</div>
                        )}
                        <div className="p-3">
                          <div className="text-sm font-medium text-white">{item.title ?? item.type}</div>
                          <div className="text-xs text-gray-400">{item.type}</div>
                        </div>
                      </div>
                    ))}
                    {landing.catalog.length === 0 && <div className="text-sm text-gray-500">Belum ada katalog. Hubungi vendor untuk melihat penawaran.</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-3xl border border-[#374151] bg-[#111827]/90 p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#374151]">
            <div>
              <h2 className="text-2xl font-semibold">Portfolio Highlights</h2>
              <p className="text-sm text-gray-400">Telusuri hasil kerja terbaru dan detail produk vendor.</p>
            </div>
            <Button asChild>
              <a href={landing.website ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#A3E635] px-4 py-2 text-sm font-semibold text-[#1F2937] hover:bg-[#bef264]">
                Lihat Detail <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {landing.catalog.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-3xl overflow-hidden border border-[#374151] bg-[#0F172A]">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title ?? item.type} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#111827] text-gray-500">No image</div>
                )}
                <div className="p-4">
                  <div className="text-sm font-semibold text-white">{item.title ?? "Feature"}</div>
                  <div className="text-xs text-gray-400">{item.type}</div>
                </div>
              </div>
            ))}
            {landing.catalog.length === 0 && (
              <div className="col-span-full rounded-3xl border border-[#374151] bg-[#0F172A] p-8 text-center text-gray-500">Katalog kosong.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
