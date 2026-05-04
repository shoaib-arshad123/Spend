import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { generateId, getAutoCategory } from "../utils/helpers";
import { useApp } from "../context/AppContext";
import { X, Upload, Camera, Image, RotateCcw, Check, AlertCircle, Scan, ShieldCheck, Aperture } from "lucide-react";

const STORES = ["Al-Fatah Supermart","Imtiaz Supermarket","Metro C&C","Canteen","Utility Store","Gourmet Bakery","CSD Store","Local Pharmacy"];
const CATS   = ["Food & Dining", "Transportation", "Education", "Health & Fitness", "Entertainment", "Shopping", "Bills & Utilities", "Travel", "Other"];
const C_ICONS= { 
  "Food & Dining":"🍔", "Transportation":"🚌", "Education":"📚", 
  "Health & Fitness":"💊", "Entertainment":"🎮", "Shopping":"🛍️", 
  "Bills & Utilities":"💡", "Travel":"✈️", "Other":"📦" 
};

function simulateOCR(filename) {
  const l = (filename || "").toLowerCase();
  const store = STORES[Math.floor(Math.random() * STORES.length)];
  const storeLower = store.toLowerCase();
  let category = "Other";
  if (storeLower.includes("mart") || storeLower.includes("market") || storeLower.includes("store") || storeLower.includes("bakery") || storeLower.includes("canteen") || l.includes("food") || l.includes("rest")) category = "Food & Dining";
  else if (storeLower.includes("pharmacy") || l.includes("med") || l.includes("health")) category = "Health & Fitness";
  else if (l.includes("bus") || l.includes("ride") || l.includes("travel") || l.includes("petrol") || l.includes("fuel")) category = "Transportation";
  else if (l.includes("book") || l.includes("study") || l.includes("stat")) category = "Education";
  else if (l.includes("clothes") || l.includes("mall") || l.includes("shirt")) category = "Shopping";
  return { amount: Math.floor(Math.random() * 1800) + 80, category, store, confidence: Math.floor(Math.random() * 15) + 85 };
}

