import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LogoIcon } from "../components/LogoIcon";
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
import { DashboardSkeleton, PageSkeleton, HistorySkeleton, AnalyticsSkeleton, AddExpenseSkeleton, ProfileSkeleton, RewardsSkeleton } from "../components/SkeletonLoader";
import { NotificationCenter } from "../components/NotificationCenter";
import { classifyUser, formatPKR } from "../utils/helpers";
import { LayoutDashboard, PieChart as PieChartIcon, Plus, History, Lightbulb, Trophy, User as UserIcon, Menu, X, Sun, Moon, Globe, Bell, LogOut, Repeat, Target, MoreHorizontal, MoreVertical, ShieldCheck } from "lucide-react";


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

const MOBILE_NAV = ["dashboard", "analytics", "addExpense", "history"];
const MOBILE_MORE = ["recurring", "goals", "advice", "rewards", "profile"];

export default function MainApp({ tab = "dashboard" }) {
  const navigate = useNavigate();
  const { user, lang, setLang, expenses, monthlyExpenses, budget, setBudget, addExpense, deleteExpense, unreadCount, theme, toggleTheme, logout, celebrationReward, setCelebrationReward } = useApp();
  
  const [showNotif,   setShowNotif]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const prevTabRef = useRef(tab);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show skeleton briefly when switching tabs (HCI: system status visibility)
  useEffect(() => {
    if (prevTabRef.current !== tab) {
      setPageLoading(true);
      const timer = setTimeout(() => {
        setPageLoading(false);
        prevTabRef.current = tab;
      }, 450); // Slightly longer for better visibility of content-matched skeletons
      return () => clearTimeout(timer);
    }
  }, [tab]);

  // Map route keys to human readable paths if needed, 
  // but we'll use a direct mapping for simplicity
  const activeTab = tab; 

  const handleTabChange = useCallback((key) => {
    if (key === activeTab) return;
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
    setShowMoreMenu(false);
  }, [activeTab, navigate]);

  const t          = translations;
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
      {/* Sidebar Overlay - only on desktop */}
      {!isMobile && (
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
                    <LogoIcon size={44} showName />
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
                    <motion.button 
                      key={n.key} 
                      className="nav-hover"
                      onClick={() => handleTabChange(n.key)}
                      style={{ ...ms.sbNavItem, ...(activeTab === n.key ? ms.sbNavActive : {}) }}
                      whileHover={{ x: activeTab !== n.key ? 6 : 0, backgroundColor: activeTab !== n.key ? "rgba(245, 184, 0, 0.06)" : undefined }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span style={{ ...ms.sbNavIcon, background: activeTab===n.key ? "var(--accent)" : "var(--bg-input)", color: activeTab===n.key ? "#111" : "var(--text-muted)" }}>{n.icon}</span>
                      <span>{n.label}</span>
                    </motion.button>
                  ))}
                </div>

                <div style={ms.sbBottom}>
                <motion.button 
                  className="nav-hover" 
                  style={ms.sbAction} 
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(245, 184, 0, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </motion.button>

                <motion.button 
                  className="nav-hover" 
                  style={{ ...ms.sbAction, color:"var(--red)", borderColor:"rgba(239,68,68,0.2)" }} 
                  onClick={logout}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </motion.button>
              </div>
            </motion.div>
          </>
          )}
        </AnimatePresence>
      )}

      {/* ── MAIN ── */}
      <div style={ms.main}>
        {/* Top bar */}
        <header style={ms.topBar} className="app-topbar">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {!isMobile && (
              <motion.button 
                style={ms.iconBtn} 
                onClick={() => setSidebarOpen(true)}
                whileHover={{ scale:1.1, background:"var(--accent-subtle)" }}
                whileTap={{ scale:0.9 }}
              >
                <Menu size={16} />
              </motion.button>
            )}
            <div className="nav-logo-group" onClick={() => handleTabChange("dashboard")} style={{ cursor:'pointer', display:'flex', alignItems:'center' }}>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                <LogoIcon size={36} showName nameSize={18} />
              </motion.div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {/* Rewards shortcut */}
            <motion.button 
              style={ms.iconBtn} 
              onClick={() => handleTabChange("rewards")} 
              title="Your Rewards"
              whileHover={{ scale: 1.1, background: "var(--accent-subtle)" }} 
              whileTap={{ scale: 0.9 }}
              className="hide-mobile app-icon-btn"
            >
              <Trophy size={16} color="var(--accent)" />
            </motion.button>

            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <motion.button style={ms.iconBtn} onClick={() => setShowNotif(!showNotif)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="app-icon-btn">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -2, right: -2,
                    background: "var(--red)", color: "white",
                    fontSize: 9, fontWeight: "bold",
                    width: 14, height: 14, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--bg-card)"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>
              <AnimatePresence>
                {showNotif && <NotificationCenter onClose={() => setShowNotif(false)} />}
              </AnimatePresence>
            </div>
            {/* Avatar with optional verified badge */}
            <div style={{ position: "relative" }}>
              <motion.button style={{ ...ms.avatarBtn, overflow:"hidden" }} onClick={() => handleTabChange("profile")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="app-avatar-btn">
                {user?.photo ? (
                  <img src={user.photo} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : (
                  user?.avatar||"🧑‍💻"
                )}
              </motion.button>
              {user?.isEmailVerified && (
                <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--bg-card)", borderRadius: "50%", padding: 2, display: "flex" }}>
                  <ShieldCheck size={12} color="var(--green)" fill="var(--green-bg)" />
                </div>
              )}
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

        {/* Email verification warning */}
        {user && !user.isEmailVerified && activeTab !== "profile" && (
          <motion.div
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            style={ms.verifyBanner}
          >
            <span>🔒</span>
            <span style={{ flex:1, fontSize:13 }}>Your email is not verified. Verify your email to secure your account and enable all features.</span>
            <motion.button style={ms.verifyBannerBtn} onClick={() => handleTabChange("profile")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Verify Now →</motion.button>
          </motion.div>
        )}

        <div style={ms.content} className="app-content">
          <AnimatePresence mode="wait">
            {pageLoading ? (
              <motion.div key="skeleton"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.15 }}
              >
                {activeTab === "dashboard" ? <DashboardSkeleton /> 
                  : activeTab === "history" ? <HistorySkeleton /> 
                  : activeTab === "analytics" ? <AnalyticsSkeleton />
                  : activeTab === "addExpense" ? <AddExpenseSkeleton />
                  : activeTab === "profile" ? <ProfileSkeleton />
                  : activeTab === "rewards" ? <RewardsSkeleton />
                  : <PageSkeleton />}
              </motion.div>
            ) : (
              <motion.div key={activeTab}
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.25, ease:[0.25, 0.46, 0.45, 0.94] }}
              >
                {renderPage()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav - Always visible as requested */}
        <nav style={ms.bottomNav} className="app-bottom-nav">
          {(() => {
            // Logic for a balanced 5-item bar: [2 Left] [FAB] [2 Right/More]
            const items = [
              NAV.find(n => n.key === "dashboard"),
              NAV.find(n => n.key === "analytics"),
              NAV.find(n => n.key === "addExpense"),
              NAV.find(n => n.key === "history"),
              { key: "more", icon: <MoreHorizontal size={22} />, label: "More" }
            ];

            return items.map(n => {
              if (!n) return null;

              if (n.key === "addExpense") {
                return (
                  <div key={n.key} style={ms.bottomFabWrap}>
                    <motion.button
                      style={ms.bottomFab}
                      onClick={() => handleTabChange(n.key)}
                      className="app-bottom-fab"
                      whileHover={{ scale: 1.15, y: -5, boxShadow: "0 12px 24px rgba(245,184,0,0.5)" }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus size={32} />
                    </motion.button>
                  </div>
                );
              }

              if (n.key === "more") {
                return (
                  <motion.button
                    key="more-btn"
                    className="nav-hover"
                    style={{ ...ms.bottomItem, ...(showMoreMenu ? ms.bottomActive : {}) }}
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    whileHover={{ y: -4 }}
                  >
                    <div style={{ 
                      ...ms.bottomIconWrap, 
                      background: showMoreMenu ? "var(--accent-subtle)" : "transparent",
                      color: showMoreMenu ? "var(--accent)" : "var(--text-muted)"
                    }}>
                      <MoreHorizontal size={22} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: showMoreMenu ? 800 : 500 }}>More</span>
                  </motion.button>
                );
              }

              const active = activeTab === n.key;
              return (
                <motion.button
                  key={n.key}
                  className={`nav-hover app-bottom-item${activeTab === n.key && !showMoreMenu ? " app-bottom-active" : ""}`}
                  style={{ ...ms.bottomItem, ...(activeTab === n.key && !showMoreMenu ? ms.bottomActive : {}) }}
                  onClick={() => handleTabChange(n.key)}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <div style={{ 
                    ...ms.bottomIconWrap, 
                    background: active ? "var(--accent-subtle)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)"
                  }}>
                    {n.icon}
                    {active && (
                      <motion.div 
                        layoutId="nav-active-glow" 
                        style={{ position:"absolute", inset:-4, borderRadius:18, background:"var(--accent-glow)", filter:"blur(12px)", zIndex:-1 }} 
                      />
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, letterSpacing:"-0.2px", opacity: active ? 1 : 0.7 }}>
                    {n.key === "advice" ? "AI" : n.label}
                  </span>
                  {active && (
                    <motion.div 
                      layoutId="active-pill"
                      style={{ position:"absolute", bottom: -8, width: 4, height: 4, borderRadius:"50%", background:"var(--accent)", boxShadow:"0 0 8px var(--accent)" }}
                    />
                  )}
                </motion.button>
              );
            });
          })()}
        </nav>
        {/* More menu */}
        <AnimatePresence>
          {showMoreMenu && (
            <>
              {/* Tap outside to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position:"fixed", inset:0, zIndex:198 }}
                onClick={() => setShowMoreMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                style={ms.moreMenu}
                className="app-more-menu"
              >
                {/* ── Nav pages ── */}
                {(() => {
                  const shownKeys = ["dashboard", "analytics", "addExpense", "history"];
                  const moreItems = NAV.filter(n => !shownKeys.includes(n.key));
                  return moreItems.map(n => {
                    const isActive = activeTab === n.key;
                    return (
                      <motion.button
                        key={n.key}
                        className="nav-hover"
                        onClick={() => handleTabChange(n.key)}
                        style={{ ...ms.moreItem, ...(isActive ? ms.moreActive : {}) }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <div style={{ ...ms.moreIcon, color: isActive ? "#111" : "var(--text-secondary)" }}>
                          {n.icon}
                        </div>
                        <span style={{ fontWeight: isActive ? 800 : 600, fontSize: 11 }}>{n.label}</span>
                      </motion.button>
                    );
                  });
                })()}

                {/* ── Divider ── */}
                <div style={{
                  gridColumn: "1 / -1",
                  height: 1,
                  background: "var(--border)",
                  margin: "4px 0",
                  borderRadius: 1,
                }} />

                {/* ── Theme toggle ── */}
                <motion.button
                  className="nav-hover"
                  onClick={() => { toggleTheme(); }}
                  style={ms.moreItem}
                  whileTap={{ scale: 0.96 }}
                >
                  <div style={{ ...ms.moreIcon, color: "var(--text-secondary)" }}>
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 11 }}>
                    {theme === "dark" ? "Light" : "Dark"}
                  </span>
                </motion.button>

                {/* ── Logout ── */}
                <motion.button
                  className="nav-hover"
                  onClick={() => { setShowMoreMenu(false); logout(); }}
                  style={{ ...ms.moreItem, background:"var(--red-bg)", borderColor:"rgba(239,68,68,0.25)", color:"var(--red)" }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div style={{ ...ms.moreIcon, color: "var(--red)" }}>
                    <LogOut size={20} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 11, color:"var(--red)" }}>Log Out</span>
                </motion.button>

              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Celebration Popup */}
        <CelebrationPopup reward={celebrationReward} onClose={() => setCelebrationReward(null)} />
      </div>
    </div>
  );
}

