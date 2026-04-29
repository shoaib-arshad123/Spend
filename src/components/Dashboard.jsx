import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatPKR, getPredictionDays, classifyUser } from "../utils/helpers";
import { getCategoryColor, getCategoryIcon } from "../i18n/translations";
import { useApp } from "../context/AppContext";

const TT = { contentStyle:{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text-primary)", fontSize:12 }, cursor:{ fill:"rgba(255,255,255,0.04)" } };

function getLast7Days(expenses) {
  return Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const ds = d.toISOString().slice(0,10);
    return { day:["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()], amount: expenses.filter(e => e.date===ds).reduce((s,e)=>s+e.amount,0), isToday: i===6 };
  });
}

function getLast30Area(expenses) {
  let cum = 0;
  return Array.from({ length:30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate()-(29-i));
    const ds = d.toISOString().slice(0,10);
    const day = expenses.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0);
    cum += day; return { day: i+1, amount:day, cumulative:cum };
  }).filter((_,i) => i%3===0 || i===29);
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

const emptyBtn = { marginTop:6, background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", padding:"10px 22px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--font)" };

export default function Dashboard({ t, budget, setBudget, setActiveTab }) {
  const { expenses, categories } = useApp();
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const remaining  = budget - totalSpent;
  const pct        = budget>0 ? Math.round((totalSpent/budget)*100) : 0;
  const predDays   = getPredictionDays(expenses, budget);
  const userType   = classifyUser(totalSpent, budget);
  const barData    = getLast7Days(expenses);
  const areaData   = getLast30Area(expenses);
  const catMap     = {};
  expenses.forEach(e => { catMap[e.category]=(catMap[e.category]||0)+e.amount; });
  const pieData    = Object.entries(catMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  
  // Sort by date and then by createdAt (most recent first)
  const recent     = [...expenses].sort((a,b) => {
    const dDiff = new Date(b.date) - new Date(a.date);
    if (dDiff !== 0) return dDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  }).slice(0, 6);

  const typeInfo = { saver:{ label:"💚 Saver", color:"var(--green)" }, balanced:{ label:"🟡 Balanced", color:"var(--accent)" }, spender:{ label:"🔴 Spender", color:"var(--red)" } };
  const ti = typeInfo[userType];

  // Helper to get icon for any category name
  const getIcon = (catName) => categories.find(c => c.name === catName)?.icon || "📦";

  // No expenses yet — show welcome state
  if (expenses.length === 0) {
    return (
      <div style={D.container}>
        <motion.div style={D.welcomeCard} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <span style={{ fontSize:52 }}>👋</span>
          <h2 style={D.welcomeTitle}>Welcome, you're all set!</h2>
          <p style={D.welcomeSub}>Your dashboard is empty. Start by setting your budget in Profile, then add your first expense.</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
            <motion.button style={D.welcomeBtn} onClick={() => setActiveTab("addExpense")} whileHover={{ scale:1.04 }}>➕ Add First Expense</motion.button>
            <motion.button style={D.welcomeBtnOutline} onClick={() => setActiveTab("profile")} whileHover={{ scale:1.04 }}>💰 Set Budget</motion.button>
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
      {/* ── Budget card ── */}
      <motion.div style={D.budgetCard} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div style={D.budgetTop}>
          <div>
            <p style={D.budgetLabel}>Monthly Budget</p>
            <p style={D.budgetValue}>{formatPKR(budget)}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={D.budgetLabel}>Remaining</p>
            <p style={{ ...D.budgetValue, color: remaining>=0?"var(--green)":"var(--red)" }}>{formatPKR(Math.abs(remaining))}{remaining<0?" over":""}</p>
          </div>
        </div>
        <div style={D.progressTrack}>
          <motion.div
            style={{ height:"100%", borderRadius:6, background: pct>=100?"var(--red)":pct>=80?"#f59e0b":"linear-gradient(90deg,var(--green),var(--accent))" }}
            initial={{ width:0 }}
            animate={{ width:`${Math.min(pct,100)}%` }}
            transition={{ duration:1.2, ease:"easeOut" }}
          />
        </div>
        <div style={D.budgetFooter}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>{pct}% used · <span style={{ color:ti.color }}>{ti.label}</span></span>
          {predDays !== null && (
            <span style={{ fontSize:12, color: predDays<5?"var(--red)":predDays<10?"var(--accent)":"var(--text-muted)" }}>
              {predDays<1 ? "⚠️ Budget exhausted" : `⏱ ~${predDays} days left`}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div style={D.statsRow}>
        {[
          { icon:"💸", label:t.totalSpent,   value:formatPKR(totalSpent), color:"var(--red)",    sub:`${expenses.length} transactions` },
          { icon:"💰", label:t.remaining,     value:formatPKR(Math.max(remaining,0)), color:"var(--green)", sub: pct>=100 ? "Budget exceeded!" : `${100-pct}% free` },
          { icon:"📊", label:"Avg / Day",     value:formatPKR(Math.round(totalSpent/Math.max(new Date().getDate(),1))), color:"var(--blue)", sub:"This month" },
          { icon:"🔥", label:"Day Streak",    value:`${computeStreak(expenses)} days`, color:"var(--orange)", sub:"Keep it up!" },
        ].map((s,i) => (
          <motion.div key={s.label} style={D.statCard} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }} whileHover={{ y:-3 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <span style={{ fontSize:10, color:"var(--text-muted)", background:"var(--bg-input)", padding:"2px 7px", borderRadius:10 }}>{s.sub}</span>
            </div>
            <p style={{ ...D.statValue, color:s.color }}>{s.value}</p>
            <p style={D.statLabel}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={D.chartsGrid}>
        {/* Bar chart */}
        <div style={D.chartCard}>
          <h3 style={D.chartTitle}>📅 {t.weeklySpending}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top:4, right:6, left:-24, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-muted)", fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} formatter={v=>[`PKR ${v.toLocaleString()}`,"Spent"]} />
              <Bar dataKey="amount" radius={[5,5,0,0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? "#f59e0b" : entry.amount>0 ? "#3b82f6" : "var(--border)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div style={D.chartCard}>
          <h3 style={D.chartTitle}>🥧 {t.categoryBreakdown}</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((e,i) => <Cell key={i} fill="var(--accent)" />)}
                  </Pie>
                  <Tooltip {...TT} formatter={v=>[`PKR ${v.toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={D.legend}>
                {pieData.slice(0,5).map(e => (
                  <div key={e.name} style={D.legendItem}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} />
                    <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{getIcon(e.name)} {e.name}</span>
                    <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:"auto" }}>{formatPKR(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState icon="🥧" title="No data yet" desc="Add expenses to see category breakdown" />}
        </div>
      </div>

      {/* ── Area chart ── */}
      <div style={D.chartCard}>
        <h3 style={D.chartTitle}>📈 Cumulative Spending — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={areaData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
            <defs>
              <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="day" tick={{ fill:"var(--text-muted)", fontSize:10 }} tickFormatter={v=>`D${v}`} />
            <YAxis tick={{ fill:"var(--text-muted)", fontSize:10 }} />
            <Tooltip {...TT} formatter={v=>[`PKR ${v.toLocaleString()}`]} />
            <Area type="monotone" dataKey="cumulative" stroke="#f59e0b" strokeWidth={2} fill="url(#cGrad)" dot={false} />
            {budget>0 && <Area type="monotone" dataKey={()=>budget} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1} fill="none" dot={false} name="Budget" />}
          </AreaChart>
        </ResponsiveContainer>
        {budget>0 && <p style={{ margin:"4px 0 0", fontSize:11, color:"var(--red)", textAlign:"right" }}>— Budget limit {formatPKR(budget)}</p>}
      </div>

      {/* ── Recent expenses ── */}
      <div style={D.chartCard}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={D.chartTitle}>{t.recentExpenses}</h3>
          <button style={D.viewAllBtn} onClick={() => setActiveTab("history")}>{t.viewAll} →</button>
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
              <p style={D.recentMeta}>{new Date(exp.date).toLocaleDateString()} · {exp.time || ""}</p>
            </div>
            <span style={D.recentAmt}>−{formatPKR(exp.amount)}</span>
          </div>
        ))}
      </div>
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
  container:      { padding:18, display:"flex", flexDirection:"column", gap:14, maxWidth:900, margin:"0 auto" },
  welcomeCard:    { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:18, padding:"40px 32px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 },
  welcomeTitle:   { margin:0, fontSize:24, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  welcomeSub:     { margin:0, fontSize:14, color:"var(--text-secondary)", maxWidth:400, lineHeight:1.7 },
  welcomeBtn:     { background:"linear-gradient(135deg,#f59e0b,#f97316)", border:"none", color:"#111", padding:"11px 22px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"var(--font)" },
  welcomeBtnOutline:{ background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"11px 22px", borderRadius:10, cursor:"pointer", fontSize:14, fontFamily:"var(--font)" },
  quickTips:      { display:"flex", flexDirection:"column", gap:8, marginTop:10, width:"100%", maxWidth:360 },
  quickTip:       { background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 14px", fontSize:12, color:"var(--text-secondary)", textAlign:"left" },
  budgetCard:     { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px" },
  budgetTop:      { display:"flex", justifyContent:"space-between", marginBottom:14 },
  budgetLabel:    { margin:"0 0 2px", fontSize:11, color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" },
  budgetValue:    { margin:0, fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.5px" },
  progressTrack:  { height:10, background:"var(--border)", borderRadius:6, overflow:"hidden", marginBottom:10 },
  budgetFooter:   { display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 },
  statsRow:       { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 },
  statCard:       { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 14px", display:"flex", flexDirection:"column", gap:4 },
  statValue:      { margin:0, fontSize:17, fontWeight:800, letterSpacing:"-0.5px" },
  statLabel:      { margin:0, fontSize:11, color:"var(--text-muted)", fontWeight:500 },
  chartsGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 },
  chartCard:      { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px" },
  chartTitle:     { margin:"0 0 12px", fontSize:14, fontWeight:700, color:"var(--text-primary)" },
  legend:         { display:"flex", flexDirection:"column", gap:6, marginTop:10 },
  legendItem:     { display:"flex", alignItems:"center", gap:7 },
  recentRow:      { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border-light)" },
  recentIcon:     { width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  recentNote:     { margin:0, fontSize:13, color:"var(--text-primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  recentMeta:     { margin:"2px 0 0", fontSize:11, color:"var(--text-muted)" },
  recentAmt:      { fontSize:13, color:"var(--red)", fontWeight:700, whiteSpace:"nowrap", flexShrink:0 },
  viewAllBtn:     { background:"transparent", border:"none", color:"var(--accent)", fontSize:12, cursor:"pointer", fontWeight:600, fontFamily:"var(--font)" },
};
