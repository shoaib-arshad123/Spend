import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  BarChart3, BrainCircuit, Scan, Mic, BellRing, TrendingUp, Trophy, Languages, 
  Users, PiggyBank, Star, FileSpreadsheet, CheckCircle2, Wallet, Smartphone, Sun, Moon 
} from "lucide-react";

const FEATURES = [
  { icon: <BarChart3 />, color:"#f59e0b", title:"Smart Dashboard",     desc:"Real-time charts that visualize your spending across all categories. Understand where your money goes at a glance." },
  { icon: <BrainCircuit />, color:"#8b5cf6", title:"AI-Powered Insights", desc:"Behavioral analysis learns your habits and gives personalized financial advice to help you save more every month." },
  { icon: <Scan />, color:"#3b82f6", title:"Bill Scanner",        desc:"Snap a photo of any receipt. Our OCR auto-detects amount, store, and category instantly — no manual typing." },
  { icon: <Mic />, color:"#10b981", title:"Voice Input",         desc:"Say 'spent 200 on food' and the expense is logged hands-free. Perfect for busy students on the go." },
  { icon: <BellRing />, color:"#ec4899", title:"Smart Alerts",        desc:"Get warned before you overspend. Real-time budget alerts keep you informed before it's too late." },
  { icon: <TrendingUp />, color:"#f97316", title:"Deep Analytics",      desc:"Weekly, monthly, and yearly trend charts with predictive forecasting to plan your budget smarter." },
  { icon: <Trophy />, color:"#f59e0b", title:"Reward System",       desc:"Earn badges, maintain streaks, and build healthy financial habits through gamified tracking." },
  { icon: <Languages />, color:"#10b981", title:"Bilingual Support",   desc:"Full Urdu and English support. Switch languages anytime — designed for Pakistani students." },
];

const STATS = [
  { value:1200, suffix:"+", label:"Active Students",   icon: <Users /> },
  { value:4,    suffix:"M+", label:"PKR Saved Monthly", icon: <PiggyBank /> },
  { value:98,   suffix:"%",  label:"Satisfaction Rate", icon: <Star /> },
  { value:120,  suffix:"K+", label:"Expenses Tracked",  icon: <FileSpreadsheet /> },
];

const TESTIMONIALS = [
  { name:"Hira Baig",     uni:"NUST Islamabad",       avatar:"👩‍🎓", text:"SpendSmart changed how I manage my pocket money. I saved PKR 8,000 in my first month!", stars:5 },
  { name:"Ahmed Raza",    uni:"FAST Lahore",           avatar:"👨‍💻", text:"The bill scanner is incredible. I just take photos of receipts and it does everything.", stars:5 },
  { name:"Fatima Malik",  uni:"UET Peshawar",          avatar:"👩‍🔬", text:"Urdu support made it so accessible. My whole family uses it now!", stars:5 },
  { name:"Zain ul Abdin", uni:"COMSATS Islamabad",     avatar:"🧑‍💻", text:"The AI advice feature literally told me I was overspending on chai. Very accurate 😂", stars:4 },
];

const STEPS = [
  { num:"01", icon: <CheckCircle2 size={32} />, title:"Register Free",    desc:"Create your account in under 30 seconds. No credit card, no email verification required." },
  { num:"02", icon: <Wallet size={32} />, title:"Set Your Budget",  desc:"Go to your profile and set your monthly budget. Everything starts tracking from day one." },
  { num:"03", icon: <Smartphone size={32} />, title:"Track & Save",     desc:"Add expenses manually, by voice, or by scanning bills. Watch your savings grow every day." },
];

const FAQ = [
  { q:"Is SpendSmart free to use?",            a:"Yes! SpendSmart is completely free for students. No hidden fees, no subscriptions." },
  { q:"Is my financial data safe?",            a:"All data is stored locally on your device. We don't send your expense data to any server." },
  { q:"Can I use it without internet?",        a:"Yes, the core features work offline. Charts and AI advice work without internet." },
  { q:"Does it support multiple currencies?",  a:"Currently optimized for PKR (Pakistani Rupees) with localized formatting." },
  { q:"Can I export my expense data?",         a:"Yes, you can export your expenses as a report from the Analytics section." },
];

function useCounter(target, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = target / 60;
    const t = setInterval(() => {
      n += step;
      if (n >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.round(n));
    }, 20);
    return () => clearInterval(t);
  }, [inView, target]);
  return count;
}

