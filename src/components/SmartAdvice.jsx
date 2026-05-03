import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatPKR, getPredictionDays, getSmartAdvice } from "../utils/helpers";
import { getCategoryColor, getCategoryIcon } from "../i18n/translations";
import { useApp } from "../context/AppContext";

const SAVING_TIPS = {
  en: [
    { icon:"🍱", tip:"Pack lunch from home. Canteen costs 3-4x more per meal." },
    { icon:"🚶", tip:"Walk short distances instead of taking rickshaws — saves daily." },
    { icon:"📚", tip:"Borrow books from library instead of buying every semester." },
    { icon:"📵", tip:"Reduce mobile top-ups. Use Wi-Fi where possible." },
    { icon:"☕", tip:"Limit café visits. Make tea at home and save PKR 200+ daily." },
    { icon:"🛒", tip:"Buy groceries weekly in bulk — cheaper than daily shopping." },
  ],
  ur: [
    { icon:"🍱", tip:"گھر سے کھانا لے جائیں۔ کینٹین میں 3-4 گنا زیادہ خرچ ہوتا ہے۔" },
    { icon:"🚶", tip:"قریبی فاصلے پیدل طے کریں — روزانہ بچت ہوگی۔" },
    { icon:"📚", tip:"کتابیں لائبریری سے لیں — ہر سمسٹر خریدنے کی ضرورت نہیں۔" },
    { icon:"📵", tip:"موبائل ریچارج کم کریں۔ جہاں ممکن ہو وائی فائی استعمال کریں۔" },
    { icon:"☕", tip:"چائے گھر بنائیں — روزانہ PKR 200+ کی بچت ہوگی۔" },
    { icon:"🛒", tip:"ہفتہ وار خریداری کریں — روزانہ کی نسبت سستی پڑتی ہے۔" },
  ],
};

const AI_LABELS = {
  en:{ title:"🧠 AI Spending Analysis", empty:"Add more expenses so the AI can analyze your patterns.", insight:"Key Insight" },
  ur:{ title:"🧠 AI خرچ تجزیہ", empty:"AI تجزیہ کے لیے مزید اخراجات شامل کریں۔", insight:"اہم بات" },
};

