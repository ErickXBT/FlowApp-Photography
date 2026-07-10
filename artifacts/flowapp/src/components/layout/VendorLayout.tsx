import { Link, useLocation } from "wouter";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Calendar, Users, FileText,
  RefreshCw, Menu, Settings, LogOut, Shirt, TrendingUp,
  ShoppingBag, ClipboardList, Image, Sparkles, Scissors, FolderOpen,
  Languages, Moon, Megaphone, MessageSquare, Sun, Camera, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  isComingSoon?: boolean;
  isSpecial?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user: authUser } = useAuth();
  const { user, loading } = useRequireAuth("vendor");
  const { toast } = useToast();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = (d: Date) => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${dayName}, ${dateNum} ${monthName} ${hours}.${minutes}.${seconds}`;
  };

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      toast({ title: "Mode Gelap Aktif", description: "Tampilan FlowApp disesuaikan ke mode gelap." });
    } else {
      document.documentElement.classList.remove("dark");
      toast({ title: "Mode Terang Aktif", description: "Tampilan FlowApp disesuaikan ke mode terang." });
    }
  };

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem("user_profile_name") || authUser?.name || "Studio";
  });
  const [profilePhoto, setProfilePhoto] = useState(() => {
    return localStorage.getItem("user_profile_photo") || "/avatar-placeholder.jpg";
  });

  const [editName, setEditName] = useState(profileName);
  const [editPhoto, setEditPhoto] = useState(profilePhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("user_profile_name") && authUser?.name) {
      setProfileName(authUser.name);
      setEditName(authUser.name);
    }
  }, [authUser?.name]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEditPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    setProfileName(editName);
    setProfilePhoto(editPhoto);
    localStorage.setItem("user_profile_name", editName);
    localStorage.setItem("user_profile_photo", editPhoto);
    setProfileModalOpen(false);
    toast({
      title: "Profil Diperbarui!",
      description: "Nama dan foto profil Anda berhasil disimpan."
    });
  };

  const navGroups: NavGroup[] = [
    {
      title: "OPERASIONAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Daftar Booking", href: "/bookings", icon: ClipboardList },
        { name: "Status Booking", href: "/status-booking", icon: RefreshCw },
        { name: "Kalender", href: "/calendar", icon: Calendar },
        { name: "Layanan / Paket", href: "/packages", icon: ShoppingBag },
        { name: "Tim / Freelance", href: "/team", icon: Users },
        { name: "Portal Tim/Freelance", href: "/team-portal", icon: Users },
        { name: "Seleksi Foto Client", href: "/photo-selection", icon: Image },
        { name: "Dress Catalog", href: "/dress-catalog", icon: Shirt },
        { name: "CRM & Client History", href: "/clients", icon: TrendingUp },
        { name: "Reschedule Center", href: "/reschedule-center", icon: RefreshCw },
      ]
    },
    {
      title: "TOOLS & UTILITAS",
      items: [
        { name: "Photo Split Express", href: "/photo-split", icon: Scissors },
        { name: "RAW File Copy Tool", href: "/raw-copy", icon: FolderOpen },
      ]
    },
    {
      title: "FINANSIAL",
      items: [
        { name: "Ringkasan Keuangan", href: "/finance-summary", icon: TrendingUp },
        { name: "Invoice & Pelunasan", href: "/invoices", icon: FileText },
        { name: "Pembayaran Tim", href: "#", icon: FileText, isComingSoon: true },
      ]
    },
    {
      title: "FORM",
      items: [
        { name: "Form Booking", href: "/form-booking", icon: ClipboardList },
        { name: "Form Pelunasan", href: "/form-pelunasan/9", icon: ClipboardList },
        { name: "Form Booking Khusus", href: "#", icon: ClipboardList, isComingSoon: true },
        { name: "Segera Hadir", href: "#", icon: Sparkles, isSpecial: true },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-32 bg-[#1e293b]" />
          <Skeleton className="h-4 w-full bg-[#1e293b]" />
          <Skeleton className="h-4 w-3/4 bg-[#1e293b]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => {
    const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
      if (item.isComingSoon || item.isSpecial) {
        e.preventDefault();
        toast({
          title: `${item.name} - Coming Soon`,
          description: "Fitur premium ini sedang dipersiapkan untuk rilis berikutnya.",
        });
      } else {
        if (onClick) onClick();
      }
    };

    return (
      <div className="space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && item.href !== "/book" && location.startsWith(item.href));
                  
                const linkClass = `flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#A3E635] text-[#0f172a] font-bold shadow-md shadow-[#A3E635]/15"
                    : item.isSpecial
                    ? "border border-amber-500/30 bg-amber-500/5 text-amber-300 font-bold hover:bg-amber-500/10"
                    : "text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white"
                }`;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleItemClick(item, e)}
                    className={linkClass}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.isComingSoon && (
                      <span className="text-[8px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded uppercase">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#111827]">
        <span className="font-bold text-slate-900 dark:text-white text-lg">FlowApp</span>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-700 dark:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 bg-white dark:bg-[#111827] border-slate-200 dark:border-[#1e293b] p-4">
            <div className="mb-6 mt-2">
              <div className="font-bold text-slate-900 dark:text-white text-xl">FlowApp</div>
              <div className="text-sm text-slate-500 dark:text-gray-400 mt-1">{authUser?.name ?? "Studio"}</div>
            </div>
            <nav className="flex flex-col gap-1">
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-[#1e293b] min-h-screen shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-200 dark:border-[#1e293b]">
          <div className="font-bold text-slate-900 dark:text-white text-xl leading-tight">FlowApp</div>
          <div className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">{authUser?.name ?? "Studio"}</div>
          <div className="text-xs text-[#A3E635] mt-0.5 font-medium">Vendor (Pro Plan)</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLinks />
        </nav>

        {/* Bottom Sidebar Menu */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-[#1e293b] space-y-1">
          {/* Feedback */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              toast({
                title: "Feedback",
                description: "Terima kasih! Masukan Anda sangat berharga bagi kami."
              });
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white transition-all w-full"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>Feedback</span>
          </Link>

          {/* Pengaturan */}
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full ${
              location === "/settings"
                ? "bg-[#A3E635] text-[#0f172a] font-bold shadow-md shadow-[#A3E635]/15"
                : "text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Pengaturan</span>
          </Link>
        </div>

        {/* Profile Card Bottom Section */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e293b] flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#0f172a]/20">
          <div
            onClick={() => {
              setEditName(profileName);
              setEditPhoto(profilePhoto);
              setProfileModalOpen(true);
            }}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center group-hover:border-[#A3E635] transition-all">
              <img
                src={profilePhoto}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://github.com/identicons/git.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-[#A3E635] transition-all">
                {profileName}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Profil</div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-55 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#111827] px-6 hidden md:flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Desk</div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            {/* Clock time */}
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatClockTime(time)}</span>

            {/* Language toggle */}
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-300">
              <Languages className="h-4 w-4" />
            </button>

            {/* Dark mode */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-300"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-[#A3E635]" />}
            </button>

            {/* Log Perubahan */}
            <button
              onClick={() => toast({ title: "Log Perubahan", description: "Membuka log perubahan sistem..." })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#2d3748] rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Megaphone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Log Perubahan</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* User Avatar */}
            <div
              onClick={() => {
                setEditName(profileName);
                setEditPhoto(profilePhoto);
                setProfileModalOpen(true);
              }}
              className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:border-[#A3E635] transition-all"
            >
              <img
                src={profilePhoto}
                alt="Avatar"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://github.com/identicons/git.png";
                }}
              />
            </div>
          </div>
        </header>

        {/* Content body container */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* ── PROFILE CUSTOMIZATION MODAL ── */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1e293b] rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-950 dark:text-white">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pengaturan Profil</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Ubah nama dan foto profil operasional Anda di sini.
                </p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar Uploader Selector */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group h-20 w-20 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <img
                  src={editPhoto}
                  alt="Edit Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://github.com/identicons/git.png";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Pilih Foto Galeri
              </button>
            </div>

            {/* Name Input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Nama Profil
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A3E635] font-semibold"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="flex-1 py-2 px-3 border border-slate-200 dark:border-[#1e293b] bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2 px-3 bg-[#A3E635] hover:bg-[#84cc16] text-[#0f172a] rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