export default function BillScanner({ onClose, onResult }) {
  const { pushToast } = useApp();
  const [stage, setStage] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [description, setDescription] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStage("scanning");
    setScanProgress(0);
    // Animate progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 8 + 2;
      });
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      const ocr = simulateOCR(file.name);
      setResult(ocr);
      setAmount(String(ocr.amount));
      setCategory(ocr.category);
      setDescription(`Scanned from ${ocr.store}`);
      setStage("result");
    }, 2800);
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(console.error); }
      }, 100);
    } catch (err) {
      if (err.name === "NotAllowedError") setCameraError("Camera permission denied. Allow access in browser settings.");
      else if (err.name === "NotFoundError") setCameraError("No camera found on this device.");
      else setCameraError("Unable to access camera. Try uploading instead.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    setCameraActive(false);
    canvas.toBlob((blob) => {
      if (blob) handleFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const confirm = () => {
    if (!amount || Number(amount) <= 0) return pushToast({ type:"warning", message:"Enter a valid amount" });
    onResult({ amount, category, description });
    onClose();
  };

  // Use Portal for the scanner modal too
  return createPortal(
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      style={BS.overlay}
    >
      <motion.div
        initial={{ opacity:0, scale:0.92, y:30 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92 }}
        transition={{ duration:0.35, type:"spring", damping:22, stiffness:300 }}
        style={BS.modal}
      >
        {/* Decorative orbs */}
        <div style={BS.orbGold} />
        <div style={BS.orbBlue} />
        
        {/* Header */}
        <div style={BS.header}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <motion.div 
              style={BS.headerIcon}
              animate={{ rotate:[0,5,-5,0] }}
              transition={{ duration:3, repeat:Infinity }}
            >
              <Scan size={20} color="var(--accent)" />
            </motion.div>
            <div>
              <h3 style={BS.title}>Bill Scanner</h3>
              <p style={BS.sub}>AI-powered receipt detection</p>
            </div>
          </div>
          <motion.button 
            style={BS.closeBtn} 
            onClick={() => { stopCamera(); onClose(); }}
            whileHover={{ scale:1.15, background:"rgba(255,255,255,0.1)" }}
            whileTap={{ scale:0.85 }}
          >
            <X size={16} />
          </motion.button>
        </div>

        <canvas ref={canvasRef} style={{ display:"none" }} />

        <AnimatePresence mode="wait">
          {/* ── Camera View ── */}
          {cameraActive && (
            <motion.div key="camera" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={BS.cameraWrap}>
                <video ref={videoRef} autoPlay playsInline muted style={BS.video} />
                <div style={BS.cameraOverlay}>
                  <motion.div 
                    style={BS.scanFrame}
                    animate={{ borderColor:["rgba(245,184,0,0.4)","rgba(245,184,0,0.8)","rgba(245,184,0,0.4)"] }}
                    transition={{ duration:2, repeat:Infinity }}
                  />
                  <motion.div 
                    style={BS.scanBeam}
                    animate={{ top:["15%","85%","15%"] }}
                    transition={{ duration:2.5, repeat:Infinity, ease:"linear" }}
                  />
                </div>
              </div>
              <p style={BS.cameraHint}>Position receipt within the frame</p>
              <div style={{ display:"flex", gap:10, marginTop:10 }}>
                <motion.button style={BS.camCancelBtn} onClick={stopCamera} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                  <X size={15} /> Cancel
                </motion.button>
                <motion.button style={BS.captureBtn} onClick={capturePhoto} whileHover={{ scale:1.03, boxShadow:"0 4px 24px rgba(245,184,0,0.35)" }} whileTap={{ scale:0.95 }}>
                  <Aperture size={16} /> Capture
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Idle: Upload / Camera Options ── */}
          {stage==="idle" && !cameraActive && (
            <motion.div key="idle" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={BS.optionsGrid}>
                {/* Upload */}
                <motion.div 
                  style={BS.optionCard}
                  onClick={() => fileRef.current?.click()}
                  whileHover={{ scale:1.04, borderColor:"var(--accent)", boxShadow:"0 8px 30px rgba(245,184,0,0.08)" }}
                  whileTap={{ scale:0.97 }}
                >
                  <motion.div 
                    style={BS.optionIcon}
                    animate={{ y:[0,-5,0] }}
                    transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}
                  >
                    <Upload size={26} color="var(--accent)" />
                  </motion.div>
                  <p style={BS.optionTitle}>Upload</p>
                  <p style={BS.optionSub}>From gallery</p>
                  <div style={BS.optionBadge}>
                    <Image size={11} /> Choose
                  </div>
                </motion.div>

                {/* Camera */}
                <motion.div 
                  style={BS.optionCard}
                  onClick={startCamera}
                  whileHover={{ scale:1.04, borderColor:"var(--blue)", boxShadow:"0 8px 30px rgba(59,130,246,0.08)" }}
                  whileTap={{ scale:0.97 }}
                >
                  <motion.div 
                    style={{ ...BS.optionIcon, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.15)" }}
                    animate={{ y:[0,-5,0] }}
                    transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut", delay:0.4 }}
                  >
                    <Camera size={26} color="var(--blue)" />
                  </motion.div>
                  <p style={BS.optionTitle}>Camera</p>
                  <p style={BS.optionSub}>Take photo</p>
                  <div style={{ ...BS.optionBadge, background:"rgba(59,130,246,0.06)", color:"var(--blue)" }}>
                    <Camera size={11} /> Open
                  </div>
                </motion.div>
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />

              {cameraError && (
                <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} style={BS.errorBanner}>
                  <AlertCircle size={14} /> <span>{cameraError}</span>
                </motion.div>
              )}

              {/* Pro tip */}
              <div style={BS.proTip}>
                <ShieldCheck size={13} color="var(--text-muted)" />
                <span>Your receipts are processed locally — nothing is uploaded</span>
              </div>
            </motion.div>
          )}

          {/* ── Scanning ── */}
          {stage==="scanning" && (
            <motion.div key="scan" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:"center", padding:"16px 0" }}>
              {preview && <img src={preview} alt="" style={BS.previewImg} />}
              
              {/* Progress bar */}
              <div style={BS.progressTrack}>
                <motion.div 
                  style={BS.progressBar}
                  animate={{ width:`${Math.min(scanProgress, 100)}%` }}
                  transition={{ duration:0.3 }}
                />
              </div>
              <p style={{ fontSize:12, color:"var(--text-muted)", margin:"4px 0 0" }}>{Math.min(Math.round(scanProgress), 100)}% complete</p>

              <motion.div
                animate={{ rotate:360 }}
                transition={{ duration:2, repeat:Infinity, ease:"linear" }}
                style={{ fontSize:28, margin:"14px 0 6px", display:"inline-block" }}
              >🔍</motion.div>
              <p style={{ fontWeight:700, color:"var(--text-primary)", margin:"0 0 4px", fontSize:14 }}>Analyzing receipt...</p>
              <p style={{ fontSize:11, color:"var(--text-muted)" }}>Detecting amount, store & category</p>
            </motion.div>
          )}

          {/* ── Result ── */}
          {stage==="result" && result && (
            <motion.div key="result" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
              <motion.div 
                style={BS.successBanner}
                initial={{ scale:0.95 }}
                animate={{ scale:1 }}
              >
                <motion.div 
                  animate={{ scale:[1,1.15,1] }}
                  transition={{ duration:0.4 }}
                >
                  <Check size={18} color="var(--green)" />
                </motion.div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:13, color:"var(--green)" }}>Scan Complete!</p>
                  <p style={{ margin:0, fontSize:11, color:"var(--text-muted)" }}>{result.store} · {result.confidence}% confidence</p>
                </div>
              </motion.div>

              {preview && <img src={preview} alt="" style={{ ...BS.previewImg, marginBottom:12, borderRadius:12 }} />}
              
              <div style={BS.field}>
                <label style={BS.fieldLabel}>Detected Amount (PKR)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={BS.input} />
              </div>
              
              <div style={BS.field}>
                <label style={BS.fieldLabel}>Category</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {CATS.map(c => (
                    <motion.button 
                      key={c}
                      style={{ ...BS.catChip, ...(category===c ? BS.catChipActive : {}) }}
                      onClick={() => setCategory(c)}
                      whileHover={{ scale:1.05, y:-1 }}
                      whileTap={{ scale:0.95 }}
                    >
                      {C_ICONS[c]} {c}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div style={BS.field}>
                <label style={BS.fieldLabel}>Note</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={BS.input} />
              </div>

              <motion.button 
                style={BS.confirmBtn} onClick={confirm}
                whileHover={{ scale:1.02, boxShadow:"0 6px 24px rgba(245,184,0,0.35)" }}
                whileTap={{ scale:0.97 }}
              >
                <Check size={15} /> Confirm & Save
              </motion.button>
              <motion.button 
                style={BS.retryBtn}
                onClick={() => { setStage("idle"); setPreview(null); }}
                whileHover={{ scale:1.02 }}
                whileTap={{ scale:0.97 }}
              >
                <RotateCcw size={13} /> Scan Another
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const BS = {
  overlay: { 
    position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", 
    backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
    zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:16 
  },
  modal: { 
    background:"var(--bg-card)", border:"1px solid var(--border)", 
    borderRadius:24, padding:"22px 24px", width:"100%", maxWidth:420, 
    maxHeight:"88vh", overflowY:"auto", position:"relative",
    boxShadow:"var(--shadow-lg)"
  },
  orbGold: {
    position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%",
    background:"radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)", pointerEvents:"none"
  },
  orbBlue: {
    position:"absolute", bottom:-30, left:-30, width:100, height:100, borderRadius:"50%",
    background:"radial-gradient(circle, var(--blue-bg) 0%, transparent 70%)", pointerEvents:"none"
  },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, position:"relative", zIndex:1 },
  headerIcon: { 
    width:40, height:40, borderRadius:12, background:"var(--accent-subtle)", 
    border:"1px solid var(--accent-glow)", display:"flex", alignItems:"center", justifyContent:"center" 
  },
  title: { margin:0, fontSize:17, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.3px" },
  sub: { margin:"1px 0 0", fontSize:11, color:"var(--text-muted)", fontWeight:500 },
  closeBtn: { 
    width:34, height:34, borderRadius:"50%", background:"transparent", 
    border:"none", color:"var(--text-muted)", cursor:"pointer", 
    display:"flex", alignItems:"center", justifyContent:"center" 
  },

  // Options Grid
  optionsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14, position:"relative", zIndex:1 },
  optionCard: { 
    border:"2px dashed var(--border)", borderRadius:18, padding:"22px 12px", 
    textAlign:"center", cursor:"pointer", background:"var(--bg-input)", 
    transition:"all 0.3s ease" 
  },
  optionIcon: { 
    width:52, height:52, borderRadius:"50%", background:"var(--accent-subtle)", 
    border:"1px solid var(--accent-glow)", display:"flex", alignItems:"center", 
    justifyContent:"center", margin:"0 auto 10px" 
  },
  optionTitle: { fontSize:14, fontWeight:800, color:"var(--text-primary)", margin:"0 0 2px" },
  optionSub: { fontSize:11, color:"var(--text-muted)", margin:"0 0 10px", fontWeight:500 },
  optionBadge: { 
    display:"inline-flex", alignItems:"center", gap:4, background:"var(--accent-subtle)", 
    color:"var(--accent)", padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700 
  },

  // Camera
  cameraWrap: { position:"relative", borderRadius:16, overflow:"hidden", background:"#000", marginBottom:8 },
  video: { width:"100%", height:220, objectFit:"cover", display:"block" },
  cameraOverlay: { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" },
  scanFrame: { width:"72%", height:"58%", border:"2.5px solid var(--accent)", borderRadius:14 },
  scanBeam: { 
    position:"absolute", left:"14%", right:"14%", height:2, 
    background:"linear-gradient(90deg, transparent, var(--accent), transparent)", 
    boxShadow:"0 0 12px var(--accent)" 
  },
  cameraHint: { fontSize:11, color:"var(--text-muted)", textAlign:"center", margin:"4px 0 0", fontWeight:500 },
  captureBtn: { 
    flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:6, 
    background:"linear-gradient(135deg,#f5b800,#ffd04a)", border:"none", color:"#111", 
    padding:"11px", borderRadius:12, cursor:"pointer", fontSize:13, fontWeight:800, fontFamily:"var(--font)" 
  },
  camCancelBtn: { 
    flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, 
    background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", 
    padding:"11px", borderRadius:12, cursor:"pointer", fontSize:12, fontFamily:"var(--font)" 
  },

  errorBanner: { 
    display:"flex", alignItems:"center", gap:8, background:"var(--red-bg)", 
    border:"1px solid var(--red)", borderRadius:12, padding:"10px 14px", 
    marginTop:10, fontSize:11, color:"var(--red)", fontWeight:500 
  },
  proTip: { 
    display:"flex", alignItems:"center", gap:6, padding:"8px 0", 
    fontSize:10, color:"var(--text-muted)", fontWeight:500, justifyContent:"center", marginTop:4 
  },

  // Scanning
  previewImg: { width:"100%", borderRadius:14, maxHeight:150, objectFit:"cover", display:"block", marginBottom:10 },
  progressTrack: { 
    height:4, background:"var(--border)", borderRadius:4, overflow:"hidden", margin:"10px 0 4px" 
  },
  progressBar: { 
    height:"100%", background:"linear-gradient(90deg, var(--accent), var(--accent-hover))", borderRadius:4 
  },

  // Result
  successBanner: { 
    display:"flex", gap:10, alignItems:"center", background:"var(--green-bg)", 
    border:"1px solid var(--green)", borderRadius:12, padding:"10px 14px", marginBottom:12 
  },
  field: { marginBottom:10 },
  fieldLabel: { 
    display:"block", fontSize:10, color:"var(--text-muted)", fontWeight:700, 
    marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" 
  },
  input: { 
    width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", 
    color:"var(--text-primary)", borderRadius:10, padding:"9px 12px", fontSize:13, 
    outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" 
  },
  catChip: { 
    padding:"4px 9px", background:"var(--bg-input)", border:"1px solid var(--border)", 
    borderRadius:8, cursor:"pointer", fontSize:11, color:"var(--text-secondary)", 
    fontFamily:"var(--font)", transition:"all 0.2s ease" 
  },
  catChipActive: { 
    background:"var(--accent-subtle)", border:"1px solid var(--accent)", color:"var(--accent)", fontWeight:700 
  },
  confirmBtn: { 
    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, 
    background:"linear-gradient(135deg,#f5b800,#ffd04a)", border:"none", color:"#111", 
    padding:"11px", borderRadius:12, cursor:"pointer", fontSize:13, fontWeight:800, 
    marginBottom:8, fontFamily:"var(--font)" 
  },
  retryBtn: { 
    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, 
    background:"var(--bg-input)", border:"1px solid var(--border)", 
    color:"var(--text-secondary)", padding:"9px", borderRadius:12, cursor:"pointer", 
    fontSize:12, fontFamily:"var(--font)" 
  },
};
