import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Bell, X } from "lucide-react";

// ─── TOAST CONTAINER ─────────────────────────────────────────────────────────
const toastStyle = {
  success: { border:"#10b981", bg:"var(--green-bg)", icon: <CheckCircle2 size={16} /> },
  warning: { border:"#f5b800", bg:"var(--accent-subtle)", icon: <AlertTriangle size={16} /> },
  danger:  { border:"#ef4444", bg:"var(--red-bg)", icon: <AlertCircle size={16} /> },
  info:    { border:"#3b82f6", bg:"var(--blue-bg)", icon: <Info size={16} /> },
};

export function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column-reverse", gap:8, maxWidth:340 }}>
      <AnimatePresence>
        {toasts.map(t => {
          const s = toastStyle[t.type] || toastStyle.info;
          return (
            <motion.div key={t.id}
              initial={{ opacity:0, x:60, scale:0.9 }}
              animate={{ opacity:1, x:0, scale:1 }}
              exit={{ opacity:0, x:60, scale:0.9 }}
              transition={{ duration:0.25 }}
              style={{ background:"var(--bg-card)", border:`1px solid ${s.border}`, borderLeft:`3px solid ${s.border}`, padding:"11px 16px", borderRadius:10, fontSize:13, fontWeight:500, color:"var(--text-primary)", boxShadow:"var(--shadow-md)", display:"flex", alignItems:"center", gap:8 }}
            >
              <span style={{ color: s.border, display:"flex", alignItems:"center" }}>{s.icon}</span>
              {t.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
function timeAgo(iso) {
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.round(d/60)}m ago`;
  if (d < 86400) return `${Math.round(d/3600)}h ago`;
  return `${Math.round(d/86400)}d ago`;
}

const nTypeStyle = {
  success: { color:"var(--green)", bg:"var(--green-bg)" },
  warning: { color:"#f5b800",     bg:"var(--accent-subtle)" },
  danger:  { color:"var(--red)",  bg:"var(--red-bg)" },
  info:    { color:"var(--blue)", bg:"var(--blue-bg)" },
};

export function NotificationCenter({ onClose }) {
  const { notifications, markAllRead, clearNotifications, requestNotificationPermission } = useApp();
  const [tab, setTab] = useState("all");
  const [notifPermission, setNotifPermission] = useState(window.Notification?.permission || "default");

  useEffect(() => {
    // Automatically mark as read when the user opens the panel
    if (notifications.some(n => !n.isRead)) {
      markAllRead();
    }
  }, [markAllRead, notifications.length]); // Only run when count changes or on mount

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) setNotifPermission("granted");
  };

  const shown = tab === "unread" ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:0.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8, scale:0.97 }}
      transition={{ duration:0.2 }}
      style={NC.panel}
    >
      <div style={NC.header}>
        <h3 style={NC.title}>
          <Bell size={16} style={{ marginRight:6, verticalAlign:"middle" }} />
          <span style={{ verticalAlign:"middle" }}>Notifications</span>
        </h3>
        <div style={{ display:"flex", gap:6 }}>
          <motion.button style={NC.actionBtn} onClick={markAllRead} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Mark all read</motion.button>
          <motion.button style={NC.actionBtn} onClick={clearNotifications} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Clear all</motion.button>
          <motion.button style={{ ...NC.actionBtn, display:"flex", alignItems:"center" }} onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><X size={16} /></motion.button>
        </div>
      </div>
      <div style={NC.tabs}>
        {["all","unread"].map(t => (
          <motion.button key={t} style={{ ...NC.tab, ...(tab===t ? NC.tabActive : {}) }} onClick={() => setTab(t)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </motion.button>
        ))}
      </div>
      <div style={NC.list}>
        {notifPermission === "default" && (
          <div style={NC.permissionBox}>
            <p style={{ margin:"0 0 8px", fontSize:12, color:"var(--text-primary)" }}>Enable desktop alerts to never miss a budget warning.</p>
            <motion.button style={NC.enableBtn} onClick={handleEnable} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Enable Notifications</motion.button>
          </div>
        )}
        {shown.length === 0 ? (
          <div style={NC.empty}><div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><Bell size={32} color="var(--text-muted)" /></div><p style={{ margin:0 }}>No notifications</p></div>
        ) : shown.map(n => {
          const s = nTypeStyle[n.type] || nTypeStyle.info;
          return (
            <div key={n.id} style={{ ...NC.item, background: n.isRead ? "transparent" : s.bg, borderLeft:`3px solid ${n.isRead ? "transparent" : s.color}` }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
              <div style={{ flex:1 }}>
                <p style={NC.itemTitle}>{n.title}</p>
                <p style={NC.itemMsg}>{n.message}</p>
              </div>
              <span style={NC.itemTime}>{timeAgo(n.time)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

const NC = {
  panel:     { position:"absolute", top:"calc(100% + 10px)", right:0, width:360, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, boxShadow:"var(--shadow-lg)", zIndex:200, overflow:"hidden" },
  header:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:"1px solid var(--border-light)" },
  title:     { margin:0, fontSize:14, fontWeight:700, color:"var(--text-primary)" },
  actionBtn: { background:"transparent", border:"none", color:"var(--text-muted)", fontSize:11, cursor:"pointer", padding:"3px 6px" },
  tabs:      { display:"flex", padding:"8px 12px", gap:4, borderBottom:"1px solid var(--border-light)" },
  tab:       { padding:"5px 12px", background:"transparent", border:"1px solid transparent", color:"var(--text-muted)", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:500 },
  tabActive: { background:"var(--accent-subtle)", border:"1px solid var(--accent-glow)", color:"var(--accent)" },
  list:      { maxHeight:380, overflowY:"auto" },
  item:      { display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", borderBottom:"1px solid var(--border-light)", transition:"background 0.2s" },
  itemTitle: { margin:0, fontSize:13, fontWeight:600, color:"var(--text-primary)" },
  itemMsg:   { margin:"2px 0 0", fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 },
  itemTime:  { fontSize:10, color:"var(--text-muted)", whiteSpace:"nowrap", marginTop:2, flexShrink:0 },
  empty:     { textAlign:"center", padding:"40px 0", color:"var(--text-muted)", fontSize:13 },
  permissionBox: { padding:"16px", background:"var(--accent-subtle)", borderBottom:"1px solid var(--border-light)", textAlign:"center" },
  enableBtn: { background:"var(--accent)", border:"none", color:"#111", padding:"6px 14px", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" },
};
