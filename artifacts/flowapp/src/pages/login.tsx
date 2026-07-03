import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Camera } from "lucide-react";
import "./login.css";

export default function Login() {
  const { login, register, user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign-in state
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");
  const [siLoading, setSiLoading] = useState(false);

  // Sign-up state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suError, setSuError] = useState("");
  const [suLoading, setSuLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiError("");
    setSiLoading(true);
    try {
      await login(siEmail, siPassword);
    } catch (err: any) {
      setSiError(err.message ?? "Login gagal. Periksa email dan password.");
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuError("");
    if (suPassword !== suConfirm) {
      setSuError("Password dan konfirmasi tidak cocok.");
      return;
    }
    setSuLoading(true);
    try {
      await register(suName, suEmail, suPassword);
    } catch (err: any) {
      setSuError(err.message ?? "Registrasi gagal.");
    } finally {
      setSuLoading(false);
    }
  };

  const toggle = () => setIsSignUp((v) => !v);

  return (
    <div className="login-page">
      {/* ── Main animated container ── */}
      <div className={`cont${isSignUp ? " s-signup" : ""}`}>

        {/* ── Sign In form (left panel) ── */}
        <div className="form sign-in">
          <h2>Masuk</h2>
          <p className="form-sub">Selamat datang kembali di FlowApp</p>

          <form onSubmit={handleSignIn}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                placeholder="email@studio.id"
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
            {siError && <p className="error-msg">{siError}</p>}
            <button type="submit" className="submit" disabled={siLoading}>
              {siLoading ? "Memproses…" : "Masuk"}
            </button>
          </form>
        </div>

        {/* ── Sub-container: image panel + sign-up form ── */}
        <div className="sub-cont">

          {/* ── Sliding image / branding panel ── */}
          <div className="img">
            {/* Brand mark */}
            <div className="brand-mark">
              <div className="brand-icon">
                <Camera size={26} color="#0f172a" strokeWidth={2.5} />
              </div>
              <span className="brand-name">FlowApp</span>
              <span className="brand-tag">Studio SaaS</span>
            </div>

            {/* Text for sign-in state */}
            <div className="img-text m-up">
              <h2>Belum punya akun?</h2>
              <p>Daftar sekarang dan kelola studio foto & MUA Anda dengan lebih profesional.</p>
            </div>

            {/* Text for sign-up state */}
            <div className="img-text m-in">
              <h2>Sudah bergabung?</h2>
              <p>Masuk dan lanjutkan mengelola booking, klien, dan invoice Anda.</p>
            </div>

            {/* Toggle button */}
            <button className="img-btn" type="button" onClick={toggle}>
              <span className="m-up">Daftar</span>
              <span className="m-in">Masuk</span>
            </button>
          </div>

          {/* ── Sign Up form ── */}
          <div className="form sign-up">
            <h2>Buat Akun</h2>
            <p className="form-sub">Mulai kelola studio Anda bersama FlowApp</p>

            <form onSubmit={handleSignUp}>
              <label>
                <span>Nama Lengkap</span>
                <input
                  type="text"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                  placeholder="Nama studio / Anda"
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  placeholder="email@studio.id"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                  required
                />
              </label>
              <label>
                <span>Konfirmasi Password</span>
                <input
                  type="password"
                  value={suConfirm}
                  onChange={(e) => setSuConfirm(e.target.value)}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  required
                />
              </label>
              {suError && <p className="error-msg">{suError}</p>}
              <button type="submit" className="submit" disabled={suLoading}>
                {suLoading ? "Mendaftar…" : "Daftar Sekarang"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Mobile-only toggle ── */}
      <div className="mobile-toggle">
        <button type="button" onClick={toggle}>
          {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar sekarang"}
        </button>
      </div>

      {/* ── Demo accounts ── */}
      <div className="demo-bar">
        <strong>Demo:</strong>
        <div className="demo-cred">
          <span className="role">Vendor</span>
          <span className="creds">vendor@senja.id / vendor123</span>
        </div>
        <div className="demo-cred">
          <span className="role">Admin</span>
          <span className="creds">admin@flowapp.id / admin123</span>
        </div>
      </div>
    </div>
  );
}
