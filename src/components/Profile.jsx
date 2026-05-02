import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { formatPKR, classifyUser, SEED_EXPENSES } from "../utils/helpers";
import { categoryAPI } from "../services/api.js";
import { User as UserIcon, Edit3, Wallet, Settings, LogOut, DownloadCloud, Camera, Palette, DollarSign, CalendarDays, Zap, FileText, Trophy, Plus, Layout, ChevronLeft } from "lucide-react";

const AVATARS = ["🧑‍💻","👨‍🎓","👩‍🎓","🧑‍🎓","👦","👧","🧑","🧑‍💼","🧑‍🔬","🧑‍🎨","🧕","🧔"];
const CAT_ICONS = { food:"🍔", transport:"🚌", books:"📚", health:"💊", entertainment:"🎮", clothing:"👕", other:"📦" };
const CAT_COLORS= { food:"#f59e0b", transport:"#3b82f6", books:"#8b5cf6", health:"#10b981", entertainment:"#ec4899", clothing:"#f97316", other:"#6b7280" };
const PRESETS   = [5000,8000,10000,12000,15000,20000,25000,30000];

function streakCount(expenses) {
  const dates = new Set(expenses.map(e => e.date));
  let s = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate()-i);
    if (dates.has(d.toISOString().slice(0,10))) s++;
    else if (i > 0) break;
  }
  return s;
}
function thisMonth(expenses) {
  const m = new Date().toISOString().slice(0,7);
  return expenses.filter(e => e.date.startsWith(m)).reduce((s,e) => s+e.amount, 0);
}
function topCats(expenses) {
  const m = {};
  expenses.forEach(e => { m[e.category] = (m[e.category]||0)+e.amount; });
  return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,5);
}

