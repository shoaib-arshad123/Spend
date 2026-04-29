import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateId, getAutoCategory } from "../utils/helpers";
import { useApp } from "../context/AppContext";

const STORES = ["Al-Fatah Supermart","Imtiaz Supermarket","Metro C&C","Canteen","Utility Store","Gourmet Bakery","CSD Store","Local Pharmacy"];
const CATS   = ["food","transport","books","health","entertainment","clothing","other"];
const C_ICONS= { food:"🍔", transport:"🚌", books:"📚", health:"💊", entertainment:"🎮", clothing:"👕", other:"📦" };

function simulateOCR(filename) {
  const l = filename.toLowerCase();
  let category = getAutoCategory();
  if (l.includes("food")||l.includes("canteen")||l.includes("rest")) category="food";
  else if (l.includes("book")||l.includes("stat")) category="books";
  else if (l.includes("med")||l.includes("pharm")) category="health";
  else if (l.includes("bus")||l.includes("trans")) category="transport";
  return {
    amount: Math.floor(Math.random()*1800)+80,
    category,
    store: STORES[Math.floor(Math.random()*STORES.length)],
    confidence: Math.floor(Math.random()*15)+85,
  };
}

export default function BillScanner({ onClose }) {
  const { addExpense, pushToast } = useApp();
  const [stage, setStage] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const fileRef = useRef(null);
  const camRef  = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStage("scanning");
    setTimeout(() => {
      const ocr = simulateOCR(file.name);
      setResult(ocr);
      setAmount(String(ocr.amount));
      setCategory(ocr.category);
      setNote(`Scanned from ${ocr.store}`);
      setStage("result");
    }, 2600);
  };

  const confirm = () => {
    if (!amount || Number(amount) <= 0) return pushToast({ type:"warning", message:"Enter a valid amount" });
    const today = new Date();
    addExpense({ id:generateId(), amount:Number(amount), category, note, date:today.toISOString().slice(0,10), time:today.toTimeString().slice(0,5), source:"scanner" });
    setStage("done");
    setTimeout(onClose, 1400);
  };

  return (
    <div style={BS.overlay}>
      <motion.div
        initial={{ opacity:0, scale:0.94, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.94 }}
        transition={{ duration:0.3 }}
        style={BS.modal}
      >
        <div style={BS.header}>
          <div><h3 style={BS.title}>📸 Bill Scanner</h3><p style={BS.sub}>Auto-detect amount & category from receipt</p></div>
          <button style={BS.closeBtn} onClick={onClose}>✕</button>
        </div>

        <AnimatePresence mode="wait">
          {stage==="idle" && (
            <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={BS.uploadZone} onClick={() => fileRef.current?.click()}>
                <motion.div animate={{ y:[0,-6,0] }} transition={{ duration:2, repeat:Infinity }}>
                  <span style={{ fontSize:48 }}>📄</span>
                </motion.div>
                <p style={BS.uploadTitle}>Tap to upload receipt</p>
                <p style={BS.uploadSub}>JPG, PNG from your gallery</p>
                <span style={BS.uploadTag}>Choose File</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
              <div style={BS.divider}><span style={{ background:"var(--bg-card)", padding:"0 12px", color:"var(--text-muted)", fontSize:12 }}>or</span></div>
              <button style={BS.cameraBtn} onClick={() => camRef.current?.click()}>📷 Take Photo with Camera</button>
              <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
            </motion.div>
          )}

          {stage==="scanning" && (
            <motion.div key="scan" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:"center", padding:"24px 0" }}>
              {preview && <img src={preview} alt="" style={BS.previewImg} />}
              <div style={BS.scannerBar}>
                <motion.div style={BS.scanLine} animate={{ top:["10%","90%","10%"] }} transition={{ duration:2, repeat:Infinity, ease:"linear" }} />
              </div>
              <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:"linear" }} style={{ fontSize:28, margin:"16px 0 8px" }}>🔍</motion.div>
              <p style={{ fontWeight:600, color:"var(--text-primary)", margin:"0 0 4px" }}>Scanning bill...</p>
              <p style={{ fontSize:12, color:"var(--text-muted)" }}>Detecting amount, store & category</p>
            </motion.div>
          )}

          {stage==="result" && result && (
            <motion.div key="result" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <div style={BS.successBanner}>
                <span style={{ fontSize:20 }}>✅</span>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13, color:"var(--green)" }}>Scan Complete!</p>
                  <p style={{ margin:0, fontSize:11, color:"var(--text-muted)" }}>{result.store} · {result.confidence}% confidence</p>
                </div>
              </div>
              {preview && <img src={preview} alt="" style={{ ...BS.previewImg, marginBottom:14 }} />}
              <div style={BS.field}><label style={BS.label}>Detected Amount (PKR)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={BS.input} />
              </div>
              <div style={BS.field}><label style={BS.label}>Category</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {CATS.map(c => (
                    <button key={c} style={{ ...BS.catBtn, ...(category===c ? BS.catActive : {}) }} onClick={() => setCategory(c)}>
                      {C_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>
              <div style={BS.field}><label style={BS.label}>Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} style={BS.input} />
              </div>
              <button style={BS.confirmBtn} onClick={confirm}>✅ Confirm & Save Expense</button>
              <button style={BS.retryBtn} onClick={() => { setStage("idle"); setPreview(null); }}>🔄 Scan Another</button>
            </motion.div>
          )}

          {stage==="done" && (
            <motion.div key="done" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:"center", padding:"32px 0" }}>
              <motion.span animate={{ scale:[1,1.3,1] }} transition={{ duration:0.5 }} style={{ fontSize:52, display:"block" }}>🎉</motion.span>
              <p style={{ fontWeight:700, color:"var(--green)", margin:"12px 0 4px" }}>Expense Saved!</p>
              <p style={{ fontSize:12, color:"var(--text-muted)" }}>PKR {amount} recorded from scanned bill</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const BS = {
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(4px)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:        { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:18, padding:24, width:"100%", maxWidth:420, maxHeight:"90vh", overflowY:"auto" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  title:        { margin:0, fontSize:16, fontWeight:700, color:"var(--text-primary)" },
  sub:          { margin:"3px 0 0", fontSize:12, color:"var(--text-muted)" },
  closeBtn:     { background:"transparent", border:"none", color:"var(--text-muted)", fontSize:18, cursor:"pointer" },
  uploadZone:   { border:"2px dashed var(--border)", borderRadius:14, padding:32, textAlign:"center", cursor:"pointer" },
  uploadTitle:  { fontSize:15, fontWeight:600, color:"var(--text-primary)", margin:"12px 0 4px" },
  uploadSub:    { fontSize:12, color:"var(--text-muted)", margin:"0 0 14px" },
  uploadTag:    { background:"var(--bg-elevated)", color:"var(--text-secondary)", padding:"7px 16px", borderRadius:8, fontSize:13 },
  divider:      { textAlign:"center", borderTop:"1px solid var(--border-light)", margin:"16px 0", position:"relative" },
  cameraBtn:    { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"12px", borderRadius:10, cursor:"pointer", fontSize:14, fontFamily:"var(--font)" },
  previewImg:   { width:"100%", borderRadius:10, maxHeight:140, objectFit:"cover", display:"block", marginBottom:12 },
  scannerBar:   { position:"relative", height:4, background:"var(--border)", borderRadius:2, margin:"10px 0" },
  scanLine:     { position:"absolute", left:0, right:0, height:2, background:"var(--accent)", boxShadow:"0 0 8px var(--accent)" },
  successBanner:{ display:"flex", gap:10, alignItems:"center", background:"var(--green-bg)", border:"1px solid var(--green)", borderRadius:8, padding:"10px 14px", marginBottom:14 },
  field:        { marginBottom:14 },
  label:        { display:"block", fontSize:11, color:"var(--text-muted)", fontWeight:700, marginBottom:6, textTransform:"uppercase" },
  input:        { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:8, padding:"10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" },
  catBtn:       { padding:"5px 10px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", fontSize:12, color:"var(--text-secondary)", fontFamily:"var(--font)" },
  catActive:    { background:"var(--accent-subtle)", border:"1px solid var(--accent)", color:"var(--accent)" },
  confirmBtn:   { width:"100%", background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", padding:"12px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, marginBottom:8, fontFamily:"var(--font)" },
  retryBtn:     { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"10px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"var(--font)" },
};
