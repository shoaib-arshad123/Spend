import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Volume2 } from "lucide-react";

const CAT_KEYWORDS = {
  "Food & Dining": ["food", "eat", "lunch", "dinner", "breakfast", "canteen", "restaurant", "snack", "pizza", "burger", "shawarma", "kfc", "mcdonald", "tea", "coffee", "milk", "grocery", "fruit", "vegetable"],
  "Transportation": ["transport", "bus", "rickshaw", "uber", "taxi", "fare", "travel", "petrol", "fuel", "ride", "auto", "bike", "car", "indriver", "bykea", "train", "metro"],
  "Education": ["book", "books", "stationery", "pen", "pencil", "copies", "notebook", "library", "study", "notes", "fee", "tuition", "course", "exam", "university", "college", "school"],
  "Health & Fitness": ["medicine", "medical", "health", "doctor", "pharmacy", "hospital", "tablet", "paracetamol", "treatment", "clinic", "gym", "fitness", "vitamin", "dentist"],
  "Entertainment": ["entertainment", "game", "movie", "cinema", "fun", "outing", "mobile", "internet", "recharge", "top-up", "netflix", "youtube", "pubg", "gaming", "data", "wifi"],
  "Shopping": ["clothes", "clothing", "shirt", "shoes", "dress", "jeans", "socks", "belt", "fashion", "kurta", "mall", "shopping", "bag", "watch", "makeup"],
  "Bills & Utilities": ["bill", "electricity", "water", "gas", "utility", "rent", "maintenance", "wapda", "ptcl", "internet bill"],
  "Travel": ["hotel", "flight", "trip", "vacation", "tour", "ticket", "northern", "tourism"],
};

function detectCat(text) {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    if (kws.some(k => lower.includes(k.toLowerCase()))) return cat;
  }
  return "Other";
}

function extractAmt(text) {
  const pats = [
    /(\d+)\s*(rupees?|pkr|rs)/i,
    /(rupees?|pkr|rs)\s*(\d+)/i,
    /spent\s+(\d+)/i,
    /add\s+(\d+)/i,
    /for\s+(\d+)/i,
    /(\d{2,6})/
  ];
  for (const p of pats) { 
    const m = text.match(p); 
    if (m) {
      const val = m[1].match(/\d/) ? m[1] : m[2];
      return parseInt(val);
    } 
  }
  return null;
}

