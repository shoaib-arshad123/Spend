import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateId, getAutoCategory } from "../utils/helpers";
import { getCategoryIcon, getCategoryColor, translations } from "../i18n/translations";
import { useApp } from "../context/AppContext";
import { ChevronLeft, Mic, Camera, Sparkles } from "lucide-react";
import VoiceButton from "./VoiceInput";
import BillScanner from "./BillScanner";

const CATS = ["Food & Dining", "Transportation", "Education", "Health & Fitness", "Entertainment", "Shopping", "Bills & Utilities", "Travel", "Other"];
const CAT_COLORS = { 
  "Food & Dining": "#f5b800", 
  "Transportation": "#3b82f6", 
  "Education": "#8b5cf6", 
  "Health & Fitness": "#10b981", 
  "Entertainment": "#ec4899", 
  "Shopping": "#f97316", 
  "Bills & Utilities": "#6366f1",
  "Travel": "#06b6d4",
  "Other": "#6b7280" 
};

export default function AddExpense({ t, lang, onAdd, setActiveTab }) {
  const { pushToast, categories } = useApp();
  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState(getAutoCategory());
  const [note,     setNote]     = useState("");
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [showScan, setShowScan] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));
  const [source, setSource] = useState("manual");

  const DEFAULT_COLOR = "#f5b800";
  const timeStr = new Date().toTimeString().slice(0,5);

  const handleVoice = ({ transcript, amount: va, category: vc }) => {
    if (va) setAmount(String(va));
    if (vc) setCategory(vc);
    if (transcript && !note) setNote(transcript);
    setSource("voice");
    pushToast({ type:"info", message:`🎙️ Got: PKR ${va||"?"} · ${vc}` });
  };

  const submit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    const result = await onAdd({ amount:Number(amount), category, description:note.trim(), date:selectedDate, source });
    
    if (result.success) {
      setSuccess(true);
      setAmount("");
      setNote("");
      setCategory(getAutoCategory());
      setError("");
      setTimeout(() => { setSuccess(false); setActiveTab("dashboard"); }, 1500);
    } else {
      setError(result.message || "Unable to save expense. Please try again.");
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <>
      <div style={AE.container}>
        {/* ── HEADER ── perfectly aligned back + title on one line */}
        <div style={AE.header}>
          <motion.button 
            style={AE.backCircle} 
            onClick={() => setActiveTab("dashboard")}
            whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
            whileTap={{ scale:0.9 }}
          >
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </motion.button>
          <div style={{ flex:1 }}>
            <h2 style={AE.heading}>{t.addNew}</h2>
          </div>
        </div>

        {/* ── DATE & TIME ROW ── */}
        <div style={AE.timeRow}>
          <div style={{ ...AE.timePill, padding: "2px 10px" }}>
            <span>📅</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              onClick={e => e.target.showPicker && e.target.showPicker()}
              style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, fontFamily: "var(--font)", outline: "none", cursor: "pointer" }}
            />
          </div>
          <div style={AE.timePill}><span>⏰</span>{timeStr}</div>
        </div>

        {/* ── AMOUNT INPUT ── */}
        <div style={AE.amountSection}>
          <label style={AE.label}>AMOUNT (PKR)</label>
          <div style={AE.amountBox}>
            <span style={AE.currency}>₨</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              placeholder="0"
              style={AE.amountInput}
              min="1"
              autoFocus
            />
          </div>
          {/* Quick amounts */}
          <div style={AE.quickRow}>
            {quickAmounts.map(q => (
              <motion.button key={q} style={AE.quickBtn} onClick={() => setAmount(String(q))} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>+{q}</motion.button>
            ))}
          </div>
          {amount && !isNaN(amount) && Number(amount) > 0 && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} style={AE.amountDisplay}>
              PKR {Number(amount).toLocaleString()}
            </motion.p>
          )}
        </div>

        {/* ── SMART INPUT: Voice & Scan ── Prominent action bar */}
        <div style={AE.smartInputBar}>
          <div style={AE.smartInputLeft}>
            <Sparkles size={16} color="var(--accent)" />
            <span style={AE.smartInputTitle}>Smart Input</span>
            <span style={AE.smartInputSub}>Use voice or camera</span>
          </div>
          <div style={AE.smartInputActions}>
            <motion.div
              animate={{ boxShadow: ["0 0 0 0px rgba(245,184,0,0.3)", "0 0 0 5px rgba(245,184,0,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ borderRadius: 12, display:"flex" }}
            >
              <VoiceButton onResult={handleVoice} />
            </motion.div>
            <motion.button 
              style={AE.scanBtn} 
              onClick={() => setShowScan(true)} 
              whileHover={{ scale:1.05 }} 
              whileTap={{ scale:0.95 }}
            >
              <Camera size={16} />
              <span>Scan</span>
            </motion.button>
          </div>
        </div>

        {/* ── CATEGORY SELECTOR ── */}
        <div style={AE.section}>
          <label style={AE.label}>CATEGORY</label>
          <div style={AE.catGrid}>
            {(Array.isArray(categories) && categories.length > 0 ? categories : [{id:'def', name: 'Other', icon: '📌'}]).filter(Boolean).map(cat => {
              const active = category === cat.name;
              const color = cat.color || getCategoryColor(cat.name);
              const icon = cat.icon || getCategoryIcon(cat.name) || "📦";
              return (
                <motion.button
                  key={cat.id || cat.name || Math.random()}
                  style={{ ...AE.catBtn, background: active ? color+"18" : "var(--bg-input)", border:`2px solid ${active ? color : "var(--border)"}`, color: active ? color : "var(--text-muted)" }}
                  onClick={() => setCategory(cat.name)}
                  whileHover={{ scale:1.04 }}
                  whileTap={{ scale:0.96 }}
                >
                  <span style={{ fontSize:22 }}>{icon}</span>
                  <span style={{ fontSize:10, fontWeight: active ? 800 : 500, textTransform:"capitalize", marginTop:2, lineHeight:1.2 }}>{cat.name}</span>
                  {active && <motion.div layoutId="catDot" style={{ position:"absolute", bottom:5, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:color }} />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── NOTE ── */}
        <div style={AE.section}>
          <label style={AE.label}>NOTE (OPTIONAL)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Canteen lunch, Rickshaw to university..."
            style={AE.noteInput}
            onKeyDown={e => e.key==="Enter" && submit()}
          />
        </div>

        {/* Error / Success */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={AE.errorBox}>
              ⚠️ {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} style={AE.successBox}>
              <span style={{ fontSize:24 }}>🎉</span>
              <div><p style={{ margin:0, fontWeight:700, color:"var(--green)" }}>Expense Added!</p>
              <p style={{ margin:0, fontSize:12, color:"var(--text-muted)" }}>Redirecting to dashboard...</p></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BUTTONS ── */}
        <div style={AE.btnRow}>
          <motion.button style={AE.cancelBtn} onClick={() => setActiveTab("dashboard")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t.cancel}</motion.button>
          <motion.button style={AE.saveBtn} onClick={submit} whileHover={{ scale:1.02, boxShadow:"0 0 20px rgba(245,184,0,0.3)" }} whileTap={{ scale:0.97 }}>
            💾 {t.save}
          </motion.button>
        </div>

        {/* ── TIPS ── */}
        <div style={AE.tipsGrid}>
          <div style={AE.tipCard}><span style={{ fontSize:16 }}>🎙️</span><span>Voice: "spent 200 on food"</span></div>
          <div style={AE.tipCard}><span style={{ fontSize:16 }}>📸</span><span>Scan receipt to auto-fill</span></div>
        </div>
      </div>

      <AnimatePresence>{showScan && <BillScanner onClose={() => setShowScan(false)} />}</AnimatePresence>
    </>
  );
}

const AE = {
  container:    { padding:"20px 16px", display:"flex", flexDirection:"column", gap:16, maxWidth:560, margin:"0 auto" },
  
  // Header - perfectly aligned row
  header:       { display:"flex", alignItems:"center", gap:14 },
  heading:      { margin:0, fontSize:24, fontWeight:900, background:"linear-gradient(135deg, var(--accent), #f97316)", backgroundClip:"text", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.5px" },
  backCircle:   { width:40, height:40, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", backdropFilter:"blur(12px)", flexShrink:0 },
  
  // Date/Time
  timeRow:      { display:"flex", gap:10, flexWrap:"wrap" },
  timePill:     { display:"flex", alignItems:"center", gap:6, background:"var(--bg-card)", border:"1px solid var(--border)", padding:"8px 14px", borderRadius:20, fontSize:13, color:"var(--text-secondary)", fontWeight: 600, backdropFilter:"blur(12px)" },
  
  // Amount
  amountSection:{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, padding:20, backdropFilter:"blur(12px)" },
  label:        { display:"block", fontSize:11, color:"var(--text-muted)", fontWeight:800, letterSpacing:"0.12em", marginBottom:12 },
  amountBox:    { display:"flex", alignItems:"center", gap:10, marginBottom:16 },
  currency:     { fontSize:32, color:"var(--accent)", fontWeight:800, flexShrink:0 },
  amountInput:  { flex:1, background:"transparent", border:"none", color:"var(--text-primary)", fontSize:42, fontWeight:900, outline:"none", letterSpacing:"-1px", fontFamily:"var(--font)", minWidth:0 },
  quickRow:     { display:"flex", gap:10, flexWrap:"wrap" },
  quickBtn:     { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--font)" },
  amountDisplay:{ margin:"12px 0 0", fontSize:14, color:"var(--accent)", fontWeight:700 },
  
  // Smart Input Bar (Voice + Scan)
  smartInputBar: { 
    display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
    background:"linear-gradient(135deg, rgba(245,184,0,0.08), rgba(249,115,22,0.06))", 
    border:"1px solid var(--accent-glow, rgba(245,184,0,0.25))", 
    borderRadius:16, padding:"14px 18px",
    backdropFilter:"blur(12px)"
  },
  smartInputLeft: { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  smartInputTitle: { fontSize:14, fontWeight:800, color:"var(--text-primary)" },
  smartInputSub: { fontSize:11, color:"var(--text-muted)", fontWeight:500 },
  smartInputActions: { display:"flex", alignItems:"center", gap:10, flexShrink:0 },
  scanBtn:      { display:"flex", alignItems:"center", gap:6, background:"var(--blue-bg)", border:"1px solid var(--blue)", color:"var(--blue)", padding:"10px 16px", borderRadius:12, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--font)" },

  // Category
  section:      { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, padding:"16px 20px", backdropFilter:"blur(12px)" },
  catGrid:      { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(75px, 1fr))", gap:10 },
  catBtn:       { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 6px", borderRadius:14, cursor:"pointer", position:"relative", fontFamily:"var(--font)" },
  
  // Note
  noteInput:    { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:14, padding:"12px 16px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" },
  
  // Feedback
  errorBox:     { background:"var(--red-bg)", border:"1px solid var(--red)", color:"var(--red)", padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight: 600 },
  successBox:   { background:"var(--green-bg)", border:"1px solid var(--green)", padding:"16px 20px", borderRadius:16, display:"flex", alignItems:"center", gap:14 },
  
  // Buttons
  btnRow:       { display:"flex", gap:12, marginTop: 4 },
  cancelBtn:    { flex:1, padding:"14px", background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:14, cursor:"pointer", fontSize:15, fontWeight:600, fontFamily:"var(--font)", backdropFilter:"blur(12px)" },
  saveBtn:      { flex:2, padding:"14px", background:"linear-gradient(135deg,#f5b800,#ffd04a)", border:"none", color:"#111", borderRadius:14, cursor:"pointer", fontSize:15, fontWeight:800, fontFamily:"var(--font)" },
  
  // Tips
  tipsGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop: 4 },
  tipCard:      { display:"flex", gap:10, alignItems:"center", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"12px 14px", fontSize:12, color:"var(--text-muted)", backdropFilter:"blur(12px)", fontWeight: 500 },
};
