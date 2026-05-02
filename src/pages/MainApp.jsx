import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { translations } from "../i18n/translations";
import Dashboard      from "../components/Dashboard";
import AddExpense     from "../components/AddExpense";
import ExpenseHistory from "../components/ExpenseHistory";
import SmartAdvice    from "../components/SmartAdvice";
import RewardSystem   from "../components/RewardSystem";
import Profile        from "../components/Profile";
import Analytics      from "../components/Analytics";
import RecurringExpenses from "../components/RecurringExpenses";
import SavingsGoals   from "../components/SavingsGoals";
import CelebrationPopup from "../components/CelebrationPopup";
import { NotificationCenter } from "../components/NotificationCenter";
import { classifyUser, formatPKR } from "../utils/helpers";
import { LayoutDashboard, PieChart as PieChartIcon, Plus, History, Lightbulb, Trophy, User as UserIcon, Menu, X, Sun, Moon, Globe, Bell, LogOut, Repeat, Target, MoreVertical } from "lucide-react";

function SettingsDropdown({ onClose, onToggleTheme, theme, onToggleLang, lang, logout }) {
  return (
    <motion.div 
      initial={{ opacity:0, y:10, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:10, scale:0.95 }}
      style={ms.dropdown}
    >
      <div style={ms.dropdownHeader}>Settings</div>
      <button style={ms.dropdownItem} onClick={() => { onToggleTheme(); onClose(); }}>
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      </button>
      <button style={ms.dropdownItem} onClick={() => { onToggleLang(); onClose(); }}>
        <Globe size={16} />
        <span>{lang === "en" ? "اردو (Urdu)" : "English"}</span>
      </button>
      <div style={{...ms.dropdownHeader, borderTop:"1px solid var(--border)", marginTop:4, paddingTop:8}}>Account</div>
      <button style={{...ms.dropdownItem, color:"var(--red)"}} onClick={() => { logout(); onClose(); }}>
        <LogOut size={16} />
        <span>Log Out</span>
      </button>
    </motion.div>
  );
}

const NAV = [
  { key:"dashboard",  icon: <LayoutDashboard size={20} />, label:"Dashboard" },
  { key:"analytics",  icon: <PieChartIcon size={20} />, label:"Analytics" },
  { key:"addExpense", icon: <Plus size={24} />, label:"Add Expense" },
  { key:"history",    icon: <History size={20} />, label:"History" },
  { key:"recurring",  icon: <Repeat size={20} />, label:"Subscriptions" },
  { key:"goals",      icon: <Target size={20} />, label:"Goals" },
  { key:"advice",     icon: <Lightbulb size={20} />, label:"AI Analysis" },
  { key:"rewards",    icon: <Trophy size={20} />, label:"Rewards" },
  { key:"profile",    icon: <UserIcon size={20} />, label:"Profile" },
];