function StatCard({ icon, value, suffix, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCounter(value, inView);
  return (
    <div ref={ref} style={L.statCard}>
      <span style={{ fontSize:28 }}>{icon}</span>
      <div style={L.statNum}>{count}{suffix}</div>
      <div style={L.statLabel}>{label}</div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...L.faqItem, borderColor: open ? "var(--accent)" : "var(--border)" }}>
      <button style={L.faqQ} onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration:0.2 }} style={{ fontSize:18, color:"var(--accent)", flexShrink:0 }}>+</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:"hidden" }}>
            <p style={L.faqA}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage({ onGetStarted, onLogin, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={L.root}>
      {/* Background mesh */}
      <div style={L.meshBg} />
      <div style={L.orb1} /><div style={L.orb2} /><div style={L.orb3} />

      {/* ── NAVBAR ── */}
      <nav style={{ ...L.nav, ...(scrolled ? L.navScrolled : {}) }}>
        <div style={L.navInner}>
          <a style={L.navLogo} href="#">
            <img src="/logo.png" alt="SpendSmart" style={{ width:34, height:34, borderRadius:8, objectFit:"cover" }} />
            <span style={L.logoText}>SpendSmart</span>
            <span style={L.logoBadge}>BETA</span>
          </a>
          <div style={L.navLinks}>
            {['Features','How It Works','Testimonials','FAQ'].map(l => (
              <motion.a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={L.navLink} whileHover={{ scale:1.04, color:'var(--accent)' }}>
                {l}
              </motion.a>
            ))}
          </div>
          <div style={L.navCTAs}>
            <button style={L.themeToggleBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <motion.button style={L.navLoginBtn} onClick={onLogin} data-no-audio="true" whileHover={{ scale:1.02, backgroundColor:"rgba(255,255,255,0.08)" }} whileTap={{ scale:0.98 }}>
              Sign In
            </motion.button>
            <motion.button style={L.navRegBtn} onClick={onGetStarted} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
              Get Started Free
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={L.hero}>
        <motion.div style={{ ...L.heroContent, y: heroY }}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
            <div style={L.heroBadge}>
              <span style={L.heroBadgeDot} />
              🎓 Built for Pakistani Students · Track in Urdu or English
            </div>

            <h1 style={L.heroH1}>
              Stop Guessing,<br />
              <span className="gradient-text">Start Saving Smart</span>
            </h1>

            <p style={L.heroSub}>
              The intelligent expense tracker that learns your spending habits, warns you before you overspend,
              and builds real financial discipline — for free, in your language.
            </p>

            <div style={L.heroCTAs}>
              <motion.button style={L.ctaPrimary} onClick={onGetStarted} whileHover={{ scale:1.04, boxShadow:"0 0 30px rgba(245,158,11,0.4)" }} whileTap={{ scale:0.97 }}>
                🚀 Create Free Account
              </motion.button>
              <motion.button style={L.ctaOutline} onClick={onLogin} data-no-audio="true" whileHover={{ scale:1.02, backgroundColor:"rgba(255,255,255,0.06)" }} whileTap={{ scale:0.98 }}>
                Sign In →
              </motion.button>
            </div>

            <div style={L.heroTrustRow}>
              <div style={L.trustAvatars}>
                {["👦","👧","🧑‍💻","👩‍🎓","🧑"].map((a,i) => (
                  <span key={i} style={{ ...L.trustAvatar, marginLeft: i>0 ? -8 : 0 }}>{a}</span>
                ))}
              </div>
              <span style={{ fontSize:12, color:"var(--text-secondary)" }}>
                <strong style={{ color:"var(--accent)" }}>1,200+</strong> students already tracking
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity:0, x:50, rotateY:-10 }}
          animate={{ opacity:1, x:0, rotateY:0 }}
          transition={{ duration:0.9, delay:0.2, type:"spring", stiffness:80 }}
          style={L.heroVisual}
        >
          <MockDashboard />
          {/* Floating cards */}
          <FloatCard icon="🍔" label="Food · PKR 350" color="#f59e0b" style={{ top:"-20px", left:"-60px" }} delay={1.0} />
          <FloatCard icon="🎙️" label="Voice added!" color="#10b981" style={{ bottom:"60px", right:"-50px" }} delay={1.4} />
          <FloatCard icon="📸" label="Bill scanned" color="#3b82f6" style={{ bottom:"-20px", left:"-40px" }} delay={1.7} />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={L.statsSection}>
        <div style={L.statsGrid}>
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={L.section}>
        <SectionHeader tag="Everything You Need" title="Powerful Features for Smart Students" sub="From voice input to bill scanning — every tool to make expense tracking effortless and intelligent." />
        <div style={L.featGrid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              style={L.featCard}
              initial={{ opacity:0, y:30 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-40px" }}
              transition={{ duration:0.45, delay: i * 0.06 }}
              whileHover={{ y:-6, boxShadow:"0 12px 40px rgba(0,0,0,0.3)", borderColor:"var(--border-light)" }}
            >
              <div style={{ ...L.featIconBox, background: f.color + "18", border:`1px solid ${f.color}30` }}>
                <span style={{ fontSize:22 }}>{f.icon}</span>
              </div>
              <h3 style={L.featTitle}>{f.title}</h3>
              <p style={L.featDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ ...L.section, ...L.altSection }}>
        <SectionHeader tag="Simple Process" title="Up & Running in 3 Steps" sub="No complicated setup. Start tracking in minutes." />
        <div style={L.stepsRow}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              style={L.stepCard}
              initial={{ opacity:0, y:20 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: i * 0.15 }}
            >
              <div style={L.stepNumBadge}>{step.num}</div>
              <div style={L.stepIconCircle}>{step.icon}</div>
              <h3 style={L.stepTitle}>{step.title}</h3>
              <p style={L.stepDesc}>{step.desc}</p>
              {i < STEPS.length - 1 && <div style={L.stepArrow}>→</div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={L.section}>
        <SectionHeader tag="What Students Say" title="Real Feedback from Real Users" sub="Over 1,200 students across Pakistan trust SpendSmart with their finances." />
        <div style={L.testGrid}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              style={L.testCard}
              initial={{ opacity:0, scale:0.95 }}
              whileInView={{ opacity:1, scale:1 }}
              viewport={{ once:true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y:-4 }}
            >
              <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center" }}>
                <span style={L.testAvatar}>{t.avatar}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{t.uni}</div>
                </div>
                <div style={L.testStars}>{"⭐".repeat(t.stars)}</div>
              </div>
              <p style={L.testText}>"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ ...L.section, ...L.altSection }}>
        <SectionHeader tag="FAQ" title="Common Questions" sub="Everything you need to know before getting started." />
        <div style={L.faqList}>
          {FAQ.map(f => <FAQItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={L.ctaBanner}>
        <motion.div
          style={L.ctaBannerInner}
          initial={{ opacity:0, scale:0.95 }}
          whileInView={{ opacity:1, scale:1 }}
          viewport={{ once:true }}
        >
          <div style={L.ctaBannerGlow} />
          <h2 style={L.ctaBannerTitle}>Ready to Take Control of Your Money?</h2>
          <p style={L.ctaBannerSub}>Join 1,200+ students building better financial habits today. It's completely free.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <motion.button style={L.ctaPrimary} onClick={onGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}>
              🚀 Create Free Account
            </motion.button>
            <motion.button style={L.ctaOutline} onClick={onLogin} data-no-audio="true" whileHover={{ scale:1.02, backgroundColor:"rgba(255,255,255,0.06)" }} whileTap={{ scale:0.98 }}>
              Sign In →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={L.footer}>
        <div style={L.footerTop}>
          <div style={L.footerBrand}>
            <img src="/logo.png" alt="SpendSmart" style={{ width:34, height:34, borderRadius:8, objectFit:"cover" }} />
            <div>
              <div style={L.logoText}>SpendSmart</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>Your intelligent financial companion</div>
            </div>
          </div>
          <div style={L.footerLinks}>
            <div style={L.footerCol}>
              <div style={L.footerColTitle}>Product</div>
              {["Features","Analytics","Rewards","Voice Input","Bill Scanner"].map(l => <div key={l} style={L.footerLink}>{l}</div>)}
            </div>
            <div style={L.footerCol}>
              <div style={L.footerColTitle}>Resources</div>
              {["Documentation","HCI Report","Privacy Policy","Terms of Use","Support"].map(l => <div key={l} style={L.footerLink}>{l}</div>)}
            </div>
            <div style={L.footerCol}>
              <div style={L.footerColTitle}>Languages</div>
              {["English","اردو (Urdu)"].map(l => <div key={l} style={L.footerLink}>{l}</div>)}
              <div style={{ marginTop:16 }}>
                <div style={L.footerColTitle}>Technologies</div>
                {["React.js","Recharts","Framer Motion","Web Speech API"].map(l => <div key={l} style={L.footerLink}>{l}</div>)}
              </div>
            </div>
          </div>
        </div>
        <div style={L.footerBottom}>
          <span>© 2025 SpendSmart · Built for HCI Assignment · Pakistan 🇵🇰</span>
          <div style={L.footerBadges}>
            <span style={L.footerBadge}>🔒 Data stays on device</span>
            <span style={L.footerBadge}>⚡ Offline Ready</span>
            <span style={L.footerBadge}>🆓 Forever Free</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ tag, title, sub }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:"center", marginBottom:52 }}>
      <span style={L.sectionTag}>{tag}</span>
      <h2 style={L.sectionTitle}>{title}</h2>
      {sub && <p style={L.sectionSub}>{sub}</p>}
    </motion.div>
  );
}

function FloatCard({ icon, label, color, style, delay }) {
  return (
    <motion.div
      style={{ ...L.floatCard, ...style, borderColor: color + "40" }}
      initial={{ opacity:0, scale:0.8 }}
      animate={{ opacity:1, scale:1, y:[0,-8,0] }}
      transition={{ opacity:{ duration:0.4, delay }, scale:{ duration:0.4, delay }, y:{ duration:2.5, repeat:Infinity, ease:"easeInOut", delay } }}
    >
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontSize:11, fontWeight:600, color:"var(--text-primary)" }}>{label}</span>
    </motion.div>
  );
}

