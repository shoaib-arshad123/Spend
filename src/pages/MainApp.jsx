import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { translations } from "../i18n/translations";
import Dashboard      from "../components/Dashboard";
import AddExpense     from "../components/AddExpense";
import ExpenseHistory from "../components/ExpenseHistory";
import SmartAdvice    from "../components/SmartAdvice";
import RewardSystem   from "../components/RewardSystem";
import Profile        from "../components/Profile";
import Analytics      from "../components/Analytics";
import { NotificationCenter } from "../components/NotificationCenter";
import { classifyUser, formatPKR } from "../utils/helpers";
import { LayoutDashboard, PieChart as PieChartIcon, Plus, History, Lightbulb, Trophy, User as UserIcon, Menu, X, Sun, Moon, Globe, Bell, LogOut } from "lucide-react";

const NAV = [
  { key:"dashboard",  icon: <LayoutDashboard size={20} />, label:"Dashboard" },
  { key:"analytics",  icon: <PieChartIcon size={20} />, label:"Analytics" },
  { key:"addExpense", icon: <Plus size={24} />, label:"Add Expense", accent:true },
  { key:"history",    icon: <History size={20} />, label:"History" },
  { key:"advice",     icon: <Lightbulb size={20} />, label:"AI Advice" },
  { key:"rewards",    icon: <Trophy size={20} />, label:"Rewards" },
  { key:"profile",    icon: <UserIcon size={20} />, label:"Profile" },
];

