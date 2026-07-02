import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera } from "lucide-react";

export default function Login() {
  const { login, register, user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error("Password dan konfirmasi password harus sama");
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message ?? (isRegister ? "Registrasi gagal." : "Login gagal. Periksa email dan password Anda."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2937] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-[#A3E635] rounded-lg p-2">
              <Camera className="h-6 w-6 text-[#1F2937]" />
            </div>
            <span className="text-3xl font-serif font-bold text-white">FlowApp</span>
            <span className="text-xs text-[#A3E635] font-medium border border-[#A3E635] rounded px-1">SaaS</span>
          </div>
          <p className="text-gray-400 text-sm">Platform manajemen studio foto & MUA profesional</p>
        </div>

        <Card className="bg-[#374151] border-[#4B5563]">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {isRegister ? "Daftar Akun Baru" : "Masuk ke Dashboard"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isRegister
                ? "Buat akun vendor baru untuk mulai menggunakan FlowApp"
                : "Masukkan email dan password akun Anda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Nama Lengkap</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Anda"
                    className="bg-[#1F2937] border-[#4B5563] text-white placeholder:text-gray-500 focus:border-[#A3E635]"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@studio.id"
                  className="bg-[#1F2937] border-[#4B5563] text-white placeholder:text-gray-500 focus:border-[#A3E635]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#1F2937] border-[#4B5563] text-white placeholder:text-gray-500 focus:border-[#A3E635]"
                  required
                />
              </div>
              {isRegister && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Konfirmasi Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#1F2937] border-[#4B5563] text-white placeholder:text-gray-500 focus:border-[#A3E635]"
                    required
                  />
                </div>
              )}
              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-2">{error}</p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#A3E635] hover:bg-[#84cc16] text-[#1F2937] font-semibold"
              >
                {submitting ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-400">
          {isRegister ? (
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="text-[#A3E635] underline"
            >
              Sudah punya akun? Masuk
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className="text-[#A3E635] underline"
            >
              Belum punya akun? Daftar sekarang
            </button>
          )}
        </div>
        <div className="text-center text-gray-400 space-y-1 text-xs">
          <p>Demo accounts:</p>
          <p>Super Admin: <span className="text-[#A3E635]">admin@flowapp.id</span> / admin123</p>
          <p>Vendor: <span className="text-[#A3E635]">vendor@senja.id</span> / vendor123</p>
        </div>
      </div>
    </div>
  );
}