function MockDashboard() {
  return (
    <div style={L.mockWrap}>
      {/* Window chrome */}
      <div style={L.mockHeader}>
        <div style={{ display:"flex", gap:5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => <span key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
        </div>
        <span style={{ fontSize:10, color:"var(--text-muted)" }}>SpendSmart · Dashboard</span>
        <div />
      </div>
      {/* Budget bar */}
      <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border-light)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:10, color:"var(--text-muted)" }}>Monthly Budget · PKR 15,000</span>
          <span style={{ fontSize:10, color:"#f59e0b", fontWeight:700 }}>67%</span>
        </div>
        <div style={{ height:5, background:"var(--border)", borderRadius:3 }}>
          <motion.div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg,#10b981,#f59e0b)" }} initial={{ width:0 }} animate={{ width:"67%" }} transition={{ duration:1.5, delay:0.8 }} />
        </div>
      </div>
      {/* Mini stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, padding:"10px 14px", borderBottom:"1px solid var(--border-light)" }}>
        {[["💸","10,020","Spent"],["💰","4,980","Left"],["🔥","7","Streak"]].map(([ic,v,l]) => (
          <div key={l} style={{ background:"var(--bg-input)", borderRadius:7, padding:"7px 5px", textAlign:"center" }}>
            <div style={{ fontSize:13 }}>{ic}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--accent)" }}>PKR {v}</div>
            <div style={{ fontSize:9, color:"var(--text-muted)" }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Chart bars */}
      <div style={{ padding:"10px 14px" }}>
        <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:6 }}>Weekly Spending</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:45 }}>
          {[30,55,40,75,25,90,50].map((h,i) => (
            <motion.div key={i} style={{ flex:1, borderRadius:3, background: i===5 ? "#f59e0b" : "var(--border)" }}
              initial={{ height:0 }} animate={{ height:`${h}%` }} transition={{ duration:0.5, delay:1+i*0.07 }} />
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
          {["M","T","W","T","F","S","S"].map((d,i) => <span key={i} style={{ flex:1, textAlign:"center", fontSize:8, color:"var(--text-muted)" }}>{d}</span>)}
        </div>
      </div>
    </div>
  );
}

const L = {
  root:            { minHeight:"100vh", background:"var(--bg-primary)", color:"var(--text-primary)", overflowX:"hidden", position:"relative" },
  meshBg:          { position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 60%)", pointerEvents:"none", zIndex:0 },
  orb1:            { position:"fixed", top:"-10%", left:"-5%", width:500, height:500, background:"radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 },
  orb2:            { position:"fixed", top:"50%", right:"-10%", width:400, height:400, background:"radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 },
  orb3:            { position:"fixed", bottom:"-5%", left:"30%", width:350, height:350, background:"radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)", pointerEvents:"none", zIndex:0 },
  nav:             { position:"fixed", top:0, left:0, right:0, zIndex:200, transition:"all 0.3s", padding:"0" },
  navScrolled:     { background:"rgba(10,11,15,0.92)", backdropFilter:"blur(16px)", borderBottom:"1px solid var(--border-light)" },
  navInner:        { maxWidth:1160, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px" },
  navLogo:         { display:"flex", alignItems:"center", gap:10, textDecoration:"none" },
  logoIcon:        { width:34, height:34, background:"linear-gradient(135deg,#f59e0b,#f97316)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  logoText:        { fontSize:18, fontWeight:800, color:"var(--accent)", letterSpacing:"-0.5px" },
  logoBadge:       { fontSize:9, background:"var(--accent-subtle)", color:"var(--accent)", border:"1px solid var(--accent-glow)", borderRadius:4, padding:"2px 5px", fontWeight:700 },
  navLinks:        { display:"flex", gap:28, alignItems:"center" },
  navLink:         { fontSize:13, color:"var(--text-secondary)", textDecoration:"none", fontWeight:500, transition:"color 0.2s" },
  navCTAs:         { display:"flex", gap:10, alignItems:"center" },
  themeToggleBtn:  { background:"transparent", border:"none", color:"var(--text-secondary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:8, borderRadius:8, transition:"all 0.2s" },
  navLoginBtn:     { background:"transparent", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:500 },
  navRegBtn:       { background:"var(--accent)", border:"none", color:"#111318", padding:"8px 20px", borderRadius:8, fontSize:13, fontWeight:700 },
  hero:            { minHeight:"100vh", display:"grid", gridTemplateColumns:"1fr 1fr", alignItems:"center", maxWidth:1160, margin:"0 auto", padding:"110px 28px 60px", gap:56, position:"relative", zIndex:1 },
  heroContent:     { maxWidth:560 },
  heroBadge:       { display:"inline-flex", alignItems:"center", gap:7, background:"var(--accent-subtle)", border:"1px solid rgba(245,158,11,0.25)", color:"var(--accent)", padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, marginBottom:22 },
  heroBadgeDot:    { width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"block", animation:"pulse-glow 2s infinite" },
  heroH1:          { fontSize:54, fontWeight:800, lineHeight:1.12, margin:"0 0 20px", letterSpacing:"-2px" },
  heroSub:         { fontSize:16, color:"var(--text-secondary)", lineHeight:1.75, margin:"0 0 34px", maxWidth:480 },
  heroCTAs:        { display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" },
  ctaPrimary:      { background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111318", padding:"13px 28px", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer" },
  ctaOutline:      { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"13px 22px", borderRadius:10, fontSize:15, fontWeight:500, cursor:"pointer" },
  heroTrustRow:    { display:"flex", alignItems:"center", gap:12 },
  trustAvatars:    { display:"flex" },
  trustAvatar:     { width:28, height:28, borderRadius:"50%", background:"var(--bg-elevated)", border:"2px solid var(--bg-primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 },
  heroVisual:      { position:"relative", display:"flex", justifyContent:"center" },
  mockWrap:        { width:"100%", maxWidth:360, background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 30px 80px rgba(0,0,0,0.5)" },
  mockHeader:      { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 13px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border-light)" },
  floatCard:       { position:"absolute", background:"var(--bg-card)", border:"1px solid", borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", gap:7, boxShadow:"0 8px 30px rgba(0,0,0,0.3)", zIndex:10 },
  statsSection:    { background:"var(--bg-secondary)", borderTop:"1px solid var(--border-light)", borderBottom:"1px solid var(--border-light)", padding:"50px 28px" },
  statsGrid:       { maxWidth:860, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:28 },
  statCard:        { textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:6 },
  statNum:         { fontSize:42, fontWeight:800, color:"var(--accent)", letterSpacing:"-1.5px", lineHeight:1 },
  statLabel:       { fontSize:13, color:"var(--text-secondary)" },
  section:         { maxWidth:1160, margin:"0 auto", padding:"90px 28px" },
  altSection:      { background:"var(--bg-secondary)" },
  sectionTag:      { display:"inline-block", background:"var(--accent-subtle)", color:"var(--accent)", border:"1px solid rgba(245,158,11,0.2)", padding:"4px 14px", borderRadius:20, fontSize:11, fontWeight:700, marginBottom:14, textTransform:"uppercase", letterSpacing:"0.08em" },
  sectionTitle:    { fontSize:36, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-1px", margin:"0 0 14px" },
  sectionSub:      { fontSize:15, color:"var(--text-secondary)", lineHeight:1.7, maxWidth:560, margin:"0 auto" },
  featGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 },
  featCard:        { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"24px 20px", transition:"all 0.25s", cursor:"default" },
  featIconBox:     { width:46, height:46, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 },
  featTitle:       { fontSize:15, fontWeight:700, color:"var(--text-primary)", margin:"0 0 8px" },
  featDesc:        { fontSize:13, color:"var(--text-secondary)", lineHeight:1.65, margin:0 },
  stepsRow:        { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28, position:"relative", maxWidth:860, margin:"0 auto" },
  stepCard:        { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"28px 24px", position:"relative", textAlign:"center" },
  stepNumBadge:    { fontSize:38, fontWeight:900, color:"var(--accent-subtle)", letterSpacing:"-1px", marginBottom:6, lineHeight:1 },
  stepIconCircle:  { fontSize:28, marginBottom:14 },
  stepTitle:       { fontSize:17, fontWeight:700, color:"var(--text-primary)", margin:"0 0 10px" },
  stepDesc:        { fontSize:13, color:"var(--text-secondary)", lineHeight:1.65, margin:0 },
  stepArrow:       { position:"absolute", right:"-20px", top:"50%", transform:"translateY(-50%)", fontSize:20, color:"var(--accent)", zIndex:1 },
  testGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:16 },
  testCard:        { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"22px 20px", transition:"all 0.25s", cursor:"default" },
  testAvatar:      { width:42, height:42, borderRadius:"50%", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 },
  testStars:       { marginLeft:"auto", fontSize:12 },
  testText:        { fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, fontStyle:"italic", margin:0 },
  faqList:         { maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:8 },
  faqItem:         { background:"var(--bg-card)", border:"1px solid", borderRadius:12, overflow:"hidden", transition:"border-color 0.2s" },
  faqQ:            { width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"transparent", border:"none", color:"var(--text-primary)", fontSize:14, fontWeight:600, cursor:"pointer", gap:12 },
  faqA:            { padding:"0 20px 16px", fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, margin:0 },
  ctaBanner:       { padding:"80px 28px", textAlign:"center" },
  ctaBannerInner:  { maxWidth:680, margin:"0 auto", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:24, padding:"60px 40px", position:"relative", overflow:"hidden" },
  ctaBannerGlow:   { position:"absolute", top:"-50%", left:"50%", transform:"translateX(-50%)", width:400, height:300, background:"radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 70%)", pointerEvents:"none" },
  ctaBannerTitle:  { fontSize:34, fontWeight:800, color:"var(--text-primary)", margin:"0 0 14px", letterSpacing:"-1px", position:"relative" },
  ctaBannerSub:    { fontSize:15, color:"var(--text-secondary)", margin:"0 0 30px", position:"relative" },
  footer:          { background:"var(--bg-secondary)", borderTop:"1px solid var(--border-light)" },
  footerTop:       { maxWidth:1160, margin:"0 auto", padding:"60px 28px 40px", display:"grid", gridTemplateColumns:"280px 1fr", gap:60 },
  footerBrand:     { display:"flex", gap:12, alignItems:"flex-start" },
  footerLinks:     { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 },
  footerCol:       { display:"flex", flexDirection:"column", gap:4 },
  footerColTitle:  { fontSize:12, fontWeight:700, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 },
  footerLink:      { fontSize:13, color:"var(--text-muted)", padding:"3px 0", cursor:"pointer" },
  footerBottom:    { maxWidth:1160, margin:"0 auto", padding:"20px 28px", borderTop:"1px solid var(--border-light)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 },
  footerBadges:    { display:"flex", gap:10, flexWrap:"wrap" },
  footerBadge:     { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-muted)", padding:"4px 10px", borderRadius:20, fontSize:11 },
};