export default function MainApp({ tab = "dashboard" }) {
  const navigate = useNavigate();
  const { user, lang, setLang, expenses, monthlyExpenses, budget, setBudget, addExpense, deleteExpense, unreadCount, theme, toggleTheme, logout, celebrationReward, setCelebrationReward } = useApp();
  
  const [showNotif,   setShowNotif]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Map route keys to human readable paths if needed, 
  // but we'll use a direct mapping for simplicity
  const activeTab = tab; 

  const handleTabChange = (key) => {
    const paths = {
      dashboard: "/dashboard",
      analytics: "/analytics",
      addExpense: "/add",
      history: "/history",
      recurring: "/recurring",
      goals: "/goals",
      advice: "/advice",
      rewards: "/rewards",
      profile: "/profile"
    };
    navigate(paths[key] || "/dashboard");
    setSidebarOpen(false);
  };

  const t          = translations[lang];
  const totalSpent = expenses.reduce((s,e) => s+e.amount, 0);
  const userType   = classifyUser(totalSpent, budget);
  const pct        = budget > 0 ? Math.round((totalSpent/budget)*100) : 0;
  const remaining  = budget - totalSpent;
  const active     = NAV.find(n => n.key === activeTab);

  const renderPage = () => {
    const p = { t, lang, expenses, budget, setBudget, setActiveTab: handleTabChange };
    switch(activeTab) {
      case "dashboard":  return <Dashboard {...p} />;
      case "analytics":  return <Analytics {...p} />;
      case "addExpense": return <AddExpense {...p} onAdd={addExpense} />;
      case "history":    return <ExpenseHistory {...p} onDelete={deleteExpense} />;
      case "recurring":  return <RecurringExpenses {...p} />;
      case "goals":      return <SavingsGoals {...p} />;
      case "advice":     return <SmartAdvice {...p} expenses={monthlyExpenses} />;
      case "rewards":    return <RewardSystem {...p} />;
      case "profile":    return <Profile {...p} />;
      default: return null;
    }
  };

  return (
    <div style={ms.root}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={ms.overlay} onClick={() => setSidebarOpen(false)} 
            />
            <motion.div 
              initial={{ x:-250 }} animate={{ x:0 }} exit={{ x:-250 }}
              transition={{ type:"spring", damping:25, stiffness:200 }}
              style={ms.sidebar}
            >
              <div style={ms.sidebarTop}>
                <div style={ms.sbLogo}>
                  <div style={ms.sbLogoIcon}>💰</div>
                  <span style={ms.sbBrand}>SpendSmart</span>
                </div>
                <button style={ms.sbClose} onClick={() => setSidebarOpen(false)}><X size={20} /></button>
              </div>

              <div style={ms.sbUser}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, overflow:"hidden" }}>
                  {user?.photo ? <img src={user.photo} alt="P" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (user?.avatar||"🧑‍💻")}
                </div>
                <div style={{ flex:1 }}>
                  <p style={ms.sbUserName}>{user?.name}</p>
                  <p style={ms.sbUserSub}>{user?.email}</p>
                </div>
              </div>

              <div style={ms.sbNav}>
                <p style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", margin:"10px 12px 6px" }}>Main Menu</p>
                {NAV.map(n => (
                  <button 
                    key={n.key} 
                    onClick={() => handleTabChange(n.key)}
                    style={{ ...ms.sbNavItem, ...(activeTab === n.key ? ms.sbNavActive : {}) }}
                  >
                    <span style={{ ...ms.sbNavIcon, background: activeTab===n.key ? "var(--accent)" : "var(--bg-input)", color: activeTab===n.key ? "#111" : "var(--text-muted)" }}>{n.icon}</span>
                    <span>{n.label}</span>
                  </button>
                ))}
              </div>

              <div style={ms.sbBottom}>
                <button style={ms.sbAction} onClick={() => { logout(); setSidebarOpen(false); }}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div style={ms.main}>
        {/* Top bar */}
        <header style={ms.topBar}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <motion.button 
              style={ms.iconBtn} 
              onClick={() => setSidebarOpen(true)}
              whileHover={{ scale:1.1, background:"var(--accent-subtle)" }}
              whileTap={{ scale:0.9 }}
            >
              <Menu size={20} />
            </motion.button>
            <div style={{ ...ms.topBrand, cursor: "pointer", marginLeft: 0 }} onClick={() => handleTabChange("dashboard")}>
              <img src="/logo.png" alt="SpendSmart" style={{ width:24, height:24, borderRadius:5, objectFit:"cover" }} />
              <span style={{ fontSize:15, fontWeight:800, color:"var(--accent)" }}>SpendSmart</span>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Rewards shortcut */}
            <motion.button 
              style={ms.iconBtn} 
              onClick={() => handleTabChange("rewards")} 
              title="Your Rewards"
              whileHover={{ scale: 1.1, background: "var(--accent-subtle)" }} 
              whileTap={{ scale: 0.9 }}
            >
              <Trophy size={18} color="var(--accent)" />
            </motion.button>

            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <motion.button style={ms.iconBtn} onClick={() => setShowNotif(!showNotif)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Bell size={18} />
                {unreadCount > 0 && <span style={ms.notifDot}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </motion.button>
              <AnimatePresence>
                {showNotif && <NotificationCenter onClose={() => setShowNotif(false)} />}
              </AnimatePresence>
            </div>
            {/* Avatar */}
            <motion.button style={{ ...ms.avatarBtn, overflow:"hidden" }} onClick={() => handleTabChange("profile")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                user?.avatar||"🧑‍💻"
              )}
            </motion.button>
            {/* Settings */}
            <div style={{ position:"relative" }}>
              <motion.button style={ms.iconBtn} onClick={() => setShowSettings(!showSettings)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <MoreVertical size={18} />
              </motion.button>
              <AnimatePresence>
                {showSettings && (
                  <SettingsDropdown 
                    onClose={() => setShowSettings(false)}
                    onToggleTheme={toggleTheme}
                    theme={theme}
                    onToggleLang={() => setLang(lang==="en"?"ur":"en")}
                    lang={lang}
                    logout={logout}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Zero-state budget banner */}
        {budget === 0 && activeTab !== "profile" && (
          <motion.div
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            style={ms.budgetBanner}
          >
            <span>⚠️</span>
            <span style={{ flex:1, fontSize:13 }}>No budget set! Go to your Profile to set your monthly budget.</span>
            <motion.button style={ms.budgetBannerBtn} onClick={() => handleTabChange("profile")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Set Budget →</motion.button>
          </motion.div>
        )}

        {/* Page content */}
        <div style={ms.content}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav style={ms.bottomNav}>
          {["dashboard", "analytics", "recurring", "addExpense", "history", "goals", "advice"].map(key => {
            const n = NAV.find(item => item.key === key);
            if (!n) return null;

            if (n.key === "addExpense") {
              return (
                <div key={n.key} style={ms.bottomFabWrap}>
                  <motion.button
                    style={ms.bottomFab}
                    onClick={() => handleTabChange(n.key)}
                    whileHover={{ scale: 1.15, boxShadow: "0 6px 16px rgba(245,158,11,0.6)" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={28} />
                  </motion.button>
                </div>
              );
            }
            return (
              <motion.button key={n.key}
                style={{ ...ms.bottomItem, ...(activeTab === n.key ? ms.bottomActive : {}) }}
                onClick={() => handleTabChange(n.key)}
                whileHover={{ scale: 1.1, color: "var(--accent)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>{n.icon}</span>
                <span style={{ fontSize: 8.5, fontWeight: activeTab===n.key ? 700 : 500, whiteSpace:"nowrap" }}>
                  {n.key === "advice" ? "AI" : n.label.split(" ")[0]}
                </span>
              </motion.button>
            );
          })}
        </nav>
        {/* Celebration Popup */}
        <CelebrationPopup reward={celebrationReward} onClose={() => setCelebrationReward(null)} />
      </div>
    </div>
  );
}

const ms = {
  root:         { display:"flex", minHeight:"100vh", background:"var(--bg-primary)", color:"var(--text-primary)" },
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:290, backdropFilter:"blur(2px)" },
  sidebar:      { position:"fixed", top:0, left:0, bottom:0, width:248, background:"var(--bg-card)", borderRight:"1px solid var(--border)", zIndex:300, display:"flex", flexDirection:"column" },
  sidebarTop:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 16px 12px", borderBottom:"1px solid var(--border-light)" },
  sbLogo:       { display:"flex", alignItems:"center", gap:9 },
  sbLogoIcon:   { width:30, height:30, background:"linear-gradient(135deg,#f59e0b,#f97316)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 },
  sbBrand:      { fontSize:16, fontWeight:800, color:"var(--accent)" },
  sbClose:      { background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:16 },
  sbUser:       { display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid var(--border-light)" },
  sbUserName:   { margin:0, fontSize:13, fontWeight:700, color:"var(--text-primary)" },
  sbUserSub:    { margin:0, fontSize:11, color:"var(--text-muted)" },
  sbBudget:     { padding:"12px 16px", borderBottom:"1px solid var(--border-light)" },
  sbNav:        { flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" },
  sbNavItem:    { display:"flex", alignItems:"center", gap:12, padding:"8px 12px", background:"transparent", border:"none", color:"var(--text-muted)", borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"var(--font)", transition:"all 0.15s" },
  sbNavActive:  { background:"var(--accent-subtle)", color:"var(--accent)", fontWeight:700 },
  sbNavIcon:    { width:32, height:32, borderRadius:"50%", background:"var(--bg-input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  sbBottom:     { display:"flex", gap:6, padding:"12px 10px 16px", borderTop:"1px solid var(--border-light)" },
  sbAction:     { flex:1, background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:500, fontFamily:"var(--font)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" },
  main:         { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" },
  topBar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", background:"var(--bg-card)", borderBottom:"1px solid var(--border-light)", position:"sticky", top:0, zIndex:100 },
  menuBtn:      { background:"transparent", border:"none", cursor:"pointer", padding:"6px", display:"flex", flexDirection:"column" },
  backBtn:      { display:"flex", alignItems:"center", gap:4, background:"var(--accent-subtle)", border:"1px solid var(--accent)", borderRadius:8, padding:"4px 8px", cursor:"pointer", color:"var(--accent)" },
  topBrand:     { display:"flex", alignItems:"center", gap:6, marginLeft:4 },
  pageTitle:    { margin:0, fontSize:16, fontWeight:700, color:"var(--text-primary)" },
  iconBtn:      { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 },
  notifDot:     { position:"absolute", top:-5, right:-5, background:"var(--red)", color:"#fff", fontSize:9, fontWeight:700, width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" },
  avatarBtn:    { background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"50%", width:34, height:34, fontSize:17, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  budgetBanner: { display:"flex", alignItems:"center", gap:10, padding:"10px 18px", background:"var(--accent-subtle)", borderBottom:"1px solid rgba(245,158,11,0.25)", fontSize:13 },
  budgetBannerBtn:{ background:"var(--accent)", border:"none", color:"#111", padding:"5px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, whiteSpace:"nowrap", fontFamily:"var(--font)" },
  content:      { flex:1, overflowY:"auto", paddingBottom:72 },
  bottomNav:    { position:"fixed", bottom:0, left:0, right:0, background:"var(--bg-card)", borderTop:"1px solid var(--border-light)", display:"flex", zIndex:100, height:60, alignItems:"center" },
  bottomItem:   { flex:1, display:"flex", flexDirection:"column", alignItems:"center", background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontFamily:"var(--font)" },
  bottomActive: { color:"var(--accent)" },
  bottomFabWrap:{ flex:1, display:"flex", justifyContent:"center", position:"relative" },
  bottomFab:    { width:54, height:54, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#f97316)", color:"#111", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 4px 14px rgba(245,158,11,0.45)", position:"absolute", top:-27 },
  dropdown:     { position:"absolute", top:42, right:0, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, width:160, padding:6, zIndex:1000, boxShadow:"var(--shadow-lg)" },
  dropdownHeader:{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", padding:"8px 12px 4px" },
  dropdownItem: { width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", color:"var(--text-primary)", borderRadius:8, cursor:"pointer", fontSize:13, textAlign:"left", fontFamily:"var(--font)", transition:"0.2s" },
};
