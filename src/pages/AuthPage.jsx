import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton } from "../components/SkeletonLoader";
import { useApp } from "../context/AppContext";
import { LogoIcon } from "../components/LogoIcon";
import { BarChart3, Mic, Scan, BellRing, Trophy, Languages, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Zap, Shield, TrendingUp } from "lucide-react";

// ─── REGISTER ────────────────────────────────────────────────────────────────
export function RegisterPage({ onBack, onSwitchToLogin }) {
  const { register, setShowOnboarding } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const timer = setTimeout(() => setInitLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

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
    } finally { setLoading(false); }
  };

  if (initLoading) return <PageSkeleton />;

  return (
    <AuthLayout title="Create Account" subtitle="Join the smart tracking community" onBack={onBack}
      footer={<>Already have an account? <button style={A.switchBtn} onClick={onSwitchToLogin}>Sign In</button></>}>
      <Field label="Full Name" icon={<User size={16} />}>
        <Input placeholder="Shoaib Ahmed" value={form.name} onChange={v => set("name", v)} />
      </Field>
      <Field label="Email Address" icon={<Mail size={16} />}>
        <Input type="email" placeholder="you@example.com" value={form.email} onChange={v => set("email", v)} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Password" icon={<Lock size={16} />}>
          <Input type={showPass ? "text" : "password"} placeholder="Create password" value={form.password} onChange={v => set("password", v)}
            suffix={<button style={A.eyeBtn} onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
        </Field>
        <Field label="Confirm" icon={<Lock size={16} />}>
          <Input type={showConfirm ? "text" : "password"} placeholder="Confirm password" value={form.confirm} onChange={v => set("confirm", v)} onEnter={submit}
            suffix={<button style={A.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
        </Field>
      </div>
      <PasswordStrength pwd={form.password} />
      {error && <ErrorMsg msg={error} />}
      <motion.button style={{ ...A.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit}
        whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 10px 25px rgba(245,158,11,0.3)" }} whileTap={{ scale: loading ? 1 : 0.98 }}>
        {loading ? "Creating..." : "Create Account"}
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
  const [initLoading, setInitLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const timer = setTimeout(() => setInitLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const submit = async () => {
    if (!form.email) return setError("Please enter your email.");
    if (!form.password) return setError("Please enter your password.");
    setError(""); setLoading(true);
    try { await login(form.email.trim(), form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (initLoading) return <PageSkeleton />;

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your financial dashboard" onBack={onBack}
      footer={<>New here? <button style={A.switchBtn} onClick={onSwitchToRegister}>Create account</button></>}>
      <Field label="Email Address" icon={<Mail size={16} />}>
        <Input type="email" placeholder="you@example.com" value={form.email} onChange={v => set("email", v)} />
      </Field>
      <Field label="Password" icon={<Lock size={16} />}>
        <div style={{ position: "relative" }}>
          <Input type={showPass ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={v => set("password", v)} onEnter={submit}
            suffix={<button style={A.eyeBtn} onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
          <button style={A.forgotLink} onClick={onSwitchToForgot}>Forgot Password?</button>
        </div>
      </Field>
      {error && <ErrorMsg msg={error} />}
      <motion.button style={{ ...A.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 10px 25px rgba(245,158,11,0.3)" }} whileTap={{ scale: loading ? 1 : 0.98 }}>
        {loading ? "Signing in..." : "Sign In"}
      </motion.button>
    </AuthLayout>
  );
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export function ForgotPage({ onBack, onSwitchToLogin }) {
  const { forgotPassword, resetPassword } = useApp();
  const [step, setStep] = useState(1);
  const [identity, setIdentity] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (initLoading) return <PageSkeleton />;

  const requestOtp = async () => {
    if (!identity) return setError("Please enter your email.");
    setError(""); setLoading(true);
    try { await forgotPassword(identity.trim()); setStep(2); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const confirmOtp = () => { if (otp.length < 6) return setError("Enter the 6-digit code."); setError(""); setStep(3); };
  const doReset = async () => {
    if (!newPass || newPass.length < 6) return setError("Password too short.");
    setError(""); setLoading(true);
    try { await resetPassword(identity.trim(), otp, newPass); onSwitchToLogin(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset Password"
      subtitle={step === 1 ? "We'll send you a recovery code" : step === 2 ? "Check your email for the code" : "Choose a strong new password"}
      onBack={step === 1 ? onBack : () => setStep(step - 1)}
      footer={<>Know your password? <button style={A.switchBtn} onClick={onSwitchToLogin}>Sign In</button></>}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Field label="Email Address" icon={<Mail size={16} />}>
              <Input placeholder="you@example.com" value={identity} onChange={setIdentity} onEnter={requestOtp} />
            </Field>
            {error && <ErrorMsg msg={error} />}
            <motion.button style={A.submitBtn} onClick={requestOtp} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {loading ? "Sending..." : "Send Reset Code"}
            </motion.button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Field label="Verification Code" icon={<Scan size={16} />}>
              <Input placeholder="000000" value={otp} onChange={setOtp} onEnter={confirmOtp} />
            </Field>
            {error && <ErrorMsg msg={error} />}
            <motion.button style={A.submitBtn} onClick={confirmOtp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Verify Code</motion.button>
            <button style={{ ...A.switchBtn, marginTop: 12, width: "100%", textAlign: "center" }} onClick={requestOtp}>Resend Code</button>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Field label="New Password" icon={<Lock size={16} />}>
              <Input type={showPass ? "text" : "password"} placeholder="Enter new password" value={newPass} onChange={setNewPass} onEnter={doReset}
                suffix={<button style={A.eyeBtn} onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
            </Field>
            <PasswordStrength pwd={newPass} />
            {error && <ErrorMsg msg={error} />}
            <motion.button style={A.submitBtn} onClick={doReset} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Update Password</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

// ─── BRAND PANEL (Left Side) ─────────────────────────────────────────────────
const BRAND_FEATURES = [
  { icon: <Zap size={18} />, text: "AI-Powered Financial Insights" },
  { icon: <Shield size={18} />, text: "Bank-Grade Data Security" },
  { icon: <TrendingUp size={18} />, text: "Smart Budget Tracking" },
];

function BrandPanel() {
  return (
    <div style={A.brandPanel}>
      <div style={A.brandBg} />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={A.brandOrb1} 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={A.brandOrb2} 
      />
      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div key={i}
          style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: "rgba(245,184,0,0.4)", top: `${15 + i * 18}%`, left: `${10 + i * 15}%`, zIndex: 1 }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
      <div style={A.brandContent}>
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, type: "spring", stiffness: 100 }}>
          <LogoIcon size={90} showName nameSize={24} glow />
        </motion.div>
        <motion.h2 style={A.brandTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          Take Control of<br />Your <span style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Finances</span>
        </motion.h2>
        <motion.p style={A.brandDesc} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          Join 1,200+ students tracking smarter with AI insights, voice input, and bill scanning.
        </motion.p>
        <div style={A.brandFeatures}>
          {BRAND_FEATURES.map((f, i) => (
            <motion.div key={i} style={A.brandFeatureItem} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.45 + i * 0.12, type: "spring", stiffness: 120 }}
              whileHover={{ x: 6, transition: { duration: 0.2 } }}
            >
              <motion.div style={A.brandFeatureIcon} whileHover={{ scale: 1.15, rotate: 5 }}>{f.icon}</motion.div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{f.text}</span>
            </motion.div>
          ))}
        </div>
        <motion.div style={A.brandTrust} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div style={{ display: "flex" }}>
            {["👦", "👧", "🧑‍💻", "👩‍🎓"].map((a, i) => (
              <motion.span key={i} style={{ ...A.brandAvatar, marginLeft: i > 0 ? -8 : 0 }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.08, type: "spring" }}
              >{a}</motion.span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            <strong style={{ color: "#f59e0b" }}>1,200+</strong> students already saving
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── AUTH LAYOUT (Split Panel) ───────────────────────────────────────────────
function AuthLayout({ title, subtitle, onBack, footer, children }) {
  const [isMobile] = useState(window.innerWidth < 900);

  return (
    <div style={A.root}>
      {/* Split layout */}
      <div style={{ ...A.splitWrap, flexDirection: isMobile ? "column" : "row" }}>
        {/* Left brand panel - hidden on mobile */}
        {!isMobile && <BrandPanel />}

        {/* Right form panel */}
        <div style={A.formPanel}>
          <motion.div style={A.formPanelOrb1}
            animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.12, 0.08] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div style={A.formPanelOrb2}
            animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          <div style={A.formInner}>
            <motion.button style={A.backNav} onClick={onBack} 
              whileHover={{ x: -4, borderColor: "var(--accent)" }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ArrowLeft size={16} /> Back to Home
            </motion.button>

            {/* Mobile logo */}
            {isMobile && (
              <motion.div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
                initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring" }}>
                <LogoIcon size={60} showName nameSize={20} glow />
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.97 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
              style={A.card}
            >
              <div style={A.cardHeader}>
                <motion.h1 style={A.title}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >{title}</motion.h1>
                <motion.p style={A.subtitle}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >{subtitle}</motion.p>
                <motion.div style={A.headerDivider}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </div>

              <div style={A.content}>{children}</div>
              {footer && (
                <motion.div style={A.footer}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >{footer}</motion.div>
              )}
            </motion.div>

            <motion.div style={A.badges}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              {[
                { icon: <BarChart3 size={14} />, label: "AI Insights" },
                { icon: <Scan size={14} />, label: "Smart Scan" },
                { icon: <Trophy size={14} />, label: "Rewards" }
              ].map((b, i) => (
                <motion.div key={b.label} style={A.badge}
                  whileHover={{ scale: 1.08, borderColor: "var(--accent-glow)", y: -2 }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                >{b.icon} <span>{b.label}</span></motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field / Input / helpers ───────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={A.label}>
        <span style={{ marginRight: 6, opacity: 0.8 }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ type = "text", placeholder, value, onChange, onEnter, suffix }) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onEnter?.()}
        style={{ ...A.input, paddingRight: suffix ? 44 : 16 }} />
      {suffix && <div style={A.suffixWrap}>{suffix}</div>}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={A.error}>{msg}</motion.div>
  );
}

function PasswordStrength({ pwd }) {
  const score = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
  const labels = ["", "Weak", "Good", "Strong"];
  const colors = ["", "#ff4d4d", "#ffb84d", "#00e676"];
  if (!pwd) return null;
  return (
    <div style={{ marginBottom: 20, marginTop: -10 }}>
      <div style={{ display: "flex", gap: 4, height: 4, borderRadius: 2, overflow: "hidden" }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ flex: 1, background: n <= score ? colors[score] : "rgba(255,255,255,0.1)", transition: "0.3s" }} />
        ))}
      </div>
      <p style={{ fontSize: 10, color: colors[score], fontWeight: 700, marginTop: 6, textTransform: "uppercase" }}>{labels[score]}</p>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const A = {
  root: { minHeight: "100vh", background: "var(--bg-primary)", display: "flex", position: "relative", overflow: "hidden" },
  splitWrap: { display: "flex", width: "100%", minHeight: "100vh" },

  // Brand Panel (left)
  brandPanel: { width: "45%", minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandBg: { position: "absolute", inset: 0, background: "linear-gradient(135deg, #060a14 0%, #0e1830 40%, #0a1020 100%)" },
  brandOrb1: { position: "absolute", top: "10%", left: "20%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,184,0,0.2) 0%, transparent 60%)", filter: "blur(60px)" },
  brandOrb2: { position: "absolute", bottom: "15%", right: "10%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)", filter: "blur(50px)" },
  brandContent: { position: "relative", zIndex: 1, padding: "48px 40px", maxWidth: 420 },
  brandTitle: { fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.2, margin: "28px 0 14px" },
  brandDesc: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 },
  brandFeatures: { display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 },
  brandFeatureItem: { display: "flex", alignItems: "center", gap: 12 },
  brandFeatureIcon: { width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0 },
  brandTrust: { display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)" },
  brandAvatar: { width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 },

  // Form Panel (right)
  formPanel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", position: "relative", overflow: "hidden" },
  formPanelOrb1: { position: "absolute", top: "5%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)", filter: "blur(80px)", opacity: 0.08, pointerEvents: "none" },
  formPanelOrb2: { position: "absolute", bottom: "10%", left: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, var(--blue) 0%, transparent 60%)", filter: "blur(70px)", opacity: 0.06, pointerEvents: "none" },
  formInner: { width: "100%", maxWidth: 440, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 },

  backNav: { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, alignSelf: "flex-start", padding: "8px 16px", borderRadius: 100, backdropFilter: "blur(20px)", fontWeight: 700, transition: "all 0.3s", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  card: { background: "var(--bg-card)", backdropFilter: "blur(40px)", border: "1px solid var(--border)", borderRadius: 28, padding: "36px 36px 28px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" },
  cardHeader: { marginBottom: 28, textAlign: "center" },
  headerDivider: { width: 48, height: 3, background: "linear-gradient(90deg, var(--accent), var(--orange))", borderRadius: 2, margin: "14px auto 0", transformOrigin: "center" },
  title: { margin: 0, fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-1px" },
  subtitle: { margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)", fontWeight: 500 },
  content: { display: "flex", flexDirection: "column" },
  label: { display: "flex", alignItems: "center", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 },
  input: { width: "100%", background: "var(--bg-input)", border: "none", color: "var(--text-primary)", borderRadius: 14, padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", fontFamily: "var(--font)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)" },
  submitBtn: { width: "100%", background: "linear-gradient(135deg, var(--accent), var(--orange))", color: "#111", border: "none", padding: "14px", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "all 0.3s", marginTop: 8, boxShadow: "0 8px 20px rgba(245,158,11,0.3)" },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)", fontWeight: 500 },
  switchBtn: { background: "none", border: "none", color: "var(--accent)", fontWeight: 800, cursor: "pointer", fontSize: 13, textDecoration: "underline", transition: "all 0.2s" },
  forgotLink: { position: "absolute", right: 0, bottom: -20, background: "none", border: "none", color: "var(--accent)", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "0.2s" },
  error: { background: "var(--red-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)", padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  suffixWrap: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center" },
  eyeBtn: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, transition: "color 0.2s" },
  badges: { display: "flex", justifyContent: "center", gap: 10, marginTop: 16, flexWrap: "wrap" },
  badge: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-card)", padding: "6px 14px", borderRadius: 100, border: "1px solid var(--border)", backdropFilter: "blur(12px)" }
};