const ms = {
  root:         { display:"flex", minHeight:"100vh", background:"var(--bg-primary)", color:"var(--text-primary)" },
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:290, backdropFilter:"blur(2px)" },
  sidebar:      { position:"fixed", top:0, left:0, bottom:0, width:240, background:"var(--bg-card)", borderRight:"1px solid var(--border)", zIndex:300, display:"flex", flexDirection:"column" },
  sidebarTop:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px", borderBottom:"1px solid var(--border-light)" },
  sbLogo:       { display:"flex", alignItems:"center", gap:8 },
  sbLogoIcon:   { width:28, height:28, background:"linear-gradient(135deg, var(--accent), #f97316)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 },
  sbBrand:      { fontSize:15, fontWeight:800, color:"var(--accent)" },
  sbClose:      { background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:16 },
  sbUser:       { display:"flex", alignItems:"center", gap:10, padding:"12px", borderBottom:"1px solid var(--border-light)" },
  sbUserName:   { margin:0, fontSize:13, fontWeight:700, color:"var(--text-primary)" },
  sbUserSub:    { margin:0, fontSize:11, color:"var(--text-muted)" },
  sbBudget:     { padding:"10px 12px", borderBottom:"1px solid var(--border-light)" },
  sbNav:        { flex:1, padding:"8px 6px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" },
  sbNavItem:    { display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"transparent", border:"none", color:"var(--text-muted)", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"var(--font)", transition:"all 0.15s" },
  sbNavActive:  { background:"var(--accent-subtle)", color:"var(--accent)", fontWeight:700 },
  sbNavIcon:    { width:28, height:28, borderRadius:"50%", background:"var(--bg-input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  sbBottom:     { display:"flex", gap:6, padding:"10px 8px 12px", borderTop:"1px solid var(--border-light)" },
  sbAction:     { flex:1, background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"6px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:500, fontFamily:"var(--font)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" },
  main:         { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", position:"relative", minWidth:0 },
  topBar:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--bg-card)", borderBottom:"1px solid var(--border-light)", position:"sticky", top:0, zIndex:100, gap:8 },
  menuBtn:      { background:"transparent", border:"none", cursor:"pointer", padding:"4px", display:"flex", flexDirection:"column" },
  backBtn:      { display:"flex", alignItems:"center", gap:4, background:"var(--accent-subtle)", border:"1px solid var(--accent)", borderRadius:8, padding:"4px 8px", cursor:"pointer", color:"var(--accent)" },
  topBrand:     { display:"flex", alignItems:"center", gap:6, marginLeft:4 },
  pageTitle:    { margin:0, fontSize:15, fontWeight:700, color:"var(--text-primary)" },
  iconBtn:      { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 },
  notifDot:     { position:"absolute", top:-4, right:-4, background:"var(--red)", color:"#fff", fontSize:9, fontWeight:700, width:14, height:14, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" },
  avatarBtn:    { background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"50%", width:32, height:32, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  budgetBanner: { display:"flex", alignItems:"center", gap:8, padding:"6px 14px", background:"var(--accent-subtle)", borderBottom:"1px solid var(--accent-glow)", fontSize:12, flexWrap:"wrap" },
  budgetBannerBtn:{ background:"var(--accent)", border:"none", color:"#111", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"var(--font)" },
  verifyBanner: { display:"flex", alignItems:"center", gap:8, padding:"6px 14px", background:"var(--red-bg)", borderBottom:"1px solid rgba(239,68,68,0.25)", fontSize:12, flexWrap:"wrap" },
  verifyBannerBtn:{ background:"var(--red)", border:"none", color:"#fff", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"var(--font)" },
  content:      { flex:1, overflowY:"auto", paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))" },
  bottomNav:    { position:"fixed", bottom:0, left:0, right:0, background:"var(--bg-card)", borderTop:"1px solid var(--border)", display:"flex", zIndex:100, height:"calc(56px + env(safe-area-inset-bottom, 0px))", alignItems:"center", paddingBottom:"env(safe-area-inset-bottom, 0px)", padding:"0 4px", boxShadow:"0 -4px 20px rgba(0,0,0,0.2)" },
  bottomItem:   { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"transparent", border:"none", color:"var(--text-secondary)", cursor:"pointer", fontFamily:"var(--font)", position:"relative", transition:"all 0.3s ease", height:"100%", gap:2, minWidth:0, padding:"0 2px" },
  bottomActive: { color:"var(--accent)" },
  bottomIconWrap:{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:10, transition:"all 0.3s ease" },
  bottomFabWrap:{ flex:1, display:"flex", justifyContent:"center", alignItems:"center", height:"100%" },
  bottomFab:    { width:44, height:44, borderRadius:14, background:"linear-gradient(135deg, var(--accent), #f97316)", color:"#111", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 4px 12px rgba(245,158,11,0.3)" },
  dropdown:     { position:"absolute", top:34, right:0, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, width:150, padding:6, zIndex:1000, boxShadow:"var(--shadow-lg)" },
  dropdownHeader:{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", padding:"6px 10px 4px" },
  dropdownItem: { width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"transparent", border:"none", color:"var(--text-primary)", borderRadius:8, cursor:"pointer", fontSize:12, textAlign:"left", fontFamily:"var(--font)", transition:"0.2s" },
  moreMenu:     { position:"fixed", bottom:"calc(60px + env(safe-area-inset-bottom, 0px))", left:"50%", transform:"translateX(-50%)", background:"var(--bg-card)", border:"1px solid var(--border)", zIndex:199, padding:"12px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, borderRadius:20, width:"calc(100% - 24px)", maxWidth:420, boxShadow:"0 -4px 40px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.5)" },
  moreItem:     { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 6px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text-muted)", cursor:"pointer", fontFamily:"var(--font)", fontSize:11, transition:"all 0.2s ease" },
  moreActive:   { background:"var(--accent)", color:"#111", fontWeight: 800, borderColor:"var(--bg-card)" },
  moreIcon:     { display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
};
