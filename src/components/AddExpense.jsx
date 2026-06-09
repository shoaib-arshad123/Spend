import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAutoCategory } from "../utils/helpers";
import { getCategoryIcon, getCategoryColor } from "../i18n/translations";
import { mergeCategories } from "../utils/categories";
import { useApp } from "../context/AppContext";
import { ChevronLeft, Mic, Camera, Sparkles, Plus, Calendar, Clock, FileText, CheckCircle2, AlertTriangle, Zap, TrendingUp } from "lucide-react";
import VoiceButton from "./VoiceInput";
import BillScanner from "./BillScanner";

export default function AddExpense({ t, lang, onAdd, setActiveTab }) {
  const { pushToast, categories, refreshCategories } = useApp();

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const displayCategories = useMemo(
    () => mergeCategories(categories),
    [categories]
  );
  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState(getAutoCategory());
  const [note,     setNote]     = useState("");
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [showScan, setShowScan] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));
  const [source, setSource] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedExpense, setSavedExpense] = useState(null);

  const timeStr = new Date().toTimeString().slice(0,5);

  const handleVoice = ({ transcript, amount: va, category: vc }) => {
    if (va) setAmount(String(va));
    if (vc) setCategory(vc);
    if (transcript && !note) setNote(transcript);
    setSource("voice");
    pushToast({ type:"info", message:`🎙️ Voice Input: PKR ${va||"?"} · ${vc}` });
  };

  const handleScan = ({ amount: sa, category: sc, description: sd }) => {
    if (sa) setAmount(String(sa));
    if (sc) setCategory(sc);
    if (sd) setNote(sd);
    setSource("scanner");
    pushToast({ type:"success", message:`📸 Bill Scanned: PKR ${sa}` });
  };

  const submit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    setIsSubmitting(true);
    setError("");
    try {
      const result = await onAdd({ amount:Number(amount), category, description:note.trim(), date:selectedDate, source });
      if (result && result.success) {
        setSavedExpense({ amount: Number(amount), category, description: note.trim() });
        setSuccess(true);
        setAmount(""); setNote(""); setCategory(getAutoCategory()); setError("");
        setTimeout(() => { setSuccess(false); setActiveTab("dashboard"); }, 1500);
      } else if (result) {
        setError(result.message || "Unable to save expense. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  // Stagger animation for children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 300 } }
  };

  return (
    <>
      <motion.div 
        style={AE.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── HEADER ── */}
        <motion.div style={AE.header} variants={itemVariants}>
          <motion.button 
            style={AE.backCircle} 
            onClick={() => setActiveTab("dashboard")}
            whileHover={{ scale:1.12, boxShadow:"0 0 20px rgba(245,184,0,0.15)" }}
            whileTap={{ scale:0.88 }}
          >
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </motion.button>
          <div style={{ flex:1 }}>
            <h2 style={AE.heading}>{t.addNew}</h2>
            <p style={AE.subheading}>Track every rupee, build better habits</p>
          </div>
          <motion.div
            animate={{ rotate:[0,360] }}
            transition={{ duration:20, repeat:Infinity, ease:"linear" }}
            style={{ opacity:0.2 }}
          >
            <TrendingUp size={32} color="var(--accent)" />
          </motion.div>
        </motion.div>

        {/* ── DATE & TIME PILLS ── */}
        <motion.div style={AE.timeRow} variants={itemVariants}>
          <motion.div style={AE.timePill} whileHover={{ scale:1.04, borderColor:"var(--accent)" }}>
            <Calendar size={13} color="var(--accent)" />
            <input 
              type="date" value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              onClick={e => e.target.showPicker && e.target.showPicker()}
              style={AE.dateInput}
            />
          </motion.div>
          <motion.div style={AE.timePill} whileHover={{ scale:1.04, borderColor:"var(--accent)" }}>
            <Clock size={13} color="var(--accent)" />
            <span style={{ fontWeight:600, fontSize:13 }}>{timeStr}</span>
          </motion.div>
        </motion.div>

        {/* ── AMOUNT HERO SECTION ── */}
        <motion.div style={AE.amountCard} variants={itemVariants}>
          {/* Decorative gradient orb */}
          <div style={AE.amountOrb} />
          <label style={AE.label}>
            <Zap size={11} color="var(--accent)" style={{ marginRight:4 }} />
            AMOUNT (PKR)
          </label>
          <div style={AE.amountBox}>
            <span style={AE.currency}>₨</span>
            <input
              type="number" value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              placeholder="0"
              style={AE.amountInput}
              className="no-focus-box"
              min="1" autoFocus
            />
          </div>
          <AnimatePresence>
            {amount && !isNaN(amount) && Number(amount) > 0 && (
              <motion.div 
                initial={{ opacity:0, height:0 }} 
                animate={{ opacity:1, height:"auto" }} 
                exit={{ opacity:0, height:0 }}
                style={AE.amountBadge}
              >
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>Total:</span>
                <span style={{ fontWeight:800, color:"var(--accent)", fontSize:14 }}>
                  PKR {Number(amount).toLocaleString()}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Quick amounts */}
          <div style={AE.quickRow}>
            {quickAmounts.map((q, i) => (
              <motion.button 
                key={q}
                style={{
                  ...AE.quickBtn,
                  ...(Number(amount) === q ? AE.quickBtnActive : {})
                }}
                onClick={() => setAmount(String(q))} 
                whileHover={{ scale:1.1, y:-3, boxShadow:"0 4px 12px rgba(245,184,0,0.15)" }}
                whileTap={{ scale:0.92 }}
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: i * 0.03 }}
              >
                +{q >= 1000 ? `${q/1000}k` : q}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── SMART INPUT BAR ── Voice & Scan */}
        <motion.div style={AE.smartBar} variants={itemVariants}>
          <div style={AE.smartLeft}>
            <motion.div
              animate={{ rotate:[0,10,-10,0], scale:[1,1.1,1] }}
              transition={{ duration:3, repeat:Infinity, repeatDelay:2 }}
            >
              <Sparkles size={18} color="var(--accent)" />
            </motion.div>
            <div>
              <span style={AE.smartTitle}>Smart Input</span>
              <span style={AE.smartSub}>AI-powered voice & scan</span>
            </div>
          </div>
          <div style={AE.smartActions}>
            <VoiceButton onResult={handleVoice} />
            <motion.button 
              style={AE.scanBtn} 
              onClick={() => setShowScan(true)} 
              whileHover={{ scale:1.08, boxShadow:"0 0 16px rgba(59,130,246,0.2)" }} 
              whileTap={{ scale:0.92 }}
            >
              <Camera size={14} />
              <span>Scan</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── CATEGORY GRID ── */}
        <motion.div style={AE.section} variants={itemVariants}>
          <label style={AE.label}>CATEGORY</label>
          <div style={AE.catGrid} className="add-expense-cat-grid">
            {displayCategories.map((cat, idx) => {
              const active = category === cat.name;
              const color = cat.color || getCategoryColor(cat.name);
              const icon = cat.icon || getCategoryIcon(cat.name) || "📦";
              return (
                <motion.button
                  key={cat.id || cat.name || idx}
                  style={{ 
                    ...AE.catBtn, 
                    background: active ? `${color}18` : "var(--bg-input)", 
                    border: `2.5px solid ${active ? color : "var(--border)"}`, 
                    color: active ? color : "var(--text-secondary)",
                    boxShadow: active ? `0 6px 24px ${color}30` : "var(--shadow-sm)",
                  }}
                  onClick={() => setCategory(cat.name)}
                  whileHover={{ scale:1.08, y:-4, boxShadow:`0 8px 24px ${color}25` }}
                  whileTap={{ scale:0.92 }}
                  initial={{ opacity:0, scale:0.85 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ delay: idx * 0.03, type:"spring", damping:18 }}
                >
                  <span style={{ fontSize:26, lineHeight:1, marginBottom:2 }}>{icon}</span>
                  <span style={{ fontSize:10.5, fontWeight: active ? 800 : 600, textTransform:"capitalize", marginTop:4, lineHeight:1.15 }}>{cat.name}</span>
                  {active && (
                    <motion.div 
                      layoutId="catIndicator" 
                      style={{ position:"absolute", bottom:2, left:"20%", right:"20%", height:3, borderRadius:3, background:color }} 
                      transition={{ type:"spring", damping:20 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── NOTE ── */}
        <motion.div style={AE.section} variants={itemVariants}>
          <label style={AE.label}>NOTE (OPTIONAL)</label>
          <div style={{ position:"relative" }}>
            <FileText size={14} color="var(--text-muted)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:0.6 }} />
            <input
              type="text" value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Canteen lunch, Rickshaw to uni..."
              style={AE.noteInput}
              className="no-focus-box"
              onKeyDown={e => e.key==="Enter" && submit()}
            />
          </div>
        </motion.div>

        {/* ── ERROR / SUCCESS ── */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity:0, y:-8, scale:0.96 }} 
              animate={{ opacity:1, y:0, scale:1 }} 
              exit={{ opacity:0, y:-8, scale:0.96 }}
              style={AE.errorBox}
            >
              <AlertTriangle size={15} /> {error}
            </motion.div>
          )}
          {isSubmitting && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={AE.savingOverlay}
            >
              <motion.div
                style={AE.savingCard}
                initial={{ opacity:0, y:18, scale:0.96 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:12, scale:0.98 }}
                transition={{ type:"spring", damping:22, stiffness:260 }}
              >
                <div style={AE.spinnerWrap}>
                  <motion.div
                    style={AE.spinnerRing}
                    animate={{ rotate:360 }}
                    transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                  />
                  <Plus size={18} color="var(--accent)" />
                </div>
                <p style={{ margin:"14px 0 0", fontWeight:800, color:"var(--text-primary)", fontSize:16 }}>Saving expense</p>
                <div style={AE.savingBar}>
                  <motion.div
                    style={AE.savingBarFill}
                    animate={{ x:["-100%","20%","100%"] }}
                    transition={{ duration:1.2, repeat:Infinity, ease:"easeInOut" }}
                  />
                </div>
                <p style={{ margin:"6px 0 0", fontSize:11, color:"var(--text-muted)" }}>Syncing securely...</p>
              </motion.div>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={AE.savingOverlay}
            >
              <motion.div
                style={AE.successCard}
                initial={{ opacity:0, y:22, scale:0.94 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-10, scale:0.98 }}
                transition={{ type:"spring", damping:20, stiffness:260 }}
              >
                <motion.div
                  style={AE.successRing}
                  initial={{ scale:0.6, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  transition={{ type:"spring", damping:16, stiffness:320 }}
                >
                  <CheckCircle2 size={34} color="var(--green)" />
                </motion.div>
                <motion.div
                  style={AE.receiptPreview}
                  initial={{ opacity:0, y:12 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.12, duration:0.28 }}
                >
                  <span style={AE.receiptLabel}>Expense added</span>
                  <strong style={AE.receiptAmount}>PKR {Number(savedExpense?.amount || 0).toLocaleString()}</strong>
                  <span style={AE.receiptMeta}>{savedExpense?.category || category}</span>
                </motion.div>
                <p style={{ margin:"12px 0 0", fontSize:12, color:"var(--text-muted)" }}>Updating your dashboard...</p>
                <motion.div
                  style={AE.successProgress}
                  initial={{ scaleX:0 }}
                  animate={{ scaleX:1 }}
                  transition={{ duration:1.25, ease:[0.25, 0.46, 0.45, 0.94] }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION BUTTONS ── */}
        <motion.div style={AE.btnRow} variants={itemVariants}>
          <motion.button 
            style={AE.cancelBtn} 
            onClick={() => setActiveTab("dashboard")}
            whileHover={{ scale:1.03, background:"rgba(255,255,255,0.06)" }}
            whileTap={{ scale:0.96 }}
          >
            {t.cancel}
          </motion.button>
          <motion.button 
            style={{ ...AE.saveBtn, opacity: isSubmitting ? 0.7 : 1 }} 
            onClick={submit} disabled={isSubmitting}
            whileHover={{ scale:1.02, boxShadow:"0 6px 30px rgba(245,184,0,0.4)" }}
            whileTap={{ scale:0.97 }}
          >
            <motion.span
              animate={isSubmitting ? { rotate:360 } : {}}
              transition={isSubmitting ? { duration:1, repeat:Infinity, ease:"linear" } : {}}
            >
              {isSubmitting ? "⏳" : "💾"}
            </motion.span>
            {isSubmitting ? "Saving..." : t.save}
          </motion.button>
        </motion.div>

        {/* ── PRO TIPS ── */}
        <motion.div style={AE.tipsRow} variants={itemVariants}>
          {[
            { icon:"🎙️", text:"Say: \"spent 200 on food\"", color:"var(--accent)" },
            { icon:"📸", text:"Scan receipt to auto-fill", color:"var(--blue)" }
          ].map((tip, i) => (
            <motion.div 
              key={i} style={AE.tipCard}
              whileHover={{ scale:1.04, y:-2, borderColor: tip.color }}
            >
              <span style={{ fontSize:18 }}>{tip.icon}</span>
              <span style={{ fontSize:11, fontWeight:500 }}>{tip.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence>{showScan && <BillScanner onClose={() => setShowScan(false)} onResult={handleScan} />}</AnimatePresence>
    </>
  );
}

/* ── STYLES ── Uses CSS variables for proper light/dark mode support */
const AE = {
  container: { 
    padding:"18px 16px 24px", display:"flex", flexDirection:"column", gap:12, 
    maxWidth:540, margin:"0 auto", position:"relative" 
  },
  
  header: { display:"flex", alignItems:"center", gap:12 },
  heading: { 
    margin:0, fontSize:22, fontWeight:800, 
    color: "var(--text-primary)",
    letterSpacing:"-0.5px",
    lineHeight: 1.1
  },
  subheading: { margin:"1px 0 0", fontSize:11, color:"var(--text-muted)", fontWeight:500, letterSpacing:"0.03em" },
  backCircle: { 
    width:36, height:36, borderRadius:"50%", 
    background:"var(--bg-card)", border:"1px solid var(--border)", 
    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0,
    marginTop: -4
  },
  
  timeRow: { display:"flex", gap:8 },
  timePill: { 
    display:"flex", alignItems:"center", gap:7, 
    background:"var(--bg-card)", border:"1px solid var(--border)", 
    padding:"6px 12px", borderRadius:10, fontSize:13, color:"var(--text-secondary)", 
    cursor:"pointer", transition:"all 0.25s ease" 
  },
  dateInput: { 
    background:"transparent", border:"none", color:"var(--text-primary)", 
    fontSize:12, fontWeight:600, fontFamily:"var(--font)", outline:"none", cursor:"pointer", width:110 
  },
  
  // Amount Card - Hero style
  amountCard: { 
    background:"var(--bg-card)",
    border:"1px solid var(--border)", borderRadius:20, 
    padding:"16px 18px", position:"relative", overflow:"hidden" 
  },
  amountOrb: {
    position:"absolute", top:-30, right:-30, width:100, height:100, 
    borderRadius:"50%", background:"radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)",
    pointerEvents:"none"
  },
  label: { 
    display:"flex", alignItems:"center", fontSize:10, color:"var(--text-muted)", 
    fontWeight:800, letterSpacing:"0.14em", marginBottom:8, position:"relative", zIndex:1 
  },
  amountBox: { display:"flex", alignItems:"center", gap:6, marginBottom:10, position:"relative", zIndex:1 },
  currency: { fontSize:24, color:"var(--accent)", fontWeight:900, flexShrink:0 },
  amountInput: { 
    flex:1, background:"transparent", border:"none", color:"var(--text-primary)", 
    fontSize:36, fontWeight:900, outline:"none", letterSpacing:"-1px", 
    fontFamily:"var(--font)", minWidth:0 
  },
  amountBadge: {
    display:"flex", alignItems:"center", gap:6, padding:"4px 10px", 
    background:"var(--accent-subtle)", borderRadius:8, marginBottom:10, 
    border:"none", width:"fit-content"
  },
  quickRow: { display:"flex", gap:6, flexWrap:"wrap", position:"relative", zIndex:1 },
  quickBtn: { 
    background:"var(--bg-input)", border:"1px solid var(--border)", 
    color:"var(--text-muted)", padding:"5px 12px", borderRadius:20, 
    cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--font)" 
  },
  quickBtnActive: { 
    background:"var(--accent-subtle)", borderColor:"var(--accent)", color:"var(--accent)" 
  },
  
  // Smart Input Bar
  smartBar: { 
    display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
    background:"var(--bg-card)", 
    border:"1px solid var(--border)", 
    borderRadius:14, padding:"10px 14px",
  },
  smartLeft: { display:"flex", alignItems:"center", gap:10 },
  smartTitle: { display:"block", fontSize:13, fontWeight:800, color:"var(--text-primary)", lineHeight:1.2 },
  smartSub: { display:"block", fontSize:10, color:"var(--text-muted)", fontWeight:500 },
  smartActions: { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  scanBtn: { 
    display:"flex", alignItems:"center", gap:4, 
    background:"var(--blue-bg)", border:"1px solid var(--blue)", 
    color:"var(--blue)", padding:"7px 12px", borderRadius:10, 
    cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--font)" 
  },

  // Section Cards
  section: { 
    background:"var(--bg-card)", border:"1px solid var(--border)", 
    borderRadius:16, padding:"14px 16px" 
  },
  catGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(76px, 1fr))", gap:8 },
  catBtn: { 
    display:"flex", flexDirection:"column", alignItems:"center", gap:4, 
    padding:"14px 8px 16px", borderRadius:16, cursor:"pointer", position:"relative", 
    fontFamily:"var(--font)", transition:"all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow:"var(--shadow-sm)"
  },
  
  // Saving animation overlay
  savingOverlay: {
    position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
    backdropFilter:"blur(8px)", zIndex:9000,
    display:"flex", alignItems:"center", justifyContent:"center", padding:20
  },
  savingCard: {
    background:"var(--bg-card)", border:"1px solid var(--border)",
    borderRadius:18, padding:"28px 34px", textAlign:"center",
    boxShadow:"var(--shadow-lg)", minWidth:240
  },
  successCard: {
    background:"var(--bg-card)", border:"1px solid var(--border)",
    borderRadius:20, padding:"24px", textAlign:"center",
    boxShadow:"var(--shadow-lg)", width:"min(320px, calc(100vw - 32px))"
  },
  spinnerWrap: {
    width:54, height:54, borderRadius:"50%", margin:"0 auto",
    display:"flex", alignItems:"center", justifyContent:"center",
    position:"relative", background:"var(--accent-subtle)"
  },
  spinnerRing: {
    position:"absolute", inset:0, borderRadius:"50%",
    border:"2px solid transparent", borderTopColor:"var(--accent)",
    borderRightColor:"var(--accent)"
  },
  successRing: {
    width:62, height:62, borderRadius:"50%", margin:"0 auto 14px",
    display:"flex", alignItems:"center", justifyContent:"center",
    background:"var(--green-bg)", border:"1px solid rgba(16,185,129,0.28)"
  },
  receiptPreview: {
    background:"var(--bg-input)", border:"1px solid var(--border)",
    borderRadius:14, padding:"14px 16px", display:"flex",
    flexDirection:"column", gap:3
  },
  receiptLabel: { fontSize:11, color:"var(--text-muted)", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em" },
  receiptAmount: { fontSize:22, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  receiptMeta: { fontSize:12, color:"var(--accent)", fontWeight:700 },
  successProgress: {
    height:4, width:"100%", background:"linear-gradient(90deg, var(--green), var(--accent))",
    borderRadius:4, marginTop:14, transformOrigin:"left"
  },
  savingBar: {
    width:"100%", height:4, background:"var(--border)",
    borderRadius:4, overflow:"hidden", marginTop:14
  },
  savingBarFill: {
    width:"70%", height:"100%", background:"linear-gradient(90deg, transparent, var(--accent), transparent)",
    borderRadius:4
  },
  
  noteInput: { 
    width:"100%", background:"var(--bg-input)", border:"none", 
    color:"var(--text-primary)", borderRadius:12, padding:"10px 14px 10px 36px", 
    fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" 
  },
  
  errorBox: { 
    background:"var(--red-bg)", border:"1px solid var(--red)", 
    color:"var(--red)", padding:"10px 14px", borderRadius:12, fontSize:12, 
    fontWeight:600, display:"flex", alignItems:"center", gap:8 
  },
  successBox: { 
    background:"var(--green-bg)", border:"1px solid var(--green)", 
    padding:"14px 18px", borderRadius:14, display:"flex", alignItems:"center", gap:12 
  },
  
  btnRow: { display:"flex", gap:10 },
  cancelBtn: { 
    flex:1, padding:"12px", background:"var(--bg-card)", 
    border:"1px solid var(--border)", color:"var(--text-secondary)", 
    borderRadius:12, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"var(--font)" 
  },
  saveBtn: { 
    flex:2, padding:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    background:"linear-gradient(135deg, var(--accent) 0%, #f97316 100%)", 
    backgroundSize:"200% auto",
    border:"none", color:"#111", borderRadius:12, cursor:"pointer", 
    fontSize:14, fontWeight:800, fontFamily:"var(--font)" 
  },
  
  tipsRow: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  tipCard: { 
    display:"flex", gap:8, alignItems:"center", 
    background:"var(--bg-card)", border:"1px solid var(--border)", 
    borderRadius:10, padding:"8px 10px", fontSize:11, color:"var(--text-muted)", 
    fontWeight:500, cursor:"default", transition:"all 0.25s ease" 
  },
};