export default function VoiceButton({ onResult }) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported. Please use Chrome."); return; }
    setError(""); setTranscript("");
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(t);
      if (e.results[e.results.length-1].isFinal) {
        const amount = extractAmt(t);
        const category = detectCat(t);
        onResult({ transcript:t, amount, category });
        setListening(false);
        setTimeout(() => setOpen(false), 1200);
      }
    };
    rec.onerror = e => { setError(`Error: ${e.error}. Try again.`); setListening(false); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
  }, [onResult]);

  const stop = () => { recRef.current?.stop(); setListening(false); };

  // The overlay modal - rendered via Portal to escape any stacking context
  const voiceModal = open ? createPortal(
    <AnimatePresence>
      <motion.div
        key="voice-overlay"
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        exit={{ opacity:0 }}
        style={VB.overlay}
        onClick={(e) => { if (e.target === e.currentTarget) { stop(); setOpen(false); }}}
      >
        <motion.div
          initial={{ opacity:0, y:40, scale:0.92 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:40, scale:0.92 }}
          transition={{ duration:0.35, type:"spring", damping:22, stiffness:300 }}
          style={VB.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient */}
          <div style={VB.modalOrb} />
          <div style={VB.modalOrbBlue} />
          
          {/* Header */}
          <div style={VB.modalHeader}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <motion.div
                animate={listening ? { scale:[1,1.15,1] } : {}}
                transition={listening ? { duration:0.8, repeat:Infinity } : {}}
                style={VB.headerIcon}
              >
                {listening ? <Volume2 size={18} color="var(--red)" /> : <Mic size={18} color="var(--accent)" />}
              </motion.div>
              <div>
                <h3 style={VB.modalTitle}>{listening ? "Listening..." : "Voice Input"}</h3>
                <p style={VB.modalSub}>{listening ? "Speak clearly into your mic" : "Tap the mic to start"}</p>
              </div>
            </div>
            <motion.button 
              style={VB.closeBtn}
              onClick={() => { stop(); setOpen(false); }}
              whileHover={{ scale:1.15, background:"rgba(255,255,255,0.1)" }}
              whileTap={{ scale:0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Mic Button - Central Hero */}
          <div style={VB.micSection}>
            {listening ? (
              // Audio Wave Visualizer
              <div style={VB.waveContainer}>
                <motion.div
                  animate={{ boxShadow:["0 0 0 0px rgba(239,68,68,0.3)","0 0 0 20px rgba(239,68,68,0)","0 0 0 0px rgba(239,68,68,0.3)"] }}
                  transition={{ duration:1.5, repeat:Infinity }}
                  style={VB.micBtnListening}
                  onClick={stop}
                >
                  <MicOff size={28} color="#fff" />
                </motion.div>
                <div style={VB.waveBars}>
                  {[0,1,2,3,4,5,6,7,8].map(i => (
                    <motion.div 
                      key={i} 
                      style={VB.waveBar}
                      animate={{ height:[6, 18 + Math.random()*16, 6], opacity:[0.5,1,0.5] }}
                      transition={{ duration:0.4 + Math.random()*0.3, repeat:Infinity, delay:i*0.06 }} 
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.button
                style={VB.micBtn}
                onClick={start}
                whileHover={{ scale:1.08, boxShadow:"0 0 30px rgba(245,184,0,0.3)" }}
                whileTap={{ scale:0.95 }}
                animate={{ boxShadow:["0 0 0 0px rgba(245,184,0,0.2)","0 0 0 16px rgba(245,184,0,0)"] }}
                transition={{ duration:2, repeat:Infinity }}
              >
                <Mic size={30} color="#111" />
              </motion.button>
            )}
            <p style={VB.micLabel}>{listening ? "Tap to stop" : "Tap to speak"}</p>
          </div>

          {/* Examples */}
          <div style={VB.examplesCard}>
            <p style={VB.examplesTitle}>💡 Try saying:</p>
            <div style={VB.examplesList}>
              {['"Spent 200 on food"', '"Add 500 rupees transport"', '"120 canteen lunch"'].map((e, i) => (
                <motion.div 
                  key={i} style={VB.exampleItem}
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.1 + i*0.08 }}
                >
                  <span style={VB.exampleDot} />
                  <span>{e}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transcript Result */}
          <AnimatePresence>
            {transcript && (
              <motion.div 
                initial={{ opacity:0, y:8, scale:0.96 }} 
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8 }}
                style={VB.transcriptCard}
              >
                <div style={VB.transcriptHeader}>
                  <Volume2 size={13} color="var(--accent)" />
                  <span style={VB.transcriptLabel}>Detected</span>
                </div>
                <p style={VB.transcriptText}>"{transcript}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={VB.errorText}
            >
              ⚠️ {error}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <motion.button
        style={{ 
          ...VB.triggerBtn, 
          background: listening ? "var(--red-bg)" : "var(--accent-subtle)", 
          border: `1px solid ${listening ? "var(--red)" : "var(--accent)"}`, 
          color: listening ? "var(--red)" : "var(--accent)" 
        }}
        onClick={() => { if (!open) { setOpen(true); start(); } else { stop(); setOpen(false); } }}
        whileHover={{ scale:1.08, boxShadow:"0 0 14px rgba(245,184,0,0.12)" }}
        whileTap={{ scale:0.92 }}
        animate={listening ? { boxShadow:["0 0 0 0px rgba(239,68,68,0.3)","0 0 0 8px rgba(239,68,68,0)"] } : {}}
        transition={listening ? { duration:1, repeat:Infinity } : { duration:0.2 }}
      >
        {listening ? <MicOff size={13} /> : <Mic size={13} />}
        <span style={{ fontSize:11, fontWeight:700 }}>{listening ? "Stop" : "Voice"}</span>
      </motion.button>
      {voiceModal}
    </>
  );
}

const VB = {
  // Trigger Button
  triggerBtn: { 
    display:"flex", alignItems:"center", gap:5, padding:"7px 12px", 
    borderRadius:10, cursor:"pointer", fontFamily:"var(--font)" 
  },
  
  // Full-screen Overlay via Portal
  overlay: { 
    position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", 
    backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
    zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 
  },
  
  // Modal
  modal: { 
    width:"100%", maxWidth:380, background:"var(--bg-card)", 
    border:"1px solid var(--border)", borderRadius:24, 
    padding:"24px", boxShadow:"var(--shadow-lg)",
    position:"relative", overflow:"hidden"
  },
  modalOrb: {
    position:"absolute", top:-50, right:-50, width:140, height:140, borderRadius:"50%",
    background:"radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)", pointerEvents:"none"
  },
  modalOrbBlue: {
    position:"absolute", bottom:-40, left:-40, width:120, height:120, borderRadius:"50%",
    background:"radial-gradient(circle, var(--blue-bg) 0%, transparent 70%)", pointerEvents:"none"
  },
  
  // Header
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, position:"relative", zIndex:1 },
  headerIcon: { 
    width:36, height:36, borderRadius:10, 
    background:"var(--accent-subtle)", border:"1px solid var(--accent-glow)",
    display:"flex", alignItems:"center", justifyContent:"center" 
  },
  modalTitle: { margin:0, fontSize:16, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.3px" },
  modalSub: { margin:0, fontSize:11, color:"var(--text-muted)", fontWeight:500 },
  closeBtn: { 
    width:34, height:34, borderRadius:"50%", background:"transparent", 
    border:"none", color:"var(--text-muted)", cursor:"pointer", 
    display:"flex", alignItems:"center", justifyContent:"center" 
  },
  
  // Mic
  micSection: { display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 0 20px", position:"relative", zIndex:1 },
  micBtn: { 
    width:72, height:72, borderRadius:"50%", 
    background:"linear-gradient(135deg, #f5b800 0%, #ffd04a 100%)", 
    border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
    boxShadow:"0 8px 30px rgba(245,184,0,0.25)"
  },
  micBtnListening: {
    width:72, height:72, borderRadius:"50%", 
    background:"linear-gradient(135deg, #ef4444 0%, #f87171 100%)", 
    border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
  },
  micLabel: { fontSize:12, color:"var(--text-muted)", marginTop:10, fontWeight:500 },
  
  // Wave
  waveContainer: { display:"flex", flexDirection:"column", alignItems:"center", gap:12 },
  waveBars: { display:"flex", alignItems:"center", gap:3, height:36 },
  waveBar: { width:4, borderRadius:4, background:"linear-gradient(180deg, var(--red), rgba(239,68,68,0.4))" },
  
  // Examples
  examplesCard: { 
    background:"var(--bg-input)", border:"1px solid var(--border)", 
    borderRadius:14, padding:"14px 16px", marginBottom:14, position:"relative", zIndex:1 
  },
  examplesTitle: { margin:"0 0 8px", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em" },
  examplesList: { display:"flex", flexDirection:"column", gap:6 },
  exampleItem: { display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--accent)", fontStyle:"italic", fontWeight:500 },
  exampleDot: { width:4, height:4, borderRadius:"50%", background:"var(--accent)", flexShrink:0, opacity:0.5 },
  
  // Transcript
  transcriptCard: { 
    background:"var(--accent-subtle)", border:"1px solid var(--accent-glow)", 
    borderRadius:14, padding:"12px 16px", position:"relative", zIndex:1 
  },
  transcriptHeader: { display:"flex", alignItems:"center", gap:6, marginBottom:4 },
  transcriptLabel: { fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" },
  transcriptText: { margin:0, fontSize:14, color:"var(--text-primary)", fontWeight:600, fontStyle:"italic", lineHeight:1.4 },
  
  errorText: { color:"var(--red)", fontSize:12, margin:"10px 0 0", fontWeight:600, textAlign:"center", position:"relative", zIndex:1 },
};
