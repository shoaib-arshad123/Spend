import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PageSkeleton } from "../components/SkeletonLoader";
import { LogoIcon } from "../components/LogoIcon";
import { 
  BarChart3, BrainCircuit, Scan, Mic, BellRing, TrendingUp, Trophy, 
  Users, PiggyBank, Star, FileSpreadsheet, CheckCircle2, Wallet, Smartphone, Sun, Moon, X,
  ChevronRight, Code2, GraduationCap, Sparkles
} from "lucide-react";
import shoaibPhoto from "../assets/Shoaib.jpeg";

const NAV_LINKS = ['Features', 'How It Works', 'About', 'Testimonials', 'FAQ'];

const FEATURES = [
  { icon: <BarChart3 />, color:"#f59e0b", title:"Smart Dashboard",     desc:"Real-time charts that visualize your spending across all categories. Understand where your money goes at a glance." },
  { icon: <BrainCircuit />, color:"#8b5cf6", title:"AI-Powered Insights", desc:"Behavioral analysis learns your habits and gives personalized financial advice to help you save more every month." },
  { icon: <Scan />, color:"#3b82f6", title:"Bill Scanner",        desc:"Snap a photo of any receipt. Our OCR auto-detects amount, store, and category instantly — no manual typing." },
  { icon: <Mic />, color:"#10b981", title:"Voice Input",         desc:"Say 'spent 200 on food' and the expense is logged hands-free. Perfect for busy students on the go." },
  { icon: <BellRing />, color:"#ec4899", title:"Smart Alerts",        desc:"Get warned before you overspend. Real-time budget alerts keep you informed before it's too late." },
  { icon: <TrendingUp />, color:"#f97316", title:"Deep Analytics",      desc:"Weekly, monthly, and yearly trend charts with predictive forecasting to plan your budget smarter." },
  { icon: <Trophy />, color:"#f59e0b", title:"Reward System",       desc:"Earn badges, maintain streaks, and build healthy financial habits through gamified tracking." },

  { icon: <Trophy />, color:"#f43f5e", title:"Financial Goals",    desc:"Set saving goals for new gadgets or travel. Track progress automatically as you save." },
  { icon: <TrendingUp />, color:"#0ea5e9", title:"Subscriptions",      desc:"Never pay for an unused service again. Manage all your recurring bills and subscriptions in one place." },
];

const STATS = [
  { value:1200, suffix:"+", label:"Active Students",   icon: <Users /> },
  { value:4,    suffix:"M+", label:"PKR Saved Monthly", icon: <PiggyBank /> },
  { value:98,   suffix:"%",  label:"Satisfaction Rate", icon: <Star /> },
  { value:120,  suffix:"K+", label:"Expenses Tracked",  icon: <FileSpreadsheet /> },
];

const TESTIMONIALS = [
  { name:"Afaq Usman",    uni:"Riphah International University", avatar:"👨‍🎓", text:"SpendSmart has been a game-changer for my student life at Riphah. I can finally track my lunch and commute expenses without any hassle.", stars:5 },
  { name:"Saifullah",     uni:"Riphah International University", avatar:"👨‍💻", text:"The bill scanner feature is what I use the most. Just a snap and my canteen bills are logged instantly. Truly a life saver!", stars:5 },
  { name:"Shahbaz",       uni:"Riphah International University", avatar:"🧑‍💻", text:"I love the AI insights. It helped me realize how much I was spending on small things. SpendSmart is a must-have for every student.", stars:5 },
];

const STEPS = [
  { num:"01", icon: <CheckCircle2 size={32} />, title:"Register Free",    desc:"Create your account in under 30 seconds. No credit card, no email verification required." },
  { num:"02", icon: <Wallet size={32} />, title:"Set Your Budget",  desc:"Go to your profile and set your monthly budget. Everything starts tracking from day one." },
  { num:"03", icon: <Smartphone size={32} />, title:"Track & Save",     desc:"Add expenses manually, by voice, or by scanning bills. Watch your savings grow every day." },
];