export default function Profile({ setActiveTab }) {
  const { user, updateProfile, logout, expenses, addExpense, budget, setBudget, theme, toggleTheme, accent, setAccent, categories, addCategory, allTimeTotal, allTimeBudget, monthlySpent, effectiveMonthlyBudget, monthlyRemaining } = useApp();
  const [section, setSection] = useState("overview"); // overview | edit | budget | danger | categories
  const [editForm, setEditForm] = useState({ name:user?.name||"", avatar:user?.avatar||"🧑‍💻", photo:user?.photo||null });
  const [budgetInput, setBudgetInput] = useState(String(budget||""));
  const [newCategory, setNewCategory] = useState({ name:"", icon:"📦" });
  const [categoryError, setCategoryError] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  useEffect(() => {
    if (user) {
      setEditForm({ name:user.name||"", avatar:user.avatar||"🧑‍💻", photo:user.photo||null });
    }
  }, [user]);

  const createNewCategory = async () => {
    if (!newCategory.name.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    setCategoryLoading(true);
    setCategoryError('');

    try {
      await addCategory(newCategory.name.trim(), newCategory.icon);
      setNewCategory({ name:"", icon:"📦" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setCategoryError(error.message || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const userType    = classifyUser(allTimeTotal, effectiveMonthlyBudget);
  const streak      = streakCount(expenses);
  const pct         = effectiveMonthlyBudget > 0 ? Math.round((monthlySpent/effectiveMonthlyBudget)*100) : 0;
  const topCategories = topCats(expenses);
  const joinDate    = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-PK",{year:"numeric",month:"long",day:"numeric"}) : "Today";

  const typeConfig = {
    saver:    { label:"💚 Smart Saver",    bg:"var(--green-bg)",   color:"var(--green)",  desc:"You're managing your budget excellently!" },
    balanced: { label:"🟡 Balanced",       bg:"var(--accent-subtle)", color:"var(--accent)", desc:"Good balance! A bit more effort and you'll be a top saver." },
    spender:  { label:"🔴 High Spender",   bg:"var(--red-bg)",    color:"var(--red)",    desc:"You've been overspending. Try setting stricter limits." },
  };
  const tc = typeConfig[userType];

  const saveProfile = async () => {
    if (!editForm.name.trim()) return;
    await updateProfile({ name:editForm.name.trim(), avatar:editForm.avatar, photo:editForm.photo });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSection("overview"); }, 1200);
  };

  const saveBudget = () => {
    const val = Number(budgetInput);
    if (!val || val <= 0) return;
    setBudget(val);
    setSaved(true);
    setTimeout(() => { setSaved(false); setSection("overview"); }, 1200);
  };

  const SECTIONS = [
    { key:"overview", label:"Overview",        icon: <UserIcon size={16} /> },
    { key:"edit",     label:"Edit Profile",     icon: <Edit3 size={16} /> },
    { key:"budget",   label:"Budget Settings",  icon: <Wallet size={16} /> },
    { key:"categories", label:"Categories",     icon: <Palette size={16} /> },
    { key:"appearance", label:"Appearance",     icon: <Layout size={16} /> },
    { key:"danger",   label:"Account",          icon: <Settings size={16} /> },
  ];

  return (
    <div style={P.root}>
      {/* Header with Back */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <motion.button 
          style={P.backCircle} 
          onClick={() => setActiveTab("dashboard")}
          whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
          whileTap={{ scale:0.9 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </motion.button>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>Profile</h2>
      </div>

      {/* Profile hero card */}
      <div style={P.heroCard}>
        <div style={P.heroLeft}>
          <div 
            style={{ ...P.avatarWrap, cursor: "pointer" }} 
            onClick={() => setSection("edit")}
            title="Change Profile Picture"
          >
            {user?.photo ? (
              <img src={user?.photo} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              user?.avatar || "🧑‍💻"
            )}
            <motion.div style={P.avatarOverlay} whileHover={{ opacity: 1 }}><Camera size={20} /></motion.div>
          </div>
          <div>
            <h2 style={P.userName}>{user?.name}</h2>
            <p style={P.userEmail}>{user?.email}</p>
            {user?.university && <p style={P.userMeta}>{user.university} · {user.major || "Student"}</p>}
            <p style={P.userJoin}>Member since {joinDate}</p>
          </div>
        </div>
        <div style={{ ...P.typeBadge, background:tc.bg, border:`1px solid ${tc.color}40` }}>
          <span style={{ color:tc.color, fontWeight:700, fontSize:13 }}>{tc.label}</span>
          <span style={{ color:"var(--text-muted)", fontSize:11 }}>{tc.desc}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={P.tabs}>
        {SECTIONS.map(s => (
          <motion.button key={s.key} style={{ ...P.tab, ...(section===s.key ? P.tabActive : {}) }} onClick={() => setSection(s.key)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span>{s.icon}</span><span style={{ fontSize:13 }}>{s.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>

          {/* ── OVERVIEW ── */}
          {section==="overview" && (
            <div style={P.grid}>
              {/* Stats */}
              <div style={P.card}>
                <h3 style={P.cardTitle}>Your Stats</h3>
                <div style={P.statsGrid}>
                  {[
                    { icon: <DollarSign size={20} />, label:"All Time Spent",    value:formatPKR(allTimeTotal),  color:"var(--red)" },
                    { icon: <Wallet size={20} />, label:"All Time Budget",  value:formatPKR(allTimeBudget),      color:"var(--blue)" },
                    { icon: <CalendarDays size={20} />, label:"This Month Spent",      value:formatPKR(monthlySpent),  color:"var(--accent)" },
                    { icon: <Zap size={20} />, label:"This Month Budget",     value:formatPKR(effectiveMonthlyBudget), color:"var(--green)" },
                    { icon: <Trophy size={20} />, label:"Day Streak",      value:`${streak} days`,       color:"var(--orange)" },
                    { icon: <FileText size={20} />, label:"Total Expenses",  value:`${expenses.length}`,   color:"var(--purple)" },
                  ].map(s => (
                    <div key={s.label} style={P.statCard}>
                      <span style={{ color: s.color, background: s.color + "1A", padding: 8, borderRadius: 8, marginBottom: 8, display: "inline-flex" }}>{s.icon}</span>
                      <p style={{ ...P.statValue, color:s.color }}>{s.value}</p>
                      <p style={P.statLabel}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget status */}
              {effectiveMonthlyBudget === 0 ? (
                <div style={{ ...P.card, border:"1px solid var(--accent)", background:"var(--accent-subtle)" }}>
                  <div style={{ textAlign:"center", padding:"10px 0" }}>
                    <span style={{ fontSize:36, display:"block", marginBottom:10 }}>⚠️</span>
                    <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:"var(--accent)" }}>No Budget Set!</h3>
                    <p style={{ margin:"0 0 16px", fontSize:13, color:"var(--text-secondary)" }}>Set your monthly budget to start tracking how much you can spend.</p>
                    <motion.button style={P.setBudgetBtn} onClick={() => setSection("budget")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>💰 Set My Budget Now</motion.button>
                  </div>
                </div>
              ) : (
                <div style={P.card}>
                  <h3 style={P.cardTitle}>This Month's Status</h3>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13, color:"var(--text-secondary)" }}>PKR {monthlySpent.toLocaleString()} of {effectiveMonthlyBudget.toLocaleString()} used</span>
                      <span style={{ fontSize:13, fontWeight:700, color: pct>=100?"var(--red)":pct>=80?"var(--accent)":"var(--green)" }}>{pct}%</span>
                    </div>
                    <div style={{ height:10, background:"var(--border)", borderRadius:5 }}>
                      <motion.div
                        style={{ height:"100%", borderRadius:5, background: pct>=100?"var(--red)":pct>=80?"#f59e0b":"var(--green)" }}
                        initial={{ width:0 }}
                        animate={{ width:`${Math.min(pct,100)}%` }}
                        transition={{ duration:1 }}
                      />
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:"var(--text-muted)" }}>Budget: {formatPKR(effectiveMonthlyBudget)}</span>
                    <span style={{ fontSize:12, color:monthlyRemaining>=0?"var(--green)":"var(--red)", fontWeight:600 }}>{monthlyRemaining>=0?"Remaining":"Overspent"}: {formatPKR(Math.abs(monthlyRemaining))}</span>
                  </div>
                </div>
              )}

              {/* Top categories */}
              <div style={P.card}>
                <h3 style={P.cardTitle}>Top Spending Categories</h3>
                {topCategories.length === 0 ? (
                  <p style={P.empty}>No expenses yet. Start tracking!</p>
                ) : topCategories.map(([catName, amt], i) => {
                  const pctCat = allTimeTotal > 0 ? Math.round((amt/allTimeTotal)*100) : 0;
                  const categoryInfo = categories.find(c => c.name === catName) || { icon: '📦' };
                  return (
                    <div key={catName} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:16, width:24 }}>{categoryInfo.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:13, color:"var(--text-primary)", textTransform:"capitalize" }}>{catName}</span>
                          <span style={{ fontSize:12, color:"var(--text-muted)" }}>{pctCat}% · {formatPKR(amt)}</span>
                        </div>
                        <div style={{ height:4, background:"var(--border)", borderRadius:2 }}>
                          <motion.div style={{ height:"100%", borderRadius:2, background:"var(--accent)" }} initial={{ width:0 }} animate={{ width:`${pctCat}%` }} transition={{ duration:0.8, delay:i*0.1 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Appearance */}
              <div style={P.card}>
                <h3 style={P.cardTitle}><span style={{ display:"inline-flex", alignItems:"center", gap:8 }}><Palette size={18} /> Appearance</span></h3>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><p style={{ margin:0, fontSize:13, color:"var(--text-primary)", fontWeight:500 }}>Theme</p><p style={{ margin:0, fontSize:12, color:"var(--text-muted)" }}>{theme==="dark" ? "Dark mode" : "Light mode"} active</p></div>
                  <motion.button style={P.themeToggle} onClick={toggleTheme} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
                    {theme==="dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT PROFILE ── */}
          {section==="edit" && (
            <div style={P.card}>
              <h3 style={P.cardTitle}>Edit Profile</h3>
              <div style={{ marginBottom:20, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--bg-elevated)", border:"2px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, overflow:"hidden" }}>
                    {editForm.photo ? <img src={editForm.photo} alt="Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : editForm.avatar}
                  </div>
                  <motion.button 
                    style={{ position:"absolute", bottom:-4, right:-4, background:"var(--accent)", color:"#111", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }}
                    onClick={() => fileRef.current?.click()}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    title="Upload Photo"
                  >
                    <Camera size={16} />
                  </motion.button>
                  <input 
                    type="file" accept="image/*" ref={fileRef} style={{ display:"none" }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setEditForm(f => ({ ...f, photo: reader.result }));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 600, color: "var(--accent)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                  Click to Upload Profile Photo
                </p>
                <label style={P.fieldLabel}>Or select an emoji avatar</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:320 }}>
                  {AVATARS.map(a => (
                    <motion.button key={a} style={{ ...P.avatarBtn, ...(editForm.avatar===a && !editForm.photo ? P.avatarActive : {}) }} onClick={() => setEditForm(f => ({...f, avatar:a, photo:null}))} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>{a}</motion.button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={P.fieldLabel}>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name:e.target.value}))} style={P.input} />
              </div>
              <AnimatePresence>
                {saved && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={P.savedMsg}>✅ Profile saved!</motion.div>}
              </AnimatePresence>
              <div style={{ display:"flex", gap:10 }}>
                <motion.button style={P.cancelBtn} onClick={() => setSection("overview")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button style={P.saveBtn} onClick={saveProfile} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Save Changes</motion.button>
              </div>
            </div>
          )}

          {/* ── BUDGET ── */}
          {section==="budget" && (
            <div style={P.card}>
              <h3 style={P.cardTitle}>Budget Settings</h3>
              {budget === 0 && (
                <div style={{ background:"var(--accent-subtle)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
                  <p style={{ margin:0, fontSize:13, color:"var(--accent)" }}>⚠️ You haven't set a budget yet. Set one below to start tracking!</p>
                </div>
              )}
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:16 }}>
                Current budget: <strong style={{ color:"var(--text-primary)" }}>{budget > 0 ? formatPKR(budget) : "Not set"}</strong>
              </p>
              <label style={P.fieldLabel}>Monthly Budget (PKR)</label>
              <div style={P.budgetInputRow}>
                <span style={{ fontSize:20, color:"var(--accent)", fontWeight:700 }}>₨</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  style={{ ...P.input, fontSize:22, fontWeight:700, border:"none", background:"transparent", flex:1 }}
                  placeholder="15000"
                  min="1"
                />
              </div>
              <div style={{ marginBottom:18 }}>
                <p style={P.fieldLabel}>Quick Presets</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {PRESETS.map(p => (
                    <motion.button key={p} style={{ ...P.presetBtn, ...(budgetInput===String(p) ? P.presetActive : {}) }} onClick={() => setBudgetInput(String(p))} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      PKR {p.toLocaleString()}
                    </motion.button>
                  ))}
                </div>
              </div>
              <AnimatePresence>{saved && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={P.savedMsg}>✅ Budget updated!</motion.div>}</AnimatePresence>
              <div style={{ display:"flex", gap:10 }}>
                <motion.button style={P.cancelBtn} onClick={() => setSection("overview")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button style={P.saveBtn} onClick={saveBudget} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>💰 Set Budget</motion.button>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {section==="categories" && (
            <div style={P.card}>
              <h3 style={P.cardTitle}>Manage Categories</h3>
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:18 }}>Add new expense categories to customize your tracking. You can then use these categories when adding expenses.</p>
              
              {categoryError && (
                <div style={{ background:"rgba(239, 68, 68, 0.1)", border:"1px solid rgba(239, 68, 68, 0.3)", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"var(--red)", fontSize:13 }}>
                  {categoryError}
                </div>
              )}

              <div style={{ marginBottom:20 }}>
                <label style={P.fieldLabel}>Category Name</label>
                <input 
                  value={newCategory.name} 
                  onChange={e => setNewCategory({...newCategory, name:e.target.value})} 
                  style={P.input} 
                  placeholder="e.g., Groceries, Gas, Entertainment"
                />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={P.fieldLabel}>Choose an Emoji Icon</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {['🍔','🍕','🍜','☕','🥤','🛒','🚌','🚗','🏍️','⛽','📚','📖','💊','🏥','🎮','🎬','👕','👟','👜','✈️','🏋️','🎓','🏠','🏢','💻','📱','⚽','🎪','💡','💰','🎁','🐾','👶','💄','🔧','🎵','📦','🧹','🏖️','📌'].map(emoji => (
                    <motion.button 
                      key={emoji}
                      style={{ 
                        ...P.emojiBtn, 
                        ...(newCategory.icon===emoji ? { border:"2px solid var(--accent)", background:"var(--accent-subtle)" } : {})
                      }} 
                      onClick={() => setNewCategory({...newCategory, icon:emoji})}
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button 
                style={{ ...P.saveBtn, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                onClick={createNewCategory}
                disabled={categoryLoading}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                <Plus size={16} /> {categoryLoading ? 'Adding...' : 'Add New Category'}
              </motion.button>

              <div style={{ marginTop:28, borderTop:"1px solid var(--border)", paddingTop:20 }}>
                <h4 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Existing Categories</h4>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:10 }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:12, textAlign:"center" }}>
                      <div style={{ fontSize:24, marginBottom:6 }}>{cat.icon || '📦'}</div>
                      <p style={{ margin:0, fontSize:12, color:"var(--text-secondary)", wordBreak:"break-word" }}>{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {section==="appearance" && (
            <div style={P.card}>
              <h3 style={P.cardTitle}>Interface Theme</h3>
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20 }}>Customize the look and feel of your app.</p>
              
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:10 }}>Color Mode</h4>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => theme === "light" ? toggleTheme() : null} style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${theme==="dark"?"var(--accent)":"var(--border)"}`, background:"var(--bg-primary)", color:"var(--text-primary)", fontWeight:600, cursor:"pointer", transition: "all 0.2s" }}>🌙 Dark Mode</button>
                  <button onClick={() => theme === "dark" ? toggleTheme() : null} style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${theme==="light"?"var(--accent)":"var(--border)"}`, background:"#f5f6fa", color:"#1a1d2e", fontWeight:600, cursor:"pointer", transition: "all 0.2s" }}>☀️ Light Mode</button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:10 }}>Accent Color</h4>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))", gap:10 }}>
                  {[
                    { id:"orange", name:"Dark Orange", hex:"#f59e0b" },
                    { id:"blue", name:"Midnight Blue", hex:"#3b82f6" },
                    { id:"emerald", name:"Emerald Green", hex:"#10b981" },
                    { id:"rose", name:"Rose Gold", hex:"#f43f5e" },
                    { id:"purple", name:"Royal Purple", hex:"#8b5cf6" }
                  ].map(c => (
                    <button key={c.id} onClick={() => setAccent(c.id)} style={{ padding:"12px 8px", borderRadius:10, border:`2px solid ${accent===c.id?c.hex:"var(--border)"}`, background:accent===c.id?`${c.hex}1A`:"var(--bg-input)", color:"var(--text-primary)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", transition:"all 0.2s" }}>
                      <span style={{ width:24, height:24, borderRadius:"50%", background:c.hex, boxShadow:`0 0 10px ${c.hex}80` }} />
                      <span style={{ fontSize:11, fontWeight:600 }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DANGER/ACCOUNT ── */}
          {section==="danger" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={P.card}>
                <h3 style={P.cardTitle}>Sample Data</h3>
                <p style={{ fontSize:13, color:"var(--text-secondary)", margin:"0 0 14px" }}>Load sample expenses to explore the app's features before adding your own data.</p>
                <motion.button style={P.dangerBtn2} onClick={() => {
                  if (expenses.length === 0) {
                    SEED_EXPENSES.forEach(e => addExpense(e));
                  }
                }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><DownloadCloud size={16} style={{ marginRight:8 }} />Load Sample Expenses</motion.button>
              </div>
              <div style={{ ...P.card, border:"1px solid var(--red)" }}>
                <h3 style={{ ...P.cardTitle, color:"var(--red)" }}>Sign Out</h3>
                <p style={{ fontSize:13, color:"var(--text-secondary)", margin:"0 0 14px" }}>You'll be signed out of your account on this device. Your data will be saved.</p>
                <motion.button style={P.dangerBtn} onClick={logout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><LogOut size={16} style={{ marginRight:8 }} />Sign Out</motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const P = {
  root:         { padding:20, display:"flex", flexDirection:"column", gap:14, maxWidth:720, margin:"0 auto" },
  heroCard:     { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, padding:"28px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap:"wrap", boxShadow:"var(--shadow-sm)" },
  heroLeft:     { display:"flex", alignItems:"center", gap:20 },
  avatarWrap:   { width:84, height:84, borderRadius:"50%", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, flexShrink:0, border:"3px solid var(--bg-card)", boxShadow:"0 0 0 2px var(--border)", overflow:"hidden", position: "relative" },
  avatarOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", opacity: 0, transition: "opacity 0.2s" },
  userName:     { margin:0, fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  userEmail:    { margin:"3px 0 2px", fontSize:13, color:"var(--text-muted)" },
  userMeta:     { margin:"0 0 2px", fontSize:12, color:"var(--text-secondary)" },
  userJoin:     { margin:0, fontSize:11, color:"var(--text-muted)" },
  typeBadge:    { padding:"10px 16px", borderRadius:12, display:"flex", flexDirection:"column", gap:3, textAlign:"right", alignSelf:"flex-start" },
  tabs:         { display:"flex", gap:8, borderBottom:"1px solid var(--border-light)", paddingBottom:4, overflowX:"auto" },
  tab:          { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 16px", background:"transparent", border:"none", borderBottom:"2px solid transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap", fontFamily:"var(--font)", transition:"all 0.2s" },
  tabActive:    { color:"var(--text-primary)", borderBottom:"2px solid var(--accent)" },
  grid:         { display:"flex", flexDirection:"column", gap:14 },
  card:         { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px" },
  cardTitle:    { margin:"0 0 16px", fontSize:15, fontWeight:700, color:"var(--text-primary)" },
  statsGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 },
  statCard:     { background:"var(--bg-input)", borderRadius:10, padding:"12px 10px", textAlign:"center" },
  statValue:    { margin:"6px 0 3px", fontSize:14, fontWeight:700 },
  statLabel:    { margin:0, fontSize:10, color:"var(--text-muted)" },
  setBudgetBtn: { background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", padding:"11px 24px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"var(--font)" },
  empty:        { color:"var(--text-muted)", fontSize:13, textAlign:"center", padding:"16px 0" },
  themeToggle:  { background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)", padding:"9px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"var(--font)" },
  fieldLabel:   { display:"block", fontSize:11, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 },
  input:        { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:10, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"var(--font)" },
  avatarBtn:    { width:38, height:38, borderRadius:10, background:"var(--bg-input)", border:"1px solid var(--border)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  avatarActive: { background:"var(--accent-subtle)", border:"1px solid var(--accent)" },
  savedMsg:     { background:"var(--green-bg)", border:"1px solid var(--green)", color:"var(--green)", padding:"9px 12px", borderRadius:8, fontSize:13, marginBottom:12 },
  cancelBtn:    { flex:1, background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"11px", borderRadius:10, cursor:"pointer", fontSize:14, fontFamily:"var(--font)" },
  saveBtn:      { flex:2, background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", padding:"11px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"var(--font)" },
  budgetInputRow:{ display:"flex", alignItems:"center", gap:8, background:"var(--bg-input)", border:"2px solid var(--accent-subtle)", borderRadius:12, padding:"12px 16px", marginBottom:20, transition:"border-color 0.2s" },
  presetBtn:    { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"var(--font)", transition:"all 0.2s" },
  presetActive: { background:"var(--accent-subtle)", border:"1px solid var(--accent)", color:"var(--accent)", fontWeight:600 },
  dangerBtn:    { width:"100%", padding:"12px", background:"var(--red-bg)", border:"1px solid var(--red)", color:"var(--red)", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"var(--font)" },
  backCircle:   { width:36, height:36, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  dangerBtn2:   { display:"flex", alignItems:"center", justifyContent:"center", background:"var(--blue-bg)", border:"1px solid var(--blue)", color:"var(--blue)", padding:"12px 20px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"var(--font)", transition:"background 0.2s" },
  emojiBtn:     { background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, padding:"10px", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" },
};
