import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { PartyPopper, Target, PlusCircle, PieChart, Bell, Trophy } from "lucide-react";

function getSlides() {
  return [
    {
      icon: <PartyPopper size={40} />,
      title:"Welcome to SpendSmart!",
      desc:"You've taken the first step toward smarter spending. Let's take a 30-second tour of your new financial companion.",
      tip:null,
      color:"#f59e0b",
    },
    {
      icon: <Target size={40} />,
      title:"Start by Setting Your Budget",
      desc:"Your budget is currently PKR 0. Go to your Profile to set your monthly budget. This is the most important first step!",
      tip:"💡 Tip: Go to Profile → Budget Settings to set your monthly budget",
      color:"#3b82f6",
    },
    {
      icon: <PlusCircle size={40} />,
      title:"Track Every Expense",
      desc:"Add expenses manually, use your voice ('spent 200 on food'), or scan a bill photo. Every PKR counts!",
      tip:"💡 Tip: Use the ➕ Add Expense tab to log your first expense",
      color:"#10b981",
    },
    {
      icon: <PieChart size={40} />,
      title:"Understand Your Spending",
      desc:"The Dashboard and Analytics pages show charts of your spending patterns. Discover where your money really goes.",
      tip:"💡 Tip: Check the Analytics tab for detailed trend charts",
      color:"#8b5cf6",
    },
    {
      icon: <Bell size={40} />,
      title:"Smart Alerts Keep You Safe",
      desc:"SpendSmart will notify you when you reach 80% of your budget and again if you exceed it. Never overspend again.",
      tip:"💡 Tip: Check the bell icon in the top bar for all notifications",
      color:"#ec4899",
    },
    {
      icon: <Trophy size={40} />,
      title:"Earn Rewards as You Track",
      desc:"Build daily streaks, earn badges for consistent tracking, and unlock your Saver profile. Make finance fun!",
      tip:"💡 Tip: Check the Rewards tab to see available badges",
      color:"#f97316",
    },
  ];
}

export default function OnboardingTutorial() {
  const { setShowOnboarding, user, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const SLIDES = getSlides();
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const finishOnboarding = () => {
    if (user) updateProfile({ onboarded: true });
    setShowOnboarding(false);
  };

  return (
    <div style={OB.overlay}>
      <motion.div
        initial={{ opacity:0, scale:0.9, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95 }}
        transition={{ duration:0.35, type:"spring" }}
        style={OB.modal}
      >
        {/* Skip */}
        <button style={OB.skipBtn} onClick={finishOnboarding}>Skip tour</button>

        {/* Icon */}
        <motion.div
          key={step}
          initial={{ scale:0, rotate:-20 }}
          animate={{ scale:1, rotate:0 }}
          transition={{ type:"spring", stiffness:200 }}
          style={{ ...OB.iconBig, background: slide.color + "18", border:`2px solid ${slide.color}30`, color: slide.color }}
        >
          {slide.icon}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-12 }}
            transition={{ duration:0.25 }}
            style={{ textAlign:"center" }}
          >
            {step === 0 && user?.name && (
              <p style={{ fontSize:13, color:"var(--accent)", fontWeight:600, marginBottom:4 }}>
                Hey {user.name}! 👋
              </p>
            )}
            <h2 style={OB.title}>{slide.title}</h2>
            <p style={OB.desc}>{slide.desc}</p>
            {slide.tip && (
              <div style={OB.tip}>
                <p style={{ margin:0, fontSize:12, color:"var(--accent)" }}>{slide.tip}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div style={OB.dots}>
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              style={{ ...OB.dot, background: i === step ? "var(--accent)" : "var(--border)", width: i === step ? 20 : 7 }}
              onClick={() => setStep(i)}
              animate={{ width: i === step ? 20 : 7, background: i === step ? "var(--accent)" : "var(--border)" }}
              transition={{ duration:0.25 }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={OB.navRow}>
          {step > 0 && (
            <button style={OB.prevBtn} onClick={() => setStep(s => s-1)}>← Previous</button>
          )}
          <motion.button
            style={{ ...OB.nextBtn, marginLeft:"auto", background: isLast ? "linear-gradient(135deg,#f59e0b,#f97316)" : "var(--bg-elevated)" }}
            onClick={() => isLast ? finishOnboarding() : setStep(s => s+1)}
            whileHover={{ scale:1.03 }}
            whileTap={{ scale:0.97 }}
          >
            {isLast ? "🚀 Let's Get Started!" : "Next →"}
          </motion.button>
        </div>

        {/* Step counter */}
        <p style={OB.counter}>{step + 1} of {SLIDES.length}</p>
      </motion.div>
    </div>
  );
}

const OB = {
  overlay:  { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, padding:"36px 32px 28px", width:"100%", maxWidth:440, position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:18 },
  skipBtn:  { position:"absolute", top:14, right:16, background:"transparent", border:"none", color:"var(--text-muted)", fontSize:12, cursor:"pointer" },
  iconBig:  { width:80, height:80, borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 },
  title:    { fontSize:21, fontWeight:800, color:"var(--text-primary)", margin:"0 0 10px", letterSpacing:"-0.5px" },
  desc:     { fontSize:14, color:"var(--text-secondary)", lineHeight:1.7, margin:0 },
  tip:      { background:"var(--accent-subtle)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 14px", marginTop:14, textAlign:"left", width:"100%" },
  dots:     { display:"flex", gap:6, alignItems:"center" },
  dot:      { height:7, borderRadius:10, border:"none", cursor:"pointer", padding:0 },
  navRow:   { display:"flex", gap:10, width:"100%", alignItems:"center" },
  prevBtn:  { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"10px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"var(--font)" },
  nextBtn:  { padding:"11px 22px", border:"none", color:"var(--text-primary)", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"var(--font)" },
  counter:  { fontSize:11, color:"var(--text-muted)", margin:0 },
};