const FAQ = [
  { q:"Is SpendSmart free to use?",            a:"Yes! SpendSmart is completely free for all students. Zero hidden fees, zero subscriptions, zero credit card required." },
  { q:"How does the Bill Scanner work?",       a:"Simply take a photo of any receipt or bill. Our AI automatically detects the amount, store name, and category instantly." },
  { q:"Can I add expenses using voice?",       a:"Absolutely! Just say 'spent 500 on food' and it's logged instantly. Perfect for when your hands are busy." },
  { q:"Is my data really safe?",               a:"All your financial data stays on YOUR device. We use encryption and never share data with servers. Your privacy is sacred." },
  { q:"Does it work offline?",                 a:"Yes! Core features like adding expenses, viewing history, and analytics work completely offline. Data syncs when internet returns." },
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
    <motion.div 
      ref={ref} 
      style={L.statCard}
      className="landing-stat-card"
      whileHover={{ y: -6, borderColor: "var(--accent-glow)", boxShadow: "0 16px 48px rgba(245, 158, 11, 0.15)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.span style={{ fontSize:32 }} whileHover={{ scale: 1.2, rotate: 10 }} transition={{ duration: 0.3 }}>
        {icon}
      </motion.span>
      <div style={L.statNum} className="landing-stat-num">{count}{suffix}</div>
      <div style={L.statLabel}>{label}</div>
    </motion.div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div 
      style={{ ...L.faqItem, borderColor: open ? "var(--accent)" : "var(--border)" }}
      whileHover={{ borderColor: "var(--accent-glow)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.button 
        style={L.faqQ} 
        className="landing-faq-q"
        onClick={() => setOpen(!open)}
        whileHover={{ backgroundColor: "rgba(245, 158, 11, 0.04)" }}
        transition={{ duration: 0.2 }}
      >
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration:0.2 }} style={{ fontSize:18, color:"var(--accent)", flexShrink:0 }}>+</motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:"hidden" }}>
            <p style={L.faqA} className="landing-faq-a">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingPage({ onGetStarted, onLogin, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navInnerStyle = isMobile ? { ...L.navInner, ...L.navInnerMobile } : L.navInner;
  const heroStyle = isMobile ? { ...L.hero, ...L.heroMobile } : L.hero;
  const heroContentStyle = isMobile ? { ...L.heroContent, ...L.heroContentMobile } : L.heroContent;
  const heroH1Style = isMobile ? { ...L.heroH1, ...L.heroH1Mobile } : L.heroH1;
  const heroSubStyle = isMobile ? { ...L.heroSub, ...L.heroSubMobile } : L.heroSub;
  const statsGridStyle = isMobile ? { ...L.statsGrid, ...L.statsGridMobile } : L.statsGrid;
  const sectionStyle = isMobile ? { ...L.section, ...L.sectionMobile } : L.section;
  const altSectionStyle = isMobile ? { ...L.section, ...L.sectionMobile, ...L.altSection } : { ...L.section, ...L.altSection };
  const stepsRowStyle = isMobile ? { ...L.stepsRow, ...L.stepsRowMobile } : L.stepsRow;
  const ctaBannerInnerStyle = isMobile ? { ...L.ctaBannerInner, ...L.ctaBannerInnerMobile } : L.ctaBannerInner;
  const footerTopStyle = isMobile ? { ...L.footerTop, ...L.footerTopMobile } : L.footerTop;
  const footerBottomStyle = isMobile ? { ...L.footerBottom, ...L.footerBottomMobile } : L.footerBottom;
  const heroTrustRowStyle = isMobile ? { ...L.heroTrustRow, ...L.heroTrustRowMobile } : L.heroTrustRow;

  if (initLoading) return <PageSkeleton />;

  return (
    <div style={L.root}>
      {/* Background elements */}
      <div style={L.meshBg} />
      <div style={L.orb1} /><div style={L.orb2} />

      {/* ── NAVBAR ── */}
      <nav style={{ ...L.nav, ...(scrolled ? L.navScrolled : {}) }} className="landing-nav">
        <div style={navInnerStyle} className="nav-inner glass landing-nav-inner">
          <motion.a 
            style={L.navLogo} 
            href="#" 
            onClick={e => e.preventDefault()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogoIcon size={48} showName nameSize={20} glow />
          </motion.a>
          {!isMobile && (
            <div style={L.navLinks}>
              {NAV_LINKS.map(l => (
                <motion.a 
                  key={l} 
                  href={`#${l.toLowerCase().replace(/ /g,'-')}`} 
                  style={L.navLink} 
                  whileHover={{ scale:1.05, color:'var(--accent)' }} 
                  whileTap={{ scale:0.95 }}
                  className="nav-link-hover"
                >
                  {l}
                  <span style={{ position: "absolute", bottom: "-2px", left: 0, width: "100%", height: "2px", background: "var(--accent)", borderRadius: "1px", transform: "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s ease" }} className="link-underline" />
                </motion.a>
              ))}
            </div>
          )}
          <div style={L.navCTAs} className="nav-cta-group">
            <motion.button 
              style={L.themeToggleBtn} 
              onClick={toggleTheme} 
              aria-label="Toggle theme" 
              className="hide-mobile" 
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              whileHover={{ scale: 1.1, borderColor: "var(--accent)" }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
            <motion.button 
              style={L.navLoginBtn} 
              onClick={onLogin} 
              data-no-audio="true" 
              whileHover={{ scale:1.08, backgroundColor:"rgba(255,255,255,0.12)" }} 
              whileTap={{ scale:0.97 }} 
              className="hide-mobile"
            >
              Sign In
            </motion.button>
            <motion.button 
              style={{ ...L.navRegBtn, ...(isMobile ? L.navRegBtnMobile : {}) }} 
              onClick={onGetStarted} 
              whileHover={{ scale:1.08, boxShadow: "0 8px 24px rgba(245, 158, 11, 0.3)" }} 
              whileTap={{ scale:0.96 }} 
              className="btn-scale"
            >
              {isMobile ? "Join Free" : "Get Started Free"}
            </motion.button>
            {isMobile && (
              <motion.button
                style={{ ...L.mobileMenuBtn, ...(mobileMenuOpen ? L.mobileMenuBtnOpen : {}) }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                whileTap={{ scale: 0.92 }}
              >
                <span style={L.hamburgerLines}>
                  <motion.span
                    style={L.hamburgerLine}
                    animate={mobileMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                  <motion.span
                    style={L.hamburgerLine}
                    animate={mobileMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    style={L.hamburgerLine}
                    animate={mobileMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                </span>
              </motion.button>
            )}
          </div>
        </div>
        {/* Mobile menu — full overlay */}
        <AnimatePresence>
          {isMobile && mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={L.mobileMenuBackdrop}
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                style={L.mobileMenu}
                className="landing-mobile-menu"
              >
                <div style={L.mobileMenuHeader}>
                  <span style={L.mobileMenuLabel}>Menu</span>
                  <button style={L.mobileMenuClose} onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                    <X size={18} />
                  </button>
                </div>
                <div style={L.mobileMenuLinks}>
                  {NAV_LINKS.map((l, i) => (
                    <motion.a
                      key={l}
                      href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                      style={L.mobileMenuLink}
                      onClick={() => setMobileMenuOpen(false)}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05 }}
                      whileHover={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{l}</span>
                      <ChevronRight size={16} style={{ color: "var(--accent)", opacity: 0.7 }} />
                    </motion.a>
                  ))}
                </div>
                <div style={L.mobileMenuDivider} />
                <div style={L.mobileMenuActions}>
                  <motion.button
                    style={L.mobileMenuSignIn}
                    onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    style={L.mobileThemeBtn}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    whileTap={{ scale: 0.95 }}
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.button>
                  <motion.button
                    style={L.mobileMenuCta}
                    onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Get Started Free
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section style={heroStyle} className="landing-hero">
        <motion.div style={{ ...heroContentStyle, y: heroY }}>
          <div>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
              <div style={L.heroBadge} className="landing-hero-badge">
                <span style={L.heroBadgeDot} />
                🎓 Built for Pakistani Students · Track your expenses effortlessly
              </div>
            </motion.div>

            <motion.h1 style={heroH1Style} className="hero-title"
              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}>
              Stop Guessing,<br />
              <span className="gradient-text">Start Saving Smart</span>
            </motion.h1>

            <motion.p style={heroSubStyle}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.35 }}>
              The intelligent expense tracker that learns your spending habits, warns you before you overspend,
              and builds real financial discipline — <span style={{ color: "var(--accent)", fontWeight: 600 }}>for free</span>.
            </motion.p>

            <motion.div style={L.heroCTAs} className="landing-hero-ctas"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.5 }}>
              <motion.button style={L.ctaPrimary} onClick={onGetStarted} whileHover={{ scale:1.08, boxShadow:"0 20px 48px rgba(245, 158, 11, 0.35)" }} whileTap={{ scale:0.96 }}>
                🚀 Create Free Account
              </motion.button>
              <motion.button style={L.ctaOutline} onClick={onLogin} data-no-audio="true" whileHover={{ scale:1.05, backgroundColor:"rgba(255,255,255,0.08)", borderColor: "var(--accent)" }} whileTap={{ scale:0.97 }}>
                Sign In →
              </motion.button>
            </motion.div>

            </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity:0, x:50, rotateY:-10 }}
          animate={{ opacity:1, x:0, rotateY:0 }}
          transition={{ duration:0.9, delay:0.2, type:"spring", stiffness:80 }}
          style={{ ...L.heroVisual, display: isMobile ? "none" : "flex" }}
          className="landing-hero-visual"
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
        <div style={statsGridStyle} className="landing-stats-grid">
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={sectionStyle} className="landing-section">
        <SectionHeader tag="Everything You Need" title="Powerful Features for Smart Students" sub="From voice input to bill scanning — every tool to make expense tracking effortless and intelligent." />
        <div style={L.featGrid} className="landing-feat-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              style={L.featCard}
              initial={{ opacity:0, y:30 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-40px" }}
              transition={{ duration:0.6, delay: i * 0.08, ease:[0.19, 1, 0.22, 1] }}
              whileHover={{ y:-12, boxShadow:"0 32px 72px -16px rgba(0,0,0,0.25)", borderColor:"var(--accent-glow)" }}
              className="feature-card landing-feat-card"
            >
              <motion.div 
                style={{ ...L.featIconBox, background: `linear-gradient(135deg, ${f.color}22, ${f.color}08)`, border:`1.5px solid ${f.color}33`, color: f.color }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                {f.icon}
              </motion.div>
              <h3 style={L.featTitle}>{f.title}</h3>
              <p style={L.featDesc}>{f.desc}</p>
              <div style={{ position:"absolute", bottom:-20, right:-20, width:100, height:100, background:f.color, opacity:0.03, filter:"blur(40px)", borderRadius:"50%", transition:"all 0.3s" }} className="feat-glow" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={altSectionStyle} className="landing-alt-section">
        <SectionHeader tag="Simple Process" title="Up & Running in 3 Steps" sub="No complicated setup. Start tracking in minutes." />
        <div style={stepsRowStyle} className="landing-steps-row">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              style={L.stepCard}
              initial={{ opacity:0, y:20 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y:-8, boxShadow:"0 24px 56px rgba(245, 158, 11, 0.15)", borderColor: "var(--accent-glow)" }}
              className="step-card landing-step-card"
            >
              <div style={L.stepNumBadge}>{step.num}</div>
              <motion.div 
                style={L.stepIconCircle}
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                {step.icon}
              </motion.div>
              <h3 style={L.stepTitle}>{step.title}</h3>
              <p style={L.stepDesc}>{step.desc}</p>
              {i < STEPS.length - 1 && !isMobile && <div style={L.stepArrow}>→</div>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ME ── */}
      <section id="about" style={altSectionStyle} className="landing-alt-section landing-about-section">
        <SectionHeader tag="Meet the Creator" title="About Me" sub="The mind behind Spend Smart — building tools that help students take control of their finances." />
        <motion.div
          style={isMobile ? { ...L.aboutCard, ...L.aboutCardMobile } : L.aboutCard}
          className="landing-about-card"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        >
          <div style={L.aboutGlow} />
          <div style={isMobile ? { ...L.aboutInner, ...L.aboutInnerMobile } : L.aboutInner}>
            <motion.div
              style={L.aboutPhotoWrap}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div style={L.aboutPhotoRing} />
              <img src={shoaibPhoto} alt="Shoaib Arshad" style={L.aboutPhoto} />
              <div style={L.aboutPhotoBadge}>
                <Sparkles size={12} />
                <span>Creator</span>
              </div>
            </motion.div>
            <div style={L.aboutContent}>
              <div style={L.aboutNameRow}>
                <h3 style={L.aboutName}>Shoaib Arshad</h3>
                <div style={{ ...L.aboutTags, ...(isMobile ? { justifyContent: "center" } : {}) }}>
                  <span style={L.aboutTag}><GraduationCap size={13} /> Software Engineering Student</span>
                  <span style={L.aboutTag}><Code2 size={13} /> Web Developer</span>
                </div>
              </div>
              <p style={L.aboutText}>
                Hi, I'm <strong style={{ color: "var(--text-primary)" }}>Shoaib Arshad</strong>, a Software Engineering student passionate about technology, web development, and problem-solving. I created <strong style={{ color: "var(--accent)" }}>Spend Smart</strong> to help people manage their finances more effectively, track expenses, and develop smarter spending habits. My goal is to build digital solutions that make everyday life simpler and more organized.
              </p>
              <blockquote style={L.aboutQuote}>
                <span style={L.aboutQuoteMark}>"</span>
                Spend Smart Today, Secure Your Tomorrow.
                <span style={L.aboutQuoteMark}>"</span>
              </blockquote>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={sectionStyle} className="landing-section">
        <SectionHeader tag="What Students Say" title="Real Feedback from Real Users" sub="Over 1,200 students across Pakistan trust SpendSmart with their finances." />
        <div style={L.testGrid} className="responsive-grid landing-test-grid">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              style={L.testCard}
              initial={{ opacity:0, scale:0.95 }}
              whileInView={{ opacity:1, scale:1 }}
              viewport={{ once:true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y:-8, boxShadow:"0 20px 56px rgba(245, 158, 11, 0.12)", borderColor: "var(--accent-glow)" }}
              className="testimonial-card landing-test-card"
            >
              <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center" }}>
                <motion.span 
                  style={L.testAvatar}
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  {t.avatar}
                </motion.span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{t.uni}</div>
                </div>
                <div style={L.testStars} className="hide-mobile">{"⭐".repeat(t.stars)}</div>
              </div>
              <p style={L.testText}>"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={altSectionStyle} className="landing-alt-section">
        <SectionHeader tag="FAQ" title="Common Questions" sub="Everything you need to know before getting started." />
        <div style={L.faqList}>
          {FAQ.map(f => <FAQItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={L.ctaBanner}>
        <motion.div
          style={ctaBannerInnerStyle}
          className="landing-cta-banner-inner"
          initial={{ opacity:0, scale:0.95 }}
          whileInView={{ opacity:1, scale:1 }}
          viewport={{ once:true }}
        >
          <div style={L.ctaBannerGlow} />
          <h2 style={L.ctaBannerTitle} className="landing-cta-banner-title">Ready to Take Control of Your Money?</h2>
          <p style={L.ctaBannerSub} className="landing-cta-banner-sub">Join 1,200+ students building better financial habits today. It's completely free.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <motion.button style={L.ctaPrimary} onClick={onGetStarted} whileHover={{ scale:1.08, boxShadow: "0 20px 48px rgba(245, 158, 11, 0.35)" }} whileTap={{ scale:0.96 }}>
              🚀 Create Free Account
            </motion.button>
            <motion.button 
              style={L.ctaOutline}
              onClick={onLogin} 
              data-no-audio="true" 
              whileHover={{ scale:1.08, backgroundColor:"rgba(255,255,255,0.08)", borderColor: "var(--accent)" }} 
              whileTap={{ scale:0.96 }}
            >
              Sign In →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={L.footer} className="landing-footer">
        <div style={L.footerContainer}>
          {/* Tier 1: Links Grid */}
          <div style={isMobile ? { ...L.footerGrid, ...L.footerGridMobile } : L.footerGrid} className="landing-footer-grid">
            <div style={L.footerMainCol}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <LogoIcon size={52} showName nameSize={22} glow />
              </div>
              <p style={L.footerDesc}>
                Empowering students with AI-driven financial clarity. Built for the next generation of Pakistani savers. 
                Experience the best expense tracking with smart insights and a premium interface.
              </p>
            </div>
            <div style={L.footerLinkCol}>
              <h4 style={L.footerColTitle}>Product</h4>
              {["Features","Analytics","Goals","Subscriptions"].map(l => <motion.a key={l} href="#" style={L.footerLink} whileHover={{ x: 4, color: "var(--accent)" }} whileTap={{ scale: 0.95 }}>{l}</motion.a>)}
            </div>
            <div style={L.footerLinkCol}>
              <h4 style={L.footerColTitle}>Resources</h4>
              {["Guide","API","Docs","Support"].map(l => <motion.a key={l} href="#" style={L.footerLink} whileHover={{ x: 4, color: "var(--accent)" }} whileTap={{ scale: 0.95 }}>{l}</motion.a>)}
            </div>
            <div style={L.footerLinkCol}>
              <h4 style={L.footerColTitle}>Legal</h4>
              {["Privacy","Terms","Cookies","Security"].map(l => <motion.a key={l} href="#" style={L.footerLink} whileHover={{ x: 4, color: "var(--accent)" }} whileTap={{ scale: 0.95 }}>{l}</motion.a>)}
            </div>
            <div style={L.footerLinkCol}>
              <h4 style={L.footerColTitle}>Company</h4>
              <motion.a href="#about" style={L.footerLink} whileHover={{ x: 4, color: "var(--accent)" }} whileTap={{ scale: 0.95 }}>About</motion.a>
              {["Team","Careers","Contact"].map(l => <motion.a key={l} href="#" style={L.footerLink} whileHover={{ x: 4, color: "var(--accent)" }} whileTap={{ scale: 0.95 }}>{l}</motion.a>)}
            </div>
          </div>

          {/* Tier 2: CTA Section */}
          <div style={L.footerTier}>
            <div style={L.footerCtaWrap} className="landing-footer-cta-wrap">
              <span style={{ fontSize:15, color:"var(--text-primary)" }}>Ready to save smart?</span>
              <motion.button 
                style={L.footerCtaBtn} 
                onClick={onGetStarted}
                whileHover={{ scale: 1.08, boxShadow: "0 12px 32px rgba(245, 158, 11, 0.25)" }}
                whileTap={{ scale: 0.96 }}
              >
                SIGN UP FREE!
              </motion.button>
            </div>
          </div>

          {/* Tier 3: Social Icons */}
          <div style={L.footerTier}>
            <div style={L.footerSocialRow}>
              {[
                { name: 'FB', path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
                { name: 'TW', path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" },
                { name: 'GG', path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
                { name: 'IG', path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" },
                { name: 'IN', path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z" },
                { name: 'GH', path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" }
              ].map((social) => (
                <motion.div key={social.name} style={L.footerSocialCircle} whileHover={{ scale: 1.1, borderColor: "var(--accent)" }} whileTap={{ scale: 0.95 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={social.path}></path></svg>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tier 4: Copyright */}
          <div style={L.footerCopyright}>
            © 2025 Copyright: <a href="#" style={{ color:"var(--text-primary)", textDecoration:"none", fontWeight:700 }}>SpendSmart.com</a> • All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ tag, title, sub }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:"center", marginBottom:40 }}>
      <span style={L.sectionTag}>{tag}</span>
      <h2 style={L.sectionTitle} className="landing-section-title">{title}</h2>
      {sub && <p style={L.sectionSub} className="landing-section-sub">{sub}</p>}
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
          <span style={{ fontSize:10, color:"var(--accent)", fontWeight:700 }}>67%</span>
        </div>
        <div style={{ height:5, background:"var(--border)", borderRadius:3 }}>
          <motion.div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg, var(--green), var(--accent))" }} initial={{ width:0 }} animate={{ width:"67%" }} transition={{ duration:1.5, delay:0.8 }} />
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
            <motion.div key={i} style={{ flex:1, borderRadius:3, background: i===5 ? "var(--accent)" : "var(--border)" }}
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
  root:            { minHeight:"100vh", background:"var(--bg-primary)", color:"var(--text-primary)", overflowX:"hidden", position:"relative", fontFamily:"'Outfit', 'Inter', sans-serif" },
  meshBg:          { position:"fixed", inset:0, backgroundImage:"radial-gradient(ellipse at 20% 50%, var(--accent-subtle) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, var(--accent-glow) 0%, transparent 70%)", opacity:0.3, pointerEvents:"none", zIndex:0 },
  orb1:            { position:"fixed", top:"-5%", left:"-2%", width:500, height:500, background:"radial-gradient(circle, var(--accent) 0%, transparent 60%)", filter:"blur(80px)", opacity:0.08, pointerEvents:"none", zIndex:0 },
  orb2:            { position:"fixed", top:"30%", right:"-5%", width:500, height:500, background:"radial-gradient(circle, var(--blue) 0%, transparent 60%)", filter:"blur(80px)", opacity:0.06, pointerEvents:"none", zIndex:0 },
  
  // NAVBAR - Modern Full Width Design with Prominent Logo
  nav:             { position:"fixed", top:0, left:0, right:0, zIndex:1000, transition:"all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", padding:"0", display:"flex", justifyContent:"center", background:"var(--nav-bg, rgba(5,7,10,0.7))", backdropFilter:"blur(24px) saturate(180%)", borderBottom:"1px solid var(--border-light)" },
  navScrolled:     { background:"var(--nav-bg-scroll, rgba(5,7,10,0.95))", backdropFilter:"blur(40px)", borderBottom:"1px solid var(--accent-subtle)", boxShadow:"var(--shadow-md)" },
  navInner:        { width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 48px", maxWidth:"1400px" },
  navLogo:         { display:"flex", alignItems:"center", gap:10, textDecoration:"none", transition:"all 0.3s", position:"relative", flexShrink:0 },
  logoText:        { fontSize:18, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.8px" },
  navLinks:        { display:"flex", gap:32, alignItems:"center", flex:1, justifyContent:"center" },
  navLink:         { fontSize:13, color:"var(--text-secondary)", textDecoration:"none", fontWeight:700, transition:"all 0.3s ease", textTransform:"uppercase", letterSpacing:"1.2px", position:"relative" },
  navCTAs:         { display:"flex", gap:12, alignItems:"center", flexShrink:0 },
  themeToggleBtn:  { background:"transparent", border:"1.5px solid var(--border)", color:"var(--text-primary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", width:38, height:38, borderRadius:"50%", transition:"all 0.3s" },
  navLoginBtn:     { background:"transparent", border:"1.5px solid var(--border)", color:"var(--text-primary)", padding:"10px 22px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.3s" },
  navRegBtn:       { background:"linear-gradient(135deg, var(--accent), #f97316)", border:"none", color:"#000", padding:"10px 24px", borderRadius:10, fontSize:13, fontWeight:800, cursor:"pointer", transition:"all 0.3s", boxShadow:"0 4px 16px rgba(245, 158, 11, 0.25)" },
  navRegBtnMobile: { padding:"8px 14px", fontSize:12, fontWeight:800 },
  
  // HERO - Compact Width
  hero:            { minHeight:"85vh", display:"grid", gridTemplateColumns:"1fr 1fr", alignItems:"center", maxWidth:"1200px", margin:"0 auto", padding:"120px 32px 60px", gap:60, position:"relative", zIndex:1 },
  heroContent:     { maxWidth:550 },
  heroBadge:       { display:"inline-flex", alignItems:"center", gap:8, background:"var(--accent-subtle)", border:"1.5px solid var(--accent-glow)", color:"var(--accent)", padding:"6px 14px", borderRadius:100, fontSize:12, fontWeight:800, marginBottom:24, textTransform:"uppercase", letterSpacing:"0.5px" },
  heroBadgeDot:    { width:6, height:6, borderRadius:"50%", background:"var(--accent)", animation:"pulse-glow 2s infinite" },
  heroH1:          { fontWeight:950, fontSize:64, lineHeight:1.1, margin:"0 0 24px", letterSpacing:"-3px", color:"var(--text-primary)" },
  heroSub:         { fontSize:16, color:"var(--text-secondary)", lineHeight:1.7, margin:"0 0 36px", maxWidth:480 },
  heroCTAs:        { display:"flex", gap:14, marginBottom:32, flexWrap:"wrap" },
  ctaPrimary:      { background:"linear-gradient(135deg, #f59e0b, #ea580c)", color:"#fff", border:"none", padding:"14px 32px", borderRadius:10, fontSize:15, fontWeight:800, cursor:"pointer", transition:"all 0.3s", boxShadow:"0 8px 24px rgba(245, 158, 11, 0.3)" },
  ctaOutline:      { background:"rgba(255, 255, 255, 0.05)", border:"1.5px solid var(--border)", color:"var(--text-primary)", padding:"14px 32px", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", transition:"all 0.3s" },
  heroTrustRow:    { display:"flex", alignItems:"center", gap:14, fontSize:13, color:"var(--text-muted)", fontWeight:600 },
  trustAvatars:    { display:"flex", marginLeft:8 },
  trustAvatar:     { width:28, height:28, borderRadius:"50%", background:"var(--bg-elevated)", border:"2.5px solid var(--bg-primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, marginLeft:-10 },
  
  // HERO VISUAL
  heroVisual:      { position:"relative", display:"flex", justifyContent:"center" },
  mockWrap:        { width:"100%", maxWidth:380, background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:28, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" },
  mockHeader:      { background:"var(--bg-elevated)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border-light)" },
  floatCard:       { position:"absolute", background:"rgba(var(--bg-card-rgb), 0.95)", border:"1.5px solid var(--border)", padding:"12px 16px", borderRadius:18, display:"flex", alignItems:"center", gap:10, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", zIndex:10, backdropFilter:"blur(16px)" },

  // STATS
  statsSection:    { padding:"0 32px 140px", maxWidth:"1200px", margin:"0 auto" },
  statsGrid:       { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:20 },
  statCard:        { background:"linear-gradient(135deg, var(--bg-card), rgba(255, 159, 28, 0.05))", border:"1.5px solid var(--border)", borderRadius:24, padding:"32px 20px", textAlign:"center", transition:"all 0.3s", position:"relative", overflow:"hidden" },
  statNum:         { fontSize:40, fontWeight:950, background:"linear-gradient(135deg, #fbbf24, var(--accent), #f97316)", backgroundClip:"text", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"8px 0 6px", letterSpacing:"-1.5px", lineHeight:1 },
  statLabel:       { fontSize:12, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" },

  // FEATURES
  section:         { padding:"140px 32px", maxWidth:"1200px", margin:"0 auto" },
  altSection:      { padding:"140px 32px", background:"linear-gradient(180deg, var(--bg-secondary), transparent)", borderTop:"1.5px solid var(--border-light)", borderBottom:"1.5px solid var(--border-light)" },
  sectionTag:      { display:"inline-block", color:"var(--accent)", background:"var(--accent-subtle)", padding:"6px 14px", borderRadius:100, fontSize:11, fontWeight:900, textTransform:"uppercase", marginBottom:16, letterSpacing:"0.8px" },
  sectionTitle:    { fontSize:40, fontWeight:950, margin:"0 0 14px", letterSpacing:"-2px", lineHeight:1.1, color:"var(--text-primary)" },
  sectionSub:      { fontSize:16, color:"var(--text-secondary)", maxWidth:580, margin:"0 auto", lineHeight:1.6 },
  
  featGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, marginTop:56 },
  featCard:        { background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:28, padding:"36px 28px", transition:"all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", position:"relative", overflow:"hidden" },
  featIconBox:     { width:56, height:56, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, fontSize:24, transition:"all 0.3s" },
  featTitle:       { fontSize:22, fontWeight:850, margin:"0 0 12px", color:"var(--text-primary)" },
  featDesc:        { fontSize:15, color:"var(--text-secondary)", lineHeight:1.6, margin:0 },
  
  // HOW IT WORKS
  stepsRow:        { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:28, marginTop:56 },
  stepCard:        { position:"relative", padding:"44px 28px", background:"linear-gradient(135deg, var(--bg-card), rgba(245, 158, 11, 0.03))", border:"1.5px solid var(--border)", borderRadius:28, textAlign:"center", transition:"all 0.4s" },
  stepNumBadge:    { position:"absolute", top:20, right:24, fontSize:56, fontWeight:950, color:"var(--text-primary)", opacity:0.04, lineHeight:1 },
  stepIconCircle:  { width:64, height:64, background:"linear-gradient(135deg, var(--accent), #f97316)", backgroundClip:"content-box", border:"1.5px solid var(--border)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:28, color:"#000" },
  stepTitle:       { fontSize:22, fontWeight:850, marginBottom:12, color:"var(--text-primary)" },
  stepDesc:        { fontSize:15, color:"var(--text-secondary)", lineHeight:1.6 },
  stepArrow:       { position:"absolute", right:"-28px", top:"50%", transform:"translateY(-50%)", fontSize:24, color:"var(--border)", opacity:0.3 },

  // TESTIMONIALS
  testGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:24, marginTop:56 },
  testCard:        { background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:28, padding:"36px 28px", transition:"all 0.3s" },
  testAvatar:      { width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent-glow), rgba(255, 159, 28, 0.2))", border:"1.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 },
  testStars:       { color:"#fbbf24", fontSize:13, letterSpacing:3, marginBottom:20 },
  testText:        { fontSize:15, color:"var(--text-primary)", lineHeight:1.7, fontStyle:"italic", margin:"0 0 20px" },

  // FAQ
  faqList:         { maxWidth:800, margin:"56px auto 0", display:"flex", flexDirection:"column", gap:14 },
  faqItem:         { background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:18, overflow:"hidden", transition:"all 0.3s" },
  faqQ:            { width:"100%", padding:"20px 28px", background:"transparent", border:"none", display:"flex", justifyContent:"space-between", alignItems:"center", color:"var(--text-primary)", fontSize:16, fontWeight:800, cursor:"pointer", transition:"all 0.3s" },
  faqA:            { padding:"0 28px 20px", color:"var(--text-secondary)", fontSize:15, lineHeight:1.6, margin:0 },

  // CTA
  ctaBanner:       { padding:"100px 32px" },
  ctaBannerInner:  { maxWidth:"1000px", margin:"0 auto", background:"var(--bg-card)", border:"1.5px solid var(--accent-subtle)", borderRadius:36, padding:"72px 48px", textAlign:"center", color:"var(--text-primary)", position:"relative", overflow:"hidden", boxShadow:"0 0 60px var(--accent-subtle), var(--shadow-lg)" },
  ctaBannerGlow:   { position:"absolute", top:"-40%", left:"50%", transform:"translateX(-50%)", width:700, height:700, background:"radial-gradient(circle, var(--accent-glow) 0%, var(--accent-subtle) 30%, transparent 70%)", pointerEvents:"none" },
  ctaBannerTitle:  { fontSize:42, fontWeight:950, margin:"0 0 14px", letterSpacing:"-2px", lineHeight:1.1, color:"var(--text-primary)" },
  ctaBannerSub:    { fontSize:18, fontWeight:500, margin:"0 auto 40px", maxWidth:500, color:"var(--text-secondary)" },

  // FOOTER - Modern with Logo
  footer:          { borderTop:"1.5px solid var(--border)", background:"var(--bg-card)", padding:"100px 32px 60px", position:"relative", zIndex:2 },
  footerContainer: { maxWidth:"1200px", margin:"0 auto", display:"flex", flexDirection:"column", gap:80 },
  footerGrid:      { display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr", gap:40, textAlign:"left" },
  footerMainCol:   { },
  footerLinkCol:   { },
  footerLogo:      { fontSize:18, fontWeight:900, color:"var(--text-primary)", margin:"0 0 12px", letterSpacing:"-0.5px" },
  footerColTitle:  { fontSize:12, fontWeight:900, color:"var(--text-primary)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:24 },
  footerDesc:      { fontSize:15, color:"var(--text-secondary)", lineHeight:1.8, margin:0 },
  footerLink:      { fontSize:15, color:"var(--text-secondary)", marginBottom:12, cursor:"pointer", transition:"all 0.3s", display:"block", textDecoration:"none" },
  
  footerTier:      { borderTop:"1.5px solid var(--border-light)", paddingTop:48, textAlign:"center" },
  footerCtaWrap:   { display:"flex", alignItems:"center", justifyContent:"center", gap:24 },
  footerCtaBtn:    { background:"linear-gradient(135deg, var(--accent), #f97316)", border:"none", color:"#000", padding:"12px 32px", borderRadius:100, fontSize:14, fontWeight:800, cursor:"pointer", transition:"all 0.3s" },
  
  footerSocialRow: { display:"flex", justifyContent:"center", gap:16 },
  footerSocialCircle: { width:44, height:44, border:"2px solid var(--text-muted)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-primary)", cursor:"pointer", transition:"all 0.3s" },
  
  footerCopyright: { textAlign:"center", fontSize:14, color:"var(--text-secondary)", paddingTop:24 },

  // MOBILE
  heroMobile:      { gridTemplateColumns:"1fr", padding:"100px 20px 60px", textAlign:"center" },
  heroContentMobile:{ margin:"0 auto" },
  heroH1Mobile:    { fontSize:42, letterSpacing:"-1.8px" },
  heroSubMobile:   { fontSize:15, margin:"0 auto 32px" },
  heroTrustRowMobile: { justifyContent:"center" },
  statsGridMobile: { gridTemplateColumns:"1fr 1fr", gap:16 },
  sectionMobile:   { padding:"100px 20px" },
  stepsRowMobile:  { gridTemplateColumns:"1fr", gap:24 },
  ctaBannerInnerMobile: { padding:"48px 24px", borderRadius:32 },
  footerGridMobile: { gridTemplateColumns:"1fr 1fr", gap:40 },
  footerCtaMobile: { flexDirection:"column", gap:16 },
  navInnerMobile:  { padding:"10px 14px", gap:8 },
  mobileMenuBtn:     { width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1.5px solid var(--border)", color:"var(--text-primary)", display:"flex", alignItems:"center", justifyContent:"center", padding:0, cursor:"pointer", flexShrink:0, transition:"all 0.3s" },
  mobileMenuBtnOpen: { background:"var(--accent-subtle)", borderColor:"var(--accent-glow)" },
  hamburgerLines:    { width:18, height:14, display:"flex", flexDirection:"column", justifyContent:"space-between", alignItems:"center" },
  hamburgerLine:     { display:"block", width:18, height:2, borderRadius:2, background:"currentColor", transformOrigin:"center" },
  mobileMenuBackdrop:{ position:"fixed", inset:0, top:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", zIndex:1001 },
  mobileMenu:        { position:"fixed", top:"calc(56px + env(safe-area-inset-top, 0px))", left:12, right:12, background:"rgba(var(--bg-card-rgb, 15,17,21), 0.92)", backdropFilter:"blur(24px) saturate(180%)", border:"1.5px solid var(--border)", borderRadius:20, padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:0, zIndex:1002, boxShadow:"0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset" },
  mobileMenuHeader:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  mobileMenuLabel:   { fontSize:11, fontWeight:900, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"1.4px" },
  mobileMenuClose:   { width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid var(--border)", color:"var(--text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  mobileMenuLinks:   { display:"flex", flexDirection:"column", gap:4 },
  mobileMenuLink:    { display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:15, fontWeight:700, color:"var(--text-primary)", textDecoration:"none", padding:"14px 14px", borderRadius:12, background:"transparent", transition:"background 0.2s" },
  mobileMenuDivider: { height:1, background:"var(--border-light)", margin:"12px 0" },
  mobileMenuActions: { display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" },
  mobileMenuSignIn:  { flex:1, background:"rgba(255,255,255,0.04)", border:"1.5px solid var(--border)", color:"var(--text-primary)", padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" },
  mobileThemeBtn:    { background:"rgba(255,255,255,0.04)", border:"1.5px solid var(--border)", color:"var(--text-primary)", width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 },
  mobileMenuCta:     { flex:"1 1 100%", background:"linear-gradient(135deg, var(--accent), #f97316)", border:"none", color:"#000", padding:"12px 16px", borderRadius:12, fontSize:13, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 16px rgba(245, 158, 11, 0.25)" },

  // ABOUT ME
  aboutCard:         { position:"relative", maxWidth:960, margin:"56px auto 0", background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:32, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.12)" },
  aboutCardMobile:   { borderRadius:24, marginTop:40 },
  aboutGlow:         { position:"absolute", top:"-30%", right:"-10%", width:400, height:400, background:"radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)", opacity:0.35, pointerEvents:"none" },
  aboutInner:        { display:"grid", gridTemplateColumns:"280px 1fr", gap:48, padding:"48px 52px", alignItems:"center", position:"relative", zIndex:1 },
  aboutInnerMobile:  { gridTemplateColumns:"1fr", gap:32, padding:"32px 24px", textAlign:"center" },
  aboutPhotoWrap:    { position:"relative", width:240, height:240, margin:"0 auto" },
  aboutPhotoRing:    { position:"absolute", inset:-8, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), #f97316, #8b5cf6)", opacity:0.85, animation:"pulse-glow 3s ease-in-out infinite" },
  aboutPhoto:        { position:"relative", width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover", border:"4px solid var(--bg-card)", boxShadow:"0 16px 48px rgba(0,0,0,0.2)" },
  aboutPhotoBadge:   { position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg, var(--accent), #f97316)", color:"#000", padding:"6px 14px", borderRadius:100, fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.5px", boxShadow:"0 4px 16px rgba(245, 158, 11, 0.35)", whiteSpace:"nowrap" },
  aboutContent:      { display:"flex", flexDirection:"column", gap:20 },
  aboutNameRow:      { display:"flex", flexDirection:"column", gap:12 },
  aboutName:         { fontSize:32, fontWeight:950, margin:0, letterSpacing:"-1px", color:"var(--text-primary)", lineHeight:1.1 },
  aboutTags:         { display:"flex", flexWrap:"wrap", gap:8 },
  aboutTag:          { display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--text-secondary)", background:"var(--accent-subtle)", border:"1px solid var(--accent-glow)", padding:"6px 12px", borderRadius:100 },
  aboutText:         { fontSize:16, color:"var(--text-secondary)", lineHeight:1.8, margin:0 },
  aboutQuote:        { margin:0, padding:"20px 24px", background:"linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))", border:"1.5px solid var(--accent-glow)", borderRadius:16, fontSize:17, fontWeight:700, fontStyle:"italic", color:"var(--accent)", lineHeight:1.5, position:"relative" },
  aboutQuoteMark:    { color:"var(--accent)", opacity:0.5, fontSize:20, fontWeight:900 },
};
