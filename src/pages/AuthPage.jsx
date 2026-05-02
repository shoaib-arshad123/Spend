import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { BarChart3, Mic, Scan, BellRing, Trophy, Languages } from "lucide-react";

// ─── REGISTER ────────────────────────────────────────────────────────────────
export function RegisterPage({ onBack, onSwitchToLogin }) {
  const { register, setShowOnboarding } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!form.email.includes("@")) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      setShowOnboarding(true);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join 1,200+ students tracking smarter"
      onBack={onBack}
      footer={<>Already have an account? <button style={A.switchBtn} onClick={onSwitchToLogin}>Sign In →</button></>}
    >
      <Field label="Full Name">
        <Input placeholder="e.g. Shoaib Ahmed" value={form.name} onChange={v => set("name", v)} />
      </Field>
      <Field label="Email Address">
        <Input type="email" placeholder="you@example.com" value={form.email} onChange={v => set("email", v)} />
      </Field>
      <Field label="Password">
        <Input type="password" placeholder="Minimum 6 characters" value={form.password} onChange={v => set("password", v)} />
        <PasswordStrength pwd={form.password} />
      </Field>
      <Field label="Confirm Password">
        <Input type="password" placeholder="Re-enter your password" value={form.confirm} onChange={v => set("confirm", v)} onEnter={submit} />
      </Field>
      {error && <ErrorMsg msg={error} />}
      <motion.button style={{ ...A.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}>
        {loading ? "Creating..." : "🚀 Create Account"}
      </motion.button>
    </AuthLayout>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function LoginPage({ onBack, onSwitchToRegister, onSwitchToForgot }) {
  const { login } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.email) return setError("invalid candidate");
    if (!form.password) return setError("password error");
    setError(""); setLoading(true);
    
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Sign in to continue tracking your expenses"
      onBack={onBack}
      footer={<>Don't have an account? <button style={A.switchBtn} onClick={onSwitchToRegister}>Create one free →</button></>}
    >
      <Field label="Email Address">
        <Input type="email" placeholder="you@student.edu.pk" value={form.email} onChange={v => set("email", v)} />
      </Field>
      <Field label="Password">
        <Input type="password" placeholder="Your password" value={form.password} onChange={v => set("password", v)} onEnter={submit} />
      </Field>
      {error && <ErrorMsg msg={error} />}
      <motion.button style={{ ...A.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}>
        {loading ? "Signing in..." : "Sign In →"}
      </motion.button>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button style={A.forgotLink} onClick={onSwitchToForgot}>Forgot password?</button>
      </div>
    </AuthLayout>
  );
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export function ForgotPage({ onBack, onSwitchToLogin }) {
  const { forgotPassword, resetPassword } = useApp();
  const [step, setStep] = useState(1); // 1: identity, 2: otp, 3: new pass
  const [identity, setIdentity] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!identity) return setError("Please enter your email or phone.");
    setError(""); setLoading(true);
    try {
      await forgotPassword(identity.trim());
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const confirmOtp = () => {
    if (otp.length < 6) return setError("Please enter a valid 6-digit code.");
    setError("");
    setStep(3);
  };

  const doReset = async () => {
    if (!newPass || newPass.length < 6) return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      await resetPassword(identity.trim(), otp, newPass);
      onSwitchToLogin();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={
        step === 1 ? "Verify your identity to recover account" : 
        step === 2 ? "Enter the 6-digit OTP sent to your email" : 
        "Create a strong new password for your account"
      }
      onBack={step === 1 ? onBack : () => setStep(step - 1)}
      footer={<>Remember your password? <button style={A.switchBtn} onClick={onSwitchToLogin}>Sign In →</button></>}
    >
      {step === 1 && (
        <>
          <Field label="Email Address or Phone">
            <Input placeholder="you@student.edu.pk or +92..." value={identity} onChange={setIdentity} onEnter={requestOtp} />
          </Field>
          {error && <ErrorMsg msg={error} />}
          <motion.button style={A.submitBtn} onClick={requestOtp} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {loading ? "Checking..." : "Send Verification Code"}
          </motion.button>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Verification Code (OTP)">
            <Input placeholder="6-digit code" value={otp} onChange={setOtp} onEnter={confirmOtp} />
          </Field>
          {error && <ErrorMsg msg={error} />}
          <motion.button style={A.submitBtn} onClick={confirmOtp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            Confirm Code →
          </motion.button>
          <button style={{ ...A.switchBtn, marginTop:10, width:"100%" }} onClick={requestOtp}>Resend Code</button>
        </>
      )}

      {step === 3 && (
        <>
          <Field label="Set New Password">
            <Input type="password" placeholder="Minimum 6 characters" value={newPass} onChange={setNewPass} onEnter={doReset} />
          </Field>
          <PasswordStrength pwd={newPass} />
          {error && <ErrorMsg msg={error} />}
          <motion.button style={A.submitBtn} onClick={doReset} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {loading ? "Updating..." : "Reset Password & Sign In"}
          </motion.button>
        </>
      )}
    </AuthLayout>
  );
}

// ─── Shared layout ─────────────────────────────────────────────────────────
function AuthLayout({ title, subtitle, onBack, footer, children }) {
  return (
    <div style={A.root}>
      <div style={A.orb1} /><div style={A.orb2} />
      <button style={A.backBtn2} onClick={onBack}>← Back to Home</button>
      <div style={A.container}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={A.card}>
          <div style={A.cardTop}>
            <img src="/logo.png" alt="SpendSmart" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            <div>
              <h1 style={A.title}>{title}</h1>
              <p style={A.subtitle}>{subtitle}</p>
            </div>
          </div>
          {children}
          {footer && <p style={A.footerText}>{footer}</p>}
        </motion.div>
        <div style={A.featureHints}>
          {[
            { label: "Smart Charts", icon: <BarChart3 size={14} /> },
            { label: "Voice Input", icon: <Mic size={14} /> },
            { label: "Bill Scanner", icon: <Scan size={14} /> },
            { label: "Smart Alerts", icon: <BellRing size={14} /> },
            { label: "Rewards", icon: <Trophy size={14} /> },
            { label: "Urdu Support", icon: <Languages size={14} /> }
          ].map(f => (
            <span key={f.label} style={A.hint}><span style={{ verticalAlign: "middle", marginRight: 4 }}>{f.icon}</span><span style={{ verticalAlign: "middle" }}>{f.label}</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Field / Input / helpers ───────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={A.label}>{label}</label>
      {children}
    </div>
  );
}
function Input({ type = "text", placeholder, value, onChange, onEnter }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === "Enter" && onEnter?.()}
      style={A.input}
    />
  );
}
function ErrorMsg({ msg }) {
  return <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={A.error}>⚠️ {msg}</motion.div>;
}
function PasswordStrength({ pwd }) {
  const score = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
  const labels = ["", "Weak", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#10b981"];
  if (!pwd) return null;
  return (
    <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
      {[1, 2, 3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= score ? colors[score] : "var(--border)", transition: "all 0.3s" }} />)}
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600, marginLeft: 6 }}>{labels[score]}</span>
    </div>
  );
}

const A = {
  root: { minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", position: "relative" },
  orb1: { position: "fixed", top: "-10%", right: 0, width: 400, height: 400, background: "radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)", pointerEvents: "none" },
  orb2: { position: "fixed", bottom: 0, left: "-5%", width: 300, height: 300, background: "radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)", pointerEvents: "none" },
  backBtn2: { position: "fixed", top: 20, left: 20, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, zIndex: 10 },
  container: { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 28px", boxShadow: "var(--shadow-lg)" },
  cardTop: { display: "flex", alignItems: "center", gap: 14, marginBottom: 26, paddingBottom: 22, borderBottom: "1px solid var(--border-light)" },
  logoIcon: { width: 42, height: 42, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  subtitle: { margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" },
  steps: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  stepDot: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  label: { display: "block", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", fontFamily: "var(--font)" },
  select: { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", cursor: "pointer", fontFamily: "var(--font)" },
  avatarBtn: { width: 38, height: 38, borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  avatarActive: { background: "var(--accent-subtle)", border: "1px solid var(--accent)" },
  error: { background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", padding: "9px 12px", borderRadius: 8, fontSize: 12, margin: "0 0 14px" },
  submitBtn: { width: "100%", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", color: "#111318", padding: "13px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "var(--font)" },
  backBtn: { flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "13px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontFamily: "var(--font)" },
  footerText: { textAlign: "center", fontSize: 13, color: "var(--text-muted)", margin: "18px 0 0" },
  switchBtn: { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font)" },
  forgotLink: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font)", textDecoration: "underline" },
  demoBtn: { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font)", textDecoration: "underline" },
  featureHints: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  hint: { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "5px 12px", borderRadius: 20, fontSize: 12 },
};
