import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAT_KEYWORDS = {
  "Food & Dining": ["food", "eat", "lunch", "dinner", "breakfast", "canteen", "restaurant", "chai", "khana", "snack", "biryani", "roti", "pizza", "burger", "shawarma", "kfc", "mcdonald", "samosa", "tea", "coffee", "milk", "grocery", "fruit", "vegetable"],
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
  // Try to find numbers followed by currency or just numbers in context
  const pats = [
    /(\d+)\s*(rupees?|pkr|rs)/i,
    /(rupees?|pkr|rs)\s*(\d+)/i,
    /spent\s+(\d+)/i,
    /add\s+(\d+)/i,
    /for\s+(\d+)/i,
    /(\d{2,6})/ // Catch any 2-6 digit number as a fallback
  ];
  for (const p of pats) { 
    const m = text.match(p); 
    if (m) {
      // Return the group that contains the digits
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
    if (!SR) { setError("Voice not supported in this browser. Use Chrome."); return; }
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

  return (
    <div style={{ position:"relative" }}>
      <motion.button
        style={{ ...VB.btn, background: listening ? "var(--red-bg)" : "var(--bg-input)", border:`1px solid ${listening ? "var(--red)" : "var(--border)"}`, color: listening ? "var(--red)" : "var(--text-secondary)" }}
        onClick={() => { if (!open) { setOpen(true); start(); } else { stop(); setOpen(false); } }}
        whileTap={{ scale:0.95 }}
        animate={listening ? { boxShadow:["0 0 0 0px rgba(239,68,68,0.3)","0 0 0 8px rgba(239,68,68,0)"] } : {}}
        transition={listening ? { duration:1, repeat:Infinity } : {}}
      >
        <span>{listening ? "⏹" : "🎙️"}</span>
        <span style={{ fontSize:12 }}>{listening ? "Stop" : "Voice"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:8 }}
            style={VB.panel}
          >
            <button style={VB.close} onClick={() => { stop(); setOpen(false); }}>✕</button>
            <p style={VB.panelTitle}>{listening ? "🎤 Listening..." : "🎙️ Voice Input"}</p>
            <div style={VB.examples}>
              <p style={{ margin:"0 0 4px", fontSize:10, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Try saying:</p>
              {['"Spent 200 on food"','"Add 500 rupees transport"','"120 canteen lunch"'].map(e => (
                <div key={e} style={VB.example}>{e}</div>
              ))}
            </div>
            {listening && (
              <div style={{ display:"flex", justifyContent:"center", gap:3, margin:"12px 0 8px" }}>
                {[0,1,2,3,4].map(i => (
                  <motion.div key={i} style={{ width:3, background:"var(--red)", borderRadius:2 }}
                    animate={{ height:[6,18+i*4,6] }}
                    transition={{ duration:0.5, repeat:Infinity, delay:i*0.08 }} />
                ))}
              </div>
            )}
            {transcript && (
              <div style={VB.transcript}>
                <span style={{ fontSize:10, color:"var(--text-muted)" }}>Heard:</span>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"var(--text-primary)", fontStyle:"italic" }}>"{transcript}"</p>
              </div>
            )}
            {error && <p style={{ color:"var(--red)", fontSize:12, margin:"8px 0 0" }}>{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const VB = {
  btn:       { display:"flex", alignItems:"center", gap:5, padding:"9px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"var(--font)" },
  panel:     { position:"absolute", top:"calc(100%+8px)", right:0, width:260, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:16, zIndex:100, boxShadow:"var(--shadow-lg)", marginTop:6 },
  close:     { position:"absolute", top:10, right:10, background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:13 },
  panelTitle:{ margin:"0 0 10px", fontSize:14, fontWeight:700, color:"var(--text-primary)" },
  examples:  { background:"var(--bg-input)", borderRadius:8, padding:"10px 12px" },
  example:   { fontSize:12, color:"var(--accent)", padding:"2px 0", fontStyle:"italic" },
  transcript:{ marginTop:10, background:"var(--accent-subtle)", borderRadius:8, padding:"8px 10px" },
};
