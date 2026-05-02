import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateId, getAutoCategory } from "../utils/helpers";
import { getCategoryIcon, getCategoryColor, translations } from "../i18n/translations";
import { useApp } from "../context/AppContext";
import { ChevronLeft } from "lucide-react";
import VoiceButton from "./VoiceInput";
import BillScanner from "./BillScanner";

const CATS = ["food","transport","books","health","entertainment","clothing","savings","other"];
const CAT_COLORS = { food:"#f59e0b", transport:"#3b82f6", books:"#8b5cf6", health:"#10b981", entertainment:"#ec4899", clothing:"#f97316", savings:"#10b981", other:"#6b7280" };

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

  // Default color for categories if not specified
  const DEFAULT_COLOR = "#f59e0b";

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
        {/* Header */}
        <div style={AE.pageHeader}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <motion.button 
              style={AE.backCircle} 
              onClick={() => setActiveTab("dashboard")}
              whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
              whileTap={{ scale:0.9 }}
            >
              <ChevronLeft size={20} color="var(--text-secondary)" />
            </motion.button>
            <div>
              <h2 style={AE.heading}>{t.addNew}</h2>
              <p style={AE.headingSub}>Track every rupee to build financial awareness</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ 
                  position: "absolute", 
                  top: -20, 
                  right: -10, 
                  background: "var(--accent)", 
                  color: "#111", 
                  fontSize: 9, 
                  fontWeight: 900, 
                  padding: "2px 6px", 
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
                  zIndex: 2
                }}
              >
                TRY VOICE! 🎙️
              </motion.div>
              <motion.div
                animate={{ boxShadow: ["0 0 0 0px rgba(245,158,11,0.2)", "0 0 0 6px rgba(245,158,11,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ borderRadius: 9 }}
              >
                <VoiceButton onResult={handleVoice} />
              </motion.div>
            </div>
            <motion.button style={AE.scanBtn} onClick={() => setShowScan(true)} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
              📸 Scan Bill
            </motion.button>
          </div>
        </div>

        {/* Time and Date row */}
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

        {/* Amount input */}
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

        {/* Category selector */}
        <div style={AE.section}>
          <label style={AE.label}>CATEGORY</label>
          <div style={AE.catGrid}>
            {(categories.length > 0 ? categories : [{name: 'Other'}]).map(cat => {
              const active = category === cat.name;
              const color = cat.color || getCategoryColor(cat.name);
              const icon = cat.icon || getCategoryIcon(cat.name) || "📦";
              return (
                <motion.button
                  key={cat.name}
                  style={{ ...AE.catBtn, background: active ? color+"18" : "var(--bg-input)", border:`1px solid ${active ? color : "var(--border)"}`, color: active ? color : "var(--text-muted)" }}
                  onClick={() => setCategory(cat.name)}
                  whileHover={{ scale:1.04 }}
                  whileTap={{ scale:0.96 }}
                >
                  <span style={{ fontSize:22 }}>{icon}</span>
                  <span style={{ fontSize:11, fontWeight: active ? 700 : 400, textTransform:"capitalize" }}>{cat.name}</span>
                  {active && <motion.div layoutId="catDot" style={{ position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:color }} />}
                </motion.button>
              );
            })}
          </div>
        </div>


        {/* Note */}
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

        {/* Buttons */}
        <div style={AE.btnRow}>
          <motion.button style={AE.cancelBtn} onClick={() => setActiveTab("dashboard")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t.cancel}</motion.button>
          <motion.button style={AE.saveBtn} onClick={submit} whileHover={{ scale:1.02, boxShadow:"0 0 20px rgba(245,158,11,0.3)" }} whileTap={{ scale:0.97 }}>
            💾 {t.save}
          </motion.button>
        </div>

        {/* Tips bar */}
        <div style={AE.tipsGrid}>
          <div style={AE.tipCard}><span>🎙️</span><span>Voice: "spent 200 on food"</span></div>
          <div style={AE.tipCard}><span>📸</span><span>Scan receipt to auto-fill</span></div>
        </div>
      </div>

      <AnimatePresence>{showScan && <BillScanner onClose={() => setShowScan(false)} />}</AnimatePresence>
    </>
  );
}

const AE = {
  container:    { padding:20, display:"flex", flexDirection:"column", gap:18, maxWidth:540, margin:"0 auto" },
  pageHeader:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" },
  heading:      { margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  headingSub:   { margin:"3px 0 0", fontSize:12, color:"var(--text-muted)" },
  scanBtn:      { background:"var(--blue-bg)", border:"1px solid var(--blue)", color:"var(--blue)", padding:"9px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"var(--font)" },
  timeRow:      { display:"flex", gap:8, flexWrap:"wrap" },
  timePill:     { display:"flex", alignItems:"center", gap:5, background:"var(--bg-card)", border:"1px solid var(--border)", padding:"6px 12px", borderRadius:20, fontSize:12, color:"var(--text-secondary)" },
  amountSection:{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:20 },
  label:        { display:"block", fontSize:10, color:"var(--text-muted)", fontWeight:800, letterSpacing:"0.1em", marginBottom:10 },
  amountBox:    { display:"flex", alignItems:"center", gap:8, marginBottom:14 },
  currency:     { fontSize:28, color:"var(--accent)", fontWeight:700, flexShrink:0 },
  amountInput:  { flex:1, background:"transparent", border:"none", color:"var(--text-primary)", fontSize:40, fontWeight:800, outline:"none", letterSpacing:"-1px", fontFamily:"var(--font)" },
  quickRow:     { display:"flex", gap:8, flexWrap:"wrap" },
  quickBtn:     { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"5px 12px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"var(--font)" },
  amountDisplay:{ margin:"10px 0 0", fontSize:13, color:"var(--accent)", fontWeight:600 },
  section:      { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px" },
  catGrid:      { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 },
  catBtn:       { display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"12px 6px", borderRadius:12, cursor:"pointer", position:"relative", fontFamily:"var(--font)" },
  categoryBtn:  { display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"12px 6px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", transition:"0.2s" },
  catIcon:      { fontSize:20 },
  catLabel:     { fontSize:11, fontWeight:600, textTransform:"capitalize" },
  backCircle:   { width:36, height:36, borderRadius:"50%", background:"var(--bg-input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  noteInput:    { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:10, padding:"12px 14px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" },
  errorBox:     { background:"var(--red-bg)", border:"1px solid var(--red)", color:"var(--red)", padding:"10px 14px", borderRadius:8, fontSize:13 },
  successBox:   { background:"var(--green-bg)", border:"1px solid var(--green)", padding:"14px 18px", borderRadius:12, display:"flex", alignItems:"center", gap:12 },
  btnRow:       { display:"flex", gap:10 },
  cancelBtn:    { flex:1, padding:"13px", background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:500, fontFamily:"var(--font)" },
  saveBtn:      { flex:2, padding:"13px", background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"var(--font)" },
  tipsGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  tipCard:      { display:"flex", gap:8, alignItems:"center", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"var(--text-muted)" },
};