export default function SmartAdvice({ t, lang, expenses, budget, setActiveTab }) {
  const { pushNotification } = useApp();
  const notifiedAdvice = useRef(false);
  const adviceList = getSmartAdvice(expenses, lang);
  const predDays   = getPredictionDays(expenses, budget);
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const remaining  = budget - totalSpent;
  const tips       = SAVING_TIPS[lang] || SAVING_TIPS.en;
  const ai         = AI_LABELS[lang] || AI_LABELS.en;

  const catMap = {};
  expenses.forEach(e=>{ catMap[e.category]=(catMap[e.category]||0)+e.amount; });
  const sortedCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);

  // AI score (0-100)
  const aiScore = budget>0 ? Math.max(0, Math.round(100 - (totalSpent/budget)*80)) : 50;
  const aiScoreColor = aiScore>=70?"var(--green)":aiScore>=40?"var(--accent)":"var(--red)";
  const aiScoreLabel = aiScore>=70?"Excellent 🏆":aiScore>=40?"Moderate ⚖️":"Needs Work ⚠️";

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastAiNotif = localStorage.getItem("last_notified_ai");

    if (adviceList.length > 0 && lastAiNotif !== today) {
      localStorage.setItem("last_notified_ai", today);
      pushNotification({
        title: "AI Spending Insight 🧠",
        message: adviceList[0], 
        type: "info",
        icon: "🧠"
      });
    }
  }, [adviceList, pushNotification]);

  return (
    <div style={SA.container}>
      {/* Header with Back */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <motion.button 
          style={SA.backCircle} 
          onClick={() => setActiveTab("dashboard")}
          whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
          whileTap={{ scale:0.9 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </motion.button>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>{ai.title}</h2>
      </div>

      {/* Prediction banner */}
      {predDays !== null && (
        <motion.div
          initial={{ opacity:0, y:-8 }}
          animate={{ opacity:1, y:0 }}
          style={{ ...SA.predBanner, background: predDays<5?"var(--red-bg)":predDays<10?"var(--accent-subtle)":"var(--green-bg)", borderColor: predDays<5?"var(--red)":predDays<10?"var(--accent)":"var(--green)" }}
        >
          <span style={{ fontSize:24 }}>{predDays<5?"🚨":predDays<10?"⚡":"✅"}</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>
              {predDays<1 ? (lang==="ur"?"بجٹ ختم ہو گیا!" : "Budget exhausted!") : lang==="ur" ? `بجٹ تقریباً ${predDays} دن اور چلے گا` : `Budget will last approximately ${predDays} more days`}
            </p>
            <p style={{ margin:0, fontSize:12, color:"var(--text-muted)" }}>{formatPKR(Math.max(remaining,0))} remaining · {formatPKR(budget)} total budget</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <span style={{ fontSize:22, fontWeight:800, color: predDays<5?"var(--red)":predDays<10?"var(--accent)":"var(--green)" }}>{predDays}d</span>
          </div>
        </motion.div>
      )}

      {/* AI score card */}
      <motion.div style={SA.card} whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
        <h3 style={SA.cardTitle}>{ai.title}</h3>
        {expenses.length < 3 ? (
          <p style={{ color:"var(--text-muted)", fontSize:13, textAlign:"center", padding:"12px 0" }}>{ai.empty}</p>
        ) : (
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            {/* Score circle */}
            <div style={SA.scoreCircle}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="45" cy="45" r="36" fill="none" stroke={aiScoreColor} strokeWidth="6"
                  strokeDasharray={`${2*Math.PI*36*aiScore/100} ${2*Math.PI*36}`}
                  strokeLinecap="round" strokeDashoffset={2*Math.PI*36*0.25} style={{ transition:"stroke-dasharray 1s ease" }} />
                <text x="45" y="48" textAnchor="middle" fontSize="18" fontWeight="800" fill={aiScoreColor}>{aiScore}</text>
              </svg>
              <p style={{ margin:"4px 0 0", fontSize:11, color:aiScoreColor, fontWeight:700, textAlign:"center" }}>{aiScoreLabel}</p>
            </div>
            {/* Advice list */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
              {adviceList.map((a,i) => (
                <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }} style={SA.adviceItem}>
                  <span style={{ fontSize:14, flexShrink:0 }}>💬</span>
                  <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)", lineHeight:1.5 }}>{a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Category spending breakdown */}
      {sortedCats.length > 0 && (
        <motion.div style={SA.card} whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
          <h3 style={SA.cardTitle}>📊 Spending Breakdown</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {sortedCats.map(([cat, amt], i) => {
              const pct = totalSpent>0 ? Math.round((amt/totalSpent)*100) : 0;
              const barColors = ["#f5b800","#3b82f6","#8b5cf6","#10b981","#ec4899","#f97316","#6b7280"];
              return (
                <div key={cat} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18, width:24, flexShrink:0 }}>{getCategoryIcon(cat)||"📦"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, color:"var(--text-primary)", textTransform:"capitalize" }}>{cat}</span>
                      <span style={{ fontSize:12, color:"var(--text-muted)" }}>{pct}% · {formatPKR(amt)}</span>
                    </div>
                    <div style={{ height:5, background:"var(--border)", borderRadius:3 }}>
                      <motion.div
                        style={{ height:"100%", borderRadius:3, background:barColors[i%barColors.length] }}
                        initial={{ width:0 }}
                        animate={{ width:`${pct}%` }}
                        transition={{ duration:0.8, delay:i*0.08 }}
                      />
                    </div>
                  </div>
                  {i===0 && <span style={{ fontSize:10, background:"var(--red-bg)", color:"var(--red)", padding:"2px 6px", borderRadius:6, fontWeight:700, flexShrink:0 }}>TOP</span>}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Saving tips */}
      <motion.div style={SA.card} whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
        <h3 style={SA.cardTitle}>💡 {lang==="ur"?"بچت کے مشورے":"Saving Tips for Students"}</h3>
        <div style={SA.tipsGrid}>
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              style={SA.tipCard}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.07 }}
              whileHover={{ y:-3 }}
            >
              <span style={{ fontSize:24, display:"block", marginBottom:8 }}>{tip.icon}</span>
              <p style={{ margin:0, fontSize:12, color:"var(--text-secondary)", lineHeight:1.6 }}>{tip.tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Weekly pattern insight */}
      {expenses.length >= 5 && (
        <motion.div style={SA.card} whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 300 }}>
          <h3 style={SA.cardTitle}>⏱ Spending Pattern</h3>
          <div style={SA.patternGrid}>
            {getHourlyPattern(expenses).map((h, i) => (
              <div key={i} style={SA.patternBar}>
                <div style={SA.patternTrack}>
                  <motion.div
                    style={{ width:"100%", borderRadius:3, background: h.isTop?"var(--accent)":"var(--blue)", marginTop:"auto" }}
                    initial={{ height:0 }}
                    animate={{ height:`${h.pct}%` }}
                    transition={{ duration:0.6, delay:i*0.04 }}
                  />
                </div>
                <span style={{ fontSize:9, color:"var(--text-muted)", textAlign:"center" }}>{h.label}</span>
              </div>
            ))}
          </div>
          <p style={{ margin:"8px 0 0", fontSize:12, color:"var(--text-muted)" }}>
            🔔 Your peak spending time is {getPeakHour(expenses)}. Set a reminder to review before spending then.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getHourlyPattern(expenses) {
  const hours = Array.from({length:12}, (_,i) => ({ label:`${(i*2).toString().padStart(2,"0")}h`, count:0 }));
  expenses.forEach(e => {
    const h = parseInt(e.time?.split(":")?.[0]||12);
    hours[Math.min(Math.floor(h/2),11)].count++;
  });
  const max = Math.max(...hours.map(h=>h.count),1);
  return hours.map(h => ({ ...h, pct:Math.round((h.count/max)*100), isTop:h.count===max && h.count>0 }));
}

function getPeakHour(expenses) {
  const h = {};
  expenses.forEach(e=>{ const hr=parseInt(e.time?.split(":")?.[0]||12); h[hr]=(h[hr]||0)+1; });
  const peak = Object.entries(h).sort((a,b)=>b[1]-a[1])[0];
  if (!peak) return "N/A";
  const hr = parseInt(peak[0]);
  const ampm = hr>=12?"PM":"AM";
  return `${hr%12||12}:00 ${ampm}`;
}

const SA = {
  container:   { padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 720, margin: "0 auto" },
  predBanner:  { display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 20, border: "1px solid", backdropFilter: "blur(12px)" },
  card:        { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "20px 24px", backdropFilter: "blur(12px)" },
  cardTitle:   { margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  tipLabel:    { fontSize: 11, fontWeight: 800, color: "var(--accent)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" },
  backCircle:  { width: 38, height: 38, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" },
  scoreCircle: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  adviceItem:  { display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-input)", borderRadius: 12, padding: "12px 14px" },
  tipsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  tipCard:     { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px", cursor: "default", transition: "transform 0.2s" },
  patternGrid: { display: "flex", gap: 4, alignItems: "flex-end", height: 60 },
  patternBar:  { flex: 1, display: "flex", flexDirection: "column", gap: 4, height: "100%" },
  patternTrack:{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" },
};