export default function MainApp() {
  const { user, lang, setLang, expenses, budget, setBudget, addExpense, deleteExpense, unreadCount, theme, toggleTheme, logout } = useApp();
  const [activeTab,   setActiveTab]   = useState("dashboard");
  const [showNotif,   setShowNotif]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const t          = translations[lang];
  const totalSpent = expenses.reduce((s,e) => s+e.amount, 0);
  const userType   = classifyUser(totalSpent, budget);
  const pct        = budget > 0 ? Math.round((totalSpent/budget)*100) : 0;
  const remaining  = budget - totalSpent;
  const active     = NAV.find(n => n.key === activeTab);

  const renderPage = () => {
    const p = { t, lang, expenses, budget, setBudget, setActiveTab };
    switch(activeTab) {
      case "dashboard":  return <Dashboard {...p} />;
      case "analytics":  return <Analytics />;
      case "addExpense": return <AddExpense t={t} lang={lang} onAdd={addExpense} setActiveTab={setActiveTab} />;
      case "history":    return <ExpenseHistory t={t} lang={lang} expenses={expenses} onDelete={deleteExpense} />;
      case "advice":     return <SmartAdvice t={t} lang={lang} expenses={expenses} budget={budget} />;
      case "rewards":    return <RewardSystem t={t} expenses={expenses} budget={budget} />;
      case "profile":    return <Profile />;
      default: return null;
    }
  };

  return (
    <div style={ms.root}>
      {/* ── SIDEBAR ── */}
      <>
        {sidebarOpen && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={ms.overlay} onClick={() => setSidebarOpen(false)} />}
        <motion.aside
          style={ms.sidebar}
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -260 }}
          transition={{ type:"spring", stiffness:300, damping:30 }}
        >
          {/* Brand */}
          <div style={ms.sidebarTop}>
            <div style={ms.sbLogo}>
              <img src="/logo.png" alt="SpendSmart" style={{ width:30, height:30, borderRadius:7, objectFit:"cover" }} />
              <span style={ms.sbBrand}>SpendSmart</span>
            </div>
            <button style={ms.sbClose} onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* User card */}
          <div style={ms.sbUser}>
            {user?.photo ? (
              <img src={user.photo} alt="Avatar" style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover" }} />
            ) : (
              <span style={{ fontSize:28 }}>{user?.avatar||"🧑‍💻"}</span>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={ms.sbUserName}>{user?.name}</p>
              <p style={ms.sbUserSub}>{budget>0 ? `${formatPKR(Math.max(remaining,0))} left` : "Set budget in Profile"}</p>
            </div>
          </div>

          {/* Budget mini-bar */}
          {budget > 0 && (
            <div style={ms.sbBudget}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:"var(--text-muted)" }}>Budget used</span>
                <span style={{ fontSize:11, fontWeight:700, color: pct>=100?"var(--red)":pct>=80?"var(--accent)":"var(--green)" }}>{pct}%</span>
              </div>
              <div style={{ height:5, background:"var(--border)", borderRadius:3 }}>
                <motion.div style={{ height:"100%", borderRadius:3, background: pct>=100?"var(--red)":pct>=80?"#f59e0b":"var(--green)" }}
                  initial={{ width:0 }} animate={{ width:`${Math.min(pct,100)}%` }} transition={{ duration:0.8 }} />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={ms.sbNav}>
            {NAV.map(n => (
              <button
                key={n.key}
                style={{ ...ms.sbNavItem, ...(activeTab===n.key ? ms.sbNavActive : {}), ...(n.accent ? ms.sbNavAccent : {}) }}
                onClick={() => { setActiveTab(n.key); setSidebarOpen(false); }}
              >
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>{n.icon}</span>
                <span style={{ fontSize:14 }}>{n.label}</span>
                {n.key==="addExpense" && <span style={ms.addBadge}><Plus size={14} /></span>}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div style={ms.sbBottom}>
            <button style={ms.sbAction} onClick={() => setLang(lang==="en"?"ur":"en")}>
              <Globe size={16} style={{ marginBottom: 4 }} />
              <div>{lang==="en" ? "اردو" : "English"}</div>
            </button>
            <button style={ms.sbAction} onClick={toggleTheme}>
              {theme==="dark" ? <Sun size={16} style={{ marginBottom: 4 }} /> : <Moon size={16} style={{ marginBottom: 4 }} />}
              <div>{theme==="dark" ? "Light" : "Dark"}</div>
            </button>
          </div>
        </motion.aside>
      </>

      {/* ── MAIN ── */}
      <div style={ms.main}>
        {/* Top bar */}
        <header style={ms.topBar}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button style={ms.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={24} color="var(--text-secondary)" />
            </button>
            <div>
              <h1 style={ms.pageTitle}>
                <span style={{ display:"inline-flex", alignItems:"center", verticalAlign:"middle", marginRight:8 }}>{active?.icon}</span>
                <span style={{ verticalAlign:"middle" }}>{active?.label}</span>
              </h1>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Theme toggle */}
            <button style={ms.iconBtn} onClick={toggleTheme} title="Toggle theme">
              {theme==="dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Lang */}
            <button style={ms.iconBtn} onClick={() => setLang(lang==="en"?"ur":"en")}>
              <Globe size={18} />
            </button>
            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <button style={ms.iconBtn} onClick={() => setShowNotif(!showNotif)}>
                <Bell size={18} />
                {unreadCount > 0 && <span style={ms.notifDot}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              <AnimatePresence>
                {showNotif && <NotificationCenter onClose={() => setShowNotif(false)} />}
              </AnimatePresence>
            </div>
            {/* Avatar */}
            <button style={{ ...ms.avatarBtn, overflow:"hidden" }} onClick={() => setActiveTab("profile")}>
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                user?.avatar||"🧑‍💻"
              )}
            </button>
            {/* Logout */}
            <button style={{ ...ms.iconBtn, color:"var(--red)" }} onClick={logout} title="Sign out">
              <LogOut size={18} />
            </button>
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
            <button style={ms.budgetBannerBtn} onClick={() => setActiveTab("profile")}>Set Budget →</button>
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

        {/* Bottom nav (mobile) */}
        <nav style={ms.bottomNav}>
          {NAV.slice(0,5).map(n => (
            <button key={n.key}
              style={{ ...ms.bottomItem, ...(activeTab===n.key ? ms.bottomActive : {}), ...(n.accent ? ms.bottomAccent : {}) }}
              onClick={() => setActiveTab(n.key)}
            >
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4 }}>{n.icon}</span>
              <span style={{ fontSize:9 }}>{n.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
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
  sbNavItem:    { display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", color:"var(--text-muted)", borderRadius:9, cursor:"pointer", textAlign:"left", fontFamily:"var(--font)", transition:"all 0.15s" },
  sbNavActive:  { background:"var(--accent-subtle)", color:"var(--accent)", fontWeight:600 },
  sbNavAccent:  { },
  addBadge:     { marginLeft:"auto", background:"var(--accent)", color:"#111", width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" },
  sbBottom:     { display:"flex", gap:6, padding:"12px 10px 16px", borderTop:"1px solid var(--border-light)" },
  sbAction:     { flex:1, background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:500, fontFamily:"var(--font)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" },
  main:         { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" },
  topBar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", background:"var(--bg-card)", borderBottom:"1px solid var(--border-light)", position:"sticky", top:0, zIndex:100 },
  menuBtn:      { background:"transparent", border:"none", cursor:"pointer", padding:"6px", display:"flex", flexDirection:"column" },
  pageTitle:    { margin:0, fontSize:16, fontWeight:700, color:"var(--text-primary)" },
  iconBtn:      { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 },
  notifDot:     { position:"absolute", top:-5, right:-5, background:"var(--red)", color:"#fff", fontSize:9, fontWeight:700, width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" },
  avatarBtn:    { background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"50%", width:34, height:34, fontSize:17, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  budgetBanner: { display:"flex", alignItems:"center", gap:10, padding:"10px 18px", background:"var(--accent-subtle)", borderBottom:"1px solid rgba(245,158,11,0.25)", fontSize:13 },
  budgetBannerBtn:{ background:"var(--accent)", border:"none", color:"#111", padding:"5px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, whiteSpace:"nowrap", fontFamily:"var(--font)" },
  content:      { flex:1, overflowY:"auto", paddingBottom:72 },
  bottomNav:    { position:"fixed", bottom:0, left:0, right:0, background:"var(--bg-card)", borderTop:"1px solid var(--border-light)", display:"flex", zIndex:100 },
  bottomItem:   { flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 4px 10px", background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontFamily:"var(--font)" },
  bottomActive: { color:"var(--accent)" },
  bottomAccent: { },
};
