import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatPKR, getPredictionDays, classifyUser, getSmartAdvice } from "../utils/helpers";
import { Brain, Lightbulb, TrendingUp, ShieldCheck, AlertCircle, PlusCircle, ArrowUpRight } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "../i18n/translations";
import { useApp } from "../context/AppContext";
// CelebrationPopup removed from here, moved to MainApp.jsx

const COLORS = ["#f5b800","#3b82f6","#8b5cf6","#10b981","#ec4899","#f97316","#06b6d4","#ef4444","#84cc16","#6366f1"];

// 3D Tilt Card Component
function TiltCard({ children, style, delay = 0, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 18 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 18 });

  const rotateX = useTransform(mouseYSpring, [-0.2, 0.2], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.2, 0.2], ["-3deg", "3deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct * 0.8);
    y.set(yPct * 0.8);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`card-hover ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      style={{
        ...style,
        perspective: 1000,
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      whileHover={{ scale: 1.01, zIndex: 10 }}
    >
      <div style={{ transform: "translateZ(30px)" }}>
        {children}
      </div>
    </motion.div>
  );
}
const TT = { contentStyle:{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text-primary)", fontSize:12 }, cursor:{ fill:"rgba(255,255,255,0.04)" } };

function getLast7Days(expenses) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      day: label,
      amount: expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0),
      isToday: i === 6,
    };
  });
}

function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:40 }}>{icon}</span>
      <p style={{ margin:0, fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{title}</p>
      <p style={{ margin:0, fontSize:13, color:"var(--text-muted)", maxWidth:280 }}>{desc}</p>
      {action && <motion.button style={emptyBtn} onClick={onAction} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>{action}</motion.button>}
    </div>
  );
}

const emptyBtn = { marginTop:6, background:"linear-gradient(135deg,#f5b800,#ffd04a)", border:"none", color:"#111", padding:"10px 22px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--font)" };

// Custom tooltip for pie chart showing category name + amount
const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const { name, value } = payload[0];
  const idx = payload[0]?.payload?.idx ?? 0;
  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", boxShadow:"var(--shadow-md)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ width:10, height:10, borderRadius:"50%", background:COLORS[idx % COLORS.length], display:"inline-block" }} />
        <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", textTransform:"capitalize" }}>{name}</span>
      </div>
      <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>{formatPKR(value)}</span>
    </div>
  );
};

export default function Dashboard({ t, budget, setBudget, setActiveTab }) {
  const { expenses, categories, monthlySpent, monthlyExpenses, allTimeTotal, totalTrackingDays,
    daysSinceFirstExpense, previousMonthCarryOver, effectiveMonthlyBudget, monthlyRemaining,
    monthlyBreakdown, lang, budget: appBudget, allTimeBudget, isLoading, dueSubscriptions, goals = [], recurring = [] } = useApp();

  const totalSpent = monthlySpent;
  const remaining  = monthlyRemaining;
  const pct        = effectiveMonthlyBudget>0 ? Math.round((totalSpent/effectiveMonthlyBudget)*100) : 0;
  const predDays   = getPredictionDays(monthlyExpenses, effectiveMonthlyBudget);
  const userType   = classifyUser(totalSpent, effectiveMonthlyBudget);
  const barData    = getLast7Days(expenses);
  const catMap     = {};
  monthlyExpenses.forEach(e => { catMap[e.category]=(catMap[e.category]||0)+e.amount; });
  const pieData    = Object.entries(catMap).map(([name,value], idx)=>({name,value,idx})).sort((a,b)=>b.value-a.value);
  const topCategories = pieData.slice(0, 6);
  
  const recent     = [...expenses].sort((a,b) => {
    const dDiff = new Date(b.date) - new Date(a.date);
    if (dDiff !== 0) return dDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  }).slice(0, 6);

  const typeInfo = { saver:{ label:"💚 Saver", color:"var(--green)" }, balanced:{ label:"🟡 Balanced", color:"var(--accent)" }, spender:{ label:"🔴 Spender", color:"var(--red)" } };
  const ti = typeInfo[userType];

  const getIcon = (catName) => categories.find(c => c.name === catName)?.icon || getCategoryIcon(catName) || "📦";

  // Financial Health summary logic
  const activeGoals = (goals || []).filter(g => !g.isCompleted);
  const topGoal = activeGoals.length > 0 ? activeGoals.reduce((a, b) => {
    const aPct = a.targetAmount > 0 ? (a.savedAmount / a.targetAmount) : 0;
    const bPct = b.targetAmount > 0 ? (b.savedAmount / b.targetAmount) : 0;
    return aPct > bPct ? a : b;
  }) : null;
  const activeSubs = (recurring || []).filter(r => r.isActive);
  const totalMonthlySubs = activeSubs.reduce((s, r) => {
    const amt = Number(r.amount) || 0;
    if (r.frequency === "daily") return s + amt * 30;
    if (r.frequency === "weekly") return s + amt * 4.3;
    if (r.frequency === "monthly") return s + amt;
    return s;
  }, 0);
  const nextSub = activeSubs.length > 0 ? [...activeSubs].sort((a,b) => new Date(a.nextDueDate || 0) - new Date(b.nextDueDate || 0))[0] : null;

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div style={D.container}>
        <div className="shimmer" style={{ height: 180, borderRadius: 20, marginBottom: 20 }} />
        <div style={D.chartsGrid}>
          <div className="shimmer" style={{ height: 280, borderRadius: 16 }} />
          <div className="shimmer" style={{ height: 280, borderRadius: 16 }} />
        </div>
        <div style={{ ...D.chartsGrid, marginTop: 20 }}>
          <div className="shimmer" style={{ height: 340, borderRadius: 16 }} />
          <div className="shimmer" style={{ height: 340, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div style={D.container}>
        <motion.div style={D.welcomeCard} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <span style={{ fontSize:52 }}>👋</span>
          <h2 style={D.welcomeTitle}>Welcome, you're all set!</h2>
          <p style={D.welcomeSub}>Your dashboard is empty. Start by setting your budget in Profile, then add your first expense.</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
            <motion.button style={D.welcomeBtn} onClick={() => setActiveTab("addExpense")} whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>➕ Add First Expense</motion.button>
            <motion.button style={D.welcomeBtnOutline} onClick={() => setActiveTab("profile")} whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>💰 Set Budget</motion.button>
          </div>
          <div style={D.quickTips}>
            {["🎙️ Use Voice Input to log expenses hands-free","📸 Scan a receipt photo to auto-detect amount","📊 Charts will appear here as you track"].map(tip => (
              <div key={tip} style={D.quickTip}>{tip}</div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={D.container}>
      <div className="bg-orb" style={{ top: "10%", right: "5%", width: 300, height: 300, background: "var(--accent-subtle)" }} />
      <div className="bg-orb" style={{ bottom: "20%", left: "10%", width: 250, height: 250, background: "var(--purple-bg)" }} />

      {/* ⚠️ Due Subscriptions Alert */}
      {dueSubscriptions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={D.alertBanner}
          className="card-hover"
          onClick={() => setActiveTab("recurring")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🗓️</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>
                You have {dueSubscriptions} subscription{dueSubscriptions > 1 ? 's' : ''} due today!
              </p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "rgba(0,0,0,0.6)" }}>
                Click here to process your payments and update your budget.
              </p>
            </div>
          </div>
          <span style={{ fontSize: 18 }}>➜</span>
        </motion.div>
      )}

      {/* ── All-Time Overview Banner ── */}
      <TiltCard style={D.allTimeBanner}>
        <div style={D.allTimeHeader}>
          <span style={{ fontSize:18 }}>📊</span>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>All-Time Overview</span>
        </div>
        <div style={D.allTimeGrid}>
          {[
            { icon:"💰", label:"All-Time Spent", value:formatPKR(allTimeTotal), color:"var(--red)" },
            { icon:"📅", label:"Days Tracked", value:`${totalTrackingDays}`, color:"var(--blue)" },
            { icon:"⏳", label:"Days Active", value:`${daysSinceFirstExpense}`, color:"var(--purple)" },
            { icon:"📝", label:"Total Transactions", value:`${expenses.length}`, color:"var(--accent)" },
            { icon:"📈", label:"All-Time Budget", value:formatPKR(allTimeBudget), color:"var(--cyan)" },
          ].map((s, i) => (
            <motion.div key={s.label} style={D.allTimeStat} whileHover={{ y:-2, boxShadow:"var(--shadow-md)" }} transition={{ duration:0.15 }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <p style={{ margin:"4px 0 2px", fontSize:14, fontWeight:800, color:s.color, letterSpacing:"-0.3px" }}>{s.value}</p>
              <p style={{ margin:0, fontSize:10, color:"var(--text-muted)" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </TiltCard>

      {/* ── Monthly Budget card ── */}
      <TiltCard style={D.budgetCard} delay={0.1}>
        <div style={D.budgetTop}>
          <div>
            <p style={D.budgetLabel}>This Month's Budget</p>
            <div style={{ display:"flex", alignItems:"baseline", gap: 6 }}>
              <p style={D.budgetValue}>{formatPKR(effectiveMonthlyBudget)}</p>
              {previousMonthCarryOver > 0 && (
                <span style={{ fontSize:10, color:"var(--green)", fontWeight:700 }}>
                  (+{formatPKR(previousMonthCarryOver)})
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={D.budgetLabel}>Remaining</p>
            <p style={{ ...D.budgetValue, color: remaining>=0?"var(--green)":"var(--red)" }}>{formatPKR(Math.abs(remaining))}{remaining<0?" over":""}</p>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:6 }}>
          <span style={{ fontSize:11, color: remaining >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
            {remaining >= 0 ? "On track" : "Over budget"}
          </span>
          <span style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600 }}>{pct}% used</span>
        </div>
        <div style={{...D.progressTrack, marginBottom:8}}>
          <motion.div
            style={{ height:"100%", borderRadius:6, background: pct>=100?"var(--red)":pct>=80?"#f5b800":"linear-gradient(90deg,var(--green),var(--accent))" }}
            initial={{ width:0 }}
            animate={{ width:`${Math.min(pct,100)}%` }}
            transition={{ duration:1.2, ease:"easeOut" }}
          />
        </div>
        <div style={D.budgetFooter}>
          <span style={{ fontSize:11, color:"var(--text-muted)" }}>
            <span style={{ color:ti.color, fontWeight:700 }}>{ti.label}</span> · Resets monthly
          </span>
          {predDays !== null && (
            <span style={{ fontSize:11, color: predDays<5?"var(--red)":predDays<10?"var(--accent)":"var(--text-muted)", fontWeight:600 }}>
              {predDays<1 ? "⚠️ Empty" : `⏱ ~${predDays}d left`}
            </span>
          )}
        </div>
      </TiltCard>

      {/* ── AI Analysis Summary Card ── */}
      {expenses.length >= 3 && (
        <TiltCard style={{ ...D.overviewCard, background:"linear-gradient(135deg, var(--bg-card), var(--bg-input))", border:"1px solid var(--accent-subtle)" }} delay={0.15}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Brain size={20} color="var(--accent)" />
              </div>
              <h3 style={{ ...D.chartTitle, margin:0 }}>AI Financial Insights</h3>
            </div>
            <motion.button style={D.smallBtn} onClick={() => setActiveTab("advice")} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>Deep Analysis</motion.button>
          </div>
          
          <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
                <Lightbulb size={14} color="var(--accent)" />
                <span>Current Recommendation</span>
              </div>
              <p style={{ margin:0, fontSize:15, fontWeight:600, color:"var(--text-primary)", lineHeight:1.4 }}>
                {getSmartAdvice(expenses, lang)[0] || "Continue tracking to get personalized tips!"}
              </p>
            </div>
            
            <div style={{ textAlign:"right", paddingLeft:16, borderLeft:"1px solid var(--border)" }}>
              <div style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:1 }}>Spending Score</div>
              <div style={{ fontSize:28, fontWeight:900, color: pct<60?"var(--green)":pct<90?"var(--accent)":"var(--red)", marginTop:2 }}>
                {Math.max(0, 100 - Math.round(pct))}<span style={{ fontSize:14, fontWeight:600, opacity:0.7 }}>/100</span>
              </div>
            </div>
          </div>
        </TiltCard>
      )}

      {/* ── Financial Health: Goals & Subscriptions ── */}
      <div style={D.chartsGrid}>
        {/* Goals Progress Card */}
        <TiltCard style={D.overviewCard} delay={0.2}>
          <div style={D.cardHeader}>
            <h3 style={D.chartTitle}>🎯 Savings Goals</h3>
            <motion.button style={D.smallBtn} onClick={() => setActiveTab("goals")} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>Manage</motion.button>
          </div>
          <div style={D.goalsList}>
            {activeGoals.length > 0 ? (
              activeGoals.slice(0, 3).map(g => {
                const gp = Math.round((g.savedAmount / g.targetAmount) * 100);
                return (
                  <div key={g.id} style={D.goalItem}>
                    <div style={D.goalTop}>
                      <span style={{ fontSize:16 }}>{g.category === "Travel" ? "✈️" : g.category === "Gadgets" ? "💻" : g.category === "Emergency Fund" ? "🛡️" : "🎯"}</span>
                      <span style={D.goalName}>{g.name}</span>
                      <span style={D.goalPct}>{gp}%</span>
                    </div>
                    <div style={D.progressBarBg}>
                      <motion.div style={{ ...D.progressBar, width:`${Math.min(gp,100)}%`, background: gp>=100?"var(--green)":"var(--accent)" }} 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(gp,100)}%` }} transition={{ duration:1 }} />
                    </div>
                    <p style={D.goalSub}>{formatPKR(g.savedAmount)} / {formatPKR(g.targetAmount)}</p>
                  </div>
                );
              })
            ) : (
              <div style={D.emptyStateSmall}>No active goals. Set one to start saving!</div>
            )}
          </div>
        </TiltCard>

        {/* Subscriptions Card */}
        <TiltCard style={D.overviewCard} delay={0.3}>
          <div style={D.cardHeader}>
            <h3 style={D.chartTitle}>🗓️ Upcoming Bills</h3>
            <motion.button style={D.smallBtn} onClick={() => setActiveTab("recurring")} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>View All</motion.button>
          </div>
          <div style={D.subsList}>
            {activeSubs.length > 0 ? (
              [...activeSubs].sort((a,b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)).slice(0, 3).map(s => {
                const days = getDaysUntil(s.nextDueDate);
                return (
                  <div key={s.id} style={D.subItem}>
                    <div style={D.subIcon}>{s.category === "entertainment" ? "🎬" : s.category === "transport" ? "🚗" : "📦"}</div>
                    <div style={{ flex:1 }}>
                      <p style={D.subName}>{s.description || s.category}</p>
                      <p style={D.subDetail}>{formatPKR(s.amount)} · {s.frequency}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ ...D.subStatus, color: days <= 2 ? "var(--red)" : "var(--text-muted)" }}>
                        {days <= 0 ? "Due Today" : `In ${days} days`}
                      </p>
                      <p style={D.subDate}>{new Date(s.nextDueDate).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={D.emptyStateSmall}>No active subscriptions.</div>
            )}
          </div>
        </TiltCard>
      </div>

      {/* ── Stat cards ── */}
      <div style={D.statsRow}>
        {[
          { icon:"💸", label:"Month Spent",  value:formatPKR(totalSpent), color:"var(--red)",    sub:`${monthlyExpenses.length} this month` },
          { icon:"💰", label:t.remaining,     value:formatPKR(Math.max(remaining,0)), color:"var(--green)", sub: pct>=100 ? "Budget exceeded!" : `${100-pct}% free` },
          { icon:"📊", label:"Avg / Day",     value:formatPKR(Math.round(totalSpent/Math.max(new Date().getDate(),1))), color:"var(--blue)", sub:"This month" },
          { icon:"🔥", label:"Day Streak",    value:`${computeStreak(expenses)} days`, color:"var(--orange)", sub:"Keep it up!" },
        ].map((s,i) => (
          <TiltCard key={s.label} style={D.statCard} delay={0.2 + i * 0.05}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:"var(--text-muted)", background:"var(--bg-input)", padding:"2px 7px", borderRadius:10 }}>{s.sub}</span>
            </div>
            <p style={{ ...D.statValue, color:s.color }}>{s.value}</p>
            <p style={D.statLabel}>{s.label}</p>
          </TiltCard>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={D.chartsGrid}>
        <TiltCard style={D.chartCard} delay={0.3}>
          <h3 style={D.chartTitle}>📅 Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top:4, right:6, left:-24, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={v=>[`PKR ${v.toLocaleString()}`,"Spent"]} />
              <Bar dataKey="amount" radius={[5,5,0,0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? "#f5b800" : entry.amount>0 ? "#3b82f6" : "var(--border)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TiltCard>

        {/* Donut with per-category colors & tooltip */}
        <TiltCard style={D.chartCard} delay={0.4}>
          <h3 style={D.chartTitle}>🥧 {t.categoryBreakdown}</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((e,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={D.legend}>
                {pieData.slice(0,6).map((e, i) => (
                  <div key={e.name} style={D.legendItem}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i % COLORS.length], flexShrink:0 }} />
                    <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{getIcon(e.name)} {e.name}</span>
                    <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{formatPKR(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState icon="🥧" title="No data yet" desc="Add expenses to see category breakdown" />}
        </TiltCard>

        <TiltCard style={D.chartCard} delay={0.5}>
          <h3 style={D.chartTitle}>📊 Top Spending Categories</h3>
          {topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCategories} layout="vertical" margin={{ top:8, right:10, left:12, bottom:6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} horizontal={false} />
                <XAxis type="number" tick={{ fill:"var(--text-muted)", fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill:"var(--text-muted)", fontSize:10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TT} formatter={v=>[`PKR ${v.toLocaleString()}`,"Spent"]} />
                <Bar dataKey="value" radius={[5,5,5,5]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📊" title="No category spend data" desc="Add expenses to populate this chart." />
          )}
        </TiltCard>
      </div>

      {/* ── Financial Health Summary ── */}
      <div style={D.statsRow}>
        <TiltCard style={{ ...D.statCard, flex: 1, borderLeft: "4px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={D.statLabel}>Monthly Subscriptions</p>
              <p style={D.statValue}>{formatPKR(Math.round(totalMonthlySubs))}</p>
            </div>
            <span style={{ fontSize: 20 }}>🔄</span>
          </div>
          {nextSub && (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--text-muted)" }}>
              Next: <span style={{ color: "var(--accent)" }}>{nextSub.description}</span> on {new Date(nextSub.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          )}
        </TiltCard>

        <TiltCard style={{ ...D.statCard, flex: 1, borderLeft: "4px solid var(--green)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={D.statLabel}>Top Savings Goal</p>
              <p style={{ ...D.statValue, color: "var(--green)" }}>
                {topGoal ? Math.round((topGoal.savedAmount / topGoal.targetAmount) * 100) : 0}%
              </p>
            </div>
            <span style={{ fontSize: 20 }}>🎯</span>
          </div>
          {topGoal ? (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Toward: <span style={{ color: "var(--green)" }}>{topGoal.name}</span>
            </p>
          ) : (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--text-muted)" }}>No active goals</p>
          )}
        </TiltCard>
      </div>

      {/* ── Monthly History Summary ── */}
      {monthlyBreakdown.length > 1 && (
        <TiltCard style={D.chartCard} delay={0.6}>
          <h3 style={D.chartTitle}>📆 Monthly Spending History</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {monthlyBreakdown.slice(0, 6).map((mo, i) => {
              const displayBudget = mo.effectiveBudget;
              const moPct = displayBudget > 0 ? Math.round((mo.spent / displayBudget) * 100) : 0;
              const isCurrent = i === 0;
              return (
                <motion.div key={mo.month} style={{ background: isCurrent ? "var(--accent-subtle)" : "var(--bg-input)", border: isCurrent ? "1px solid var(--accent)" : "1px solid var(--border-light)", borderRadius:10, padding:"12px 14px" }}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>
                      {isCurrent && "📍 "}{mo.label}
                    </span>
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:12, color:"var(--red)", fontWeight:600 }}>{formatPKR(mo.spent)}</span>
                      {displayBudget > 0 && <span style={{ fontSize:11, color:"var(--green)" }}>+{formatPKR(mo.remaining)} left</span>}
                    </div>
                  </div>
                  {displayBudget > 0 && (
                    <div style={{ height:4, background:"var(--border)", borderRadius:2 }}>
                      <motion.div style={{ height:"100%", borderRadius:2, background: moPct>=100?"var(--red)":moPct>=80?"#f5b800":"var(--green)" }} initial={{ width:0 }} animate={{ width:`${Math.min(moPct,100)}%` }} transition={{ duration:0.6 }} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </TiltCard>
      )}

      {/* ── Recent expenses ── */}
      <TiltCard style={D.chartCard} delay={0.7}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={D.chartTitle}>{t.recentExpenses}</h3>
          <motion.button style={D.viewAllBtn} onClick={() => setActiveTab("history")} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>{t.viewAll} →</motion.button>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="📭" title="No expenses yet" desc="Add your first expense to see it here" action="➕ Add Expense" onAction={() => setActiveTab("addExpense")} />
        ) : recent.map(exp => (
          <div key={exp.id} style={D.recentRow}>
            <div style={{ ...D.recentIcon, background:"var(--bg-elevated)" }}>
              <span style={{ fontSize:18 }}>{getIcon(exp.category)}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={D.recentNote}>{exp.description || exp.category}</p>
              <p style={D.recentMeta}>TXN-{exp.id} · {new Date(exp.date).toLocaleDateString()} · {new Date(exp.createdAt || exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <span style={D.recentAmt}>−{formatPKR(exp.amount)}</span>
          </div>
        ))}
      </TiltCard>

      {/* Celebration Popup moved to MainApp.jsx */}
    </div>
  );
}


function computeStreak(expenses) {
  const dates = new Set(expenses.map(e=>e.date));
  let s=0;
  for (let i=0;i<30;i++) {
    const d=new Date(); d.setDate(d.getDate()-i);
    if (dates.has(d.toISOString().slice(0,10))) s++; else if(i>0) break;
  }
  return s;
}

const D = {
  container:      { padding:"12px 16px", display:"flex", flexDirection:"column", gap:12, maxWidth:900, margin:"0 auto", position: "relative" },
  rolloverNotice: { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 16px", color:"var(--text-primary)", fontSize:12, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(12px)" },
  welcomeCard:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"20px 16px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12, backdropFilter:"blur(12px)" },
  welcomeTitle:   { margin:0, fontSize:22, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  welcomeSub:     { margin:0, fontSize:13, color:"var(--text-secondary)", maxWidth:420, lineHeight:1.5 },
  welcomeBtn:     { background:"linear-gradient(135deg,#f5b800,#ffd04a)", border:"none", color:"#111", padding:"10px 20px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:800, fontFamily:"var(--font)" },
  welcomeBtnOutline:{ background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"10px 20px", borderRadius:10, cursor:"pointer", fontSize:14, fontFamily:"var(--font)", fontWeight:600 },
  quickTips:      { display:"flex", flexDirection:"column", gap:8, marginTop:12, width:"100%", maxWidth:380 },
  quickTip:       { background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"var(--text-secondary)", textAlign:"left", fontWeight:500 },
  // All-time banner
  allTimeBanner:  { background:"linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border:"1px solid var(--border)", borderRadius:16, padding:"16px", backdropFilter:"blur(12px)" },
  allTimeHeader:  { display:"flex", alignItems:"center", gap:8, marginBottom:12 },
  allTimeGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 },
  allTimeStat:    { background:"var(--bg-input)", borderRadius:14, padding:"12px 8px", textAlign:"center", border:"1px solid var(--border-light)" },
  // Budget card
  budgetCard:     { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"18px 20px", backdropFilter:"blur(12px)" },
  budgetTop:      { display:"flex", justifyContent:"space-between", marginBottom:14 },
  budgetLabel:    { margin:"0 0 4px", fontSize:11, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" },
  budgetValue:    { margin:0, fontSize:22, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  progressTrack:  { height:10, background:"var(--border)", borderRadius:8, overflow:"hidden", marginBottom:12 },
  budgetFooter:   { display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 },
  statsRow:       { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 },
  statCard:       { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"14px", display:"flex", flexDirection:"column", gap:6, backdropFilter:"blur(12px)" },
  statValue:      { margin:0, fontSize:18, fontWeight:900, letterSpacing:"-0.5px" },
  statLabel:      { margin:0, fontSize:11, color:"var(--text-muted)", fontWeight:600 },
  cardHeader:     { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  smallBtn:       { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6, cursor:"pointer" },
  goalsList:      { display:"flex", flexDirection:"column", gap:10 },
  goalItem:       { },
  goalTop:        { display:"flex", alignItems:"center", gap:8, marginBottom:4 },
  goalName:       { flex:1, fontSize:13, fontWeight:700, color:"var(--text-primary)" },
  goalPct:        { fontSize:12, fontWeight:800, color:"var(--accent)" },
  progressBarBg:  { height:6, background:"var(--border)", borderRadius:4, overflow:"hidden" },
  progressBar:    { height:"100%", borderRadius:4 },
  goalSub:        { margin:"4px 0 0", fontSize:10, color:"var(--text-muted)", fontWeight:500 },
  subsList:       { display:"flex", flexDirection:"column", gap:10 },
  subItem:        { display:"flex", alignItems:"center", gap:10, padding:"8px", background:"var(--bg-input)", borderRadius:10, border:"1px solid var(--border-light)" },
  subIcon:        { width:32, height:32, background:"var(--bg-elevated)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 },
  subName:        { margin:0, fontSize:13, fontWeight:800, color:"var(--text-primary)" },
  subDetail:      { margin:0, fontSize:10, color:"var(--text-muted)", fontWeight:500 },
  subStatus:      { margin:0, fontSize:10, fontWeight:800 },
  subDate:        { margin:0, fontSize:9, color:"var(--text-muted)", fontWeight:500 },
  emptyStateSmall:{ textAlign:"center", padding:"16px 0", fontSize:12, color:"var(--text-muted)", fontStyle:"italic" },
  chartsGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:16 },
  overviewCard:   { padding:16, background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", backdropFilter:"blur(12px)" },
  chartCard:      { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"16px", backdropFilter:"blur(12px)" },
  chartTitle:     { margin:"0 0 12px", fontSize:14, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  legend:         { display:"flex", flexDirection:"column", gap:4, marginTop:10 },
  legendItem:     { display:"flex", alignItems:"center", gap:6 },
  recentRow:      { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border-light)" },
  recentIcon:     { width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 },
  recentNote:     { margin:0, fontSize:13, color:"var(--text-primary)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  recentMeta:     { margin:"2px 0 0", fontSize:11, color:"var(--text-muted)", fontWeight:500 },
  recentAmt:      { fontSize:14, color:"var(--red)", fontWeight:800, whiteSpace:"nowrap", flexShrink:0, letterSpacing:"-0.5px" },
  viewAllBtn:     { background:"transparent", border:"none", color:"var(--accent)", fontSize:12, cursor:"pointer", fontWeight:700, fontFamily:"var(--font)" },
  alertBanner: {
    background: "linear-gradient(135deg, #f5b800, #ffd04a)",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    boxShadow: "0 8px 20px -5px rgba(245, 158, 11, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  }
};
