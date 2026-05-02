import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { formatPKR } from "../utils/helpers";
import { getCategoryColor, getCategoryIcon } from "../i18n/translations";
import { useApp } from "../context/AppContext";
import { PiggyBank, CalendarClock, ChevronLeft, Brain, Sparkles, TrendingDown, Target } from "lucide-react";
import { getSmartAdvice } from "../utils/helpers";

const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#f97316", "#06b6d4", "#ef4444", "#84cc16", "#6366f1", "#14b8a6", "#a855f7"];
const TT = { contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 12 }, cursor: { fill: "rgba(255,255,255,0.04)" } };

const getLocalMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function filterByPeriod(expenses, period) {
  if (period === "all") return expenses;
  const now = new Date();
  const currentMonth = getLocalMonthKey(now);
  if (period === "thisMonth") {
    return expenses.filter(e => e.date && e.date.startsWith(currentMonth));
  }
  if (period === "lastMonth") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = getLocalMonthKey(last);
    return expenses.filter(e => e.date && e.date.startsWith(lastMonth));
  }
  return expenses;
}

function getMonthlyData(expenses, period) {
  const sums = {};
  expenses.forEach(e => {
    if (!e.date) return;
    const mo = e.date.slice(0, 7);
    sums[mo] = (sums[mo] || 0) + e.amount;
  });

  const months = [];
  const now = new Date();
  if (period === "all") {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    for (let i = 0; i < 6; i += 1) {
      months.push(getLocalMonthKey(start));
      start.setMonth(start.getMonth() + 1);
    }
  } else {
    const base = period === "lastMonth" ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
    months.push(getLocalMonthKey(base));
  }

  return months.map(mo => ({
    month: new Date(mo + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    amount: sums[mo] || 0,
  }));
}

function getDailyData(expenses, days = 30) {
  let cum = 0;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    const ds = d.toISOString().slice(0, 10);
    const amount = expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
    cum += amount;
    return { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), amount, cumulative: cum, date: ds };
  }).filter((_, i) => i % Math.ceil(days / 15) === 0 || i === days - 1);
}

function getWeekdayData(expenses) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = Array(7).fill(0), counts = Array(7).fill(0);
  expenses.forEach(e => { const d = new Date(e.date).getDay(); totals[d] += e.amount; counts[d]++; });
  return days.map((name, i) => ({ name, total: totals[i], avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0, count: counts[i] }));
}

function getTransactionSizeDistribution(expenses) {
  let small = 0, medium = 0, large = 0, huge = 0;
  expenses.forEach(e => {
    if (e.amount < 1000) small++;
    else if (e.amount < 5000) medium++;
    else if (e.amount < 10000) large++;
    else huge++;
  });
  return [
    { name: "< 1k", count: small },
    { name: "1k - 5k", count: medium },
    { name: "5k - 10k", count: large },
    { name: "> 10k", count: huge }
  ];
}

function getTopTransactions(expenses) {
  return [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((e, i) => ({ name: e.description || e.category, amount: e.amount, date: e.date, category: e.category, id: e.id || i }));
}

function getWeekendVsWeekday(expenses) {
  let weekday = 0, weekend = 0;
  expenses.forEach(e => {
    const day = new Date(e.date).getDay();
    if (day === 0 || day === 6) weekend += e.amount;
    else weekday += e.amount;
  });
  return [
    { name: "Weekday", value: weekday, icon: "🏢" },
    { name: "Weekend", value: weekend, icon: "🏖️" }
  ];
}

function getMonthComparisonData(expenses) {
  const now = new Date();
  const thisMonthKey = getLocalMonthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getLocalMonthKey(lastMonthDate);
  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysInLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate();
  const maxDays = Math.max(daysInThisMonth, daysInLastMonth);

  const thisExp = expenses.filter(e => e.date && e.date.startsWith(thisMonthKey));
  const lastExp = expenses.filter(e => e.date && e.date.startsWith(lastMonthKey));

  let thisCum = 0, lastCum = 0;
  return Array.from({ length: maxDays }, (_, i) => {
    const dayStr = String(i + 1).padStart(2, "0");
    const thisDayExp = thisExp.filter(e => e.date === `${thisMonthKey}-${dayStr}`).reduce((s, e) => s + e.amount, 0);
    const lastDayExp = lastExp.filter(e => e.date === `${lastMonthKey}-${dayStr}`).reduce((s, e) => s + e.amount, 0);
    
    if (i + 1 <= now.getDate()) thisCum += thisDayExp;
    if (i + 1 <= daysInLastMonth) lastCum += lastDayExp;

    return {
      day: i + 1,
      thisMonth: i + 1 <= now.getDate() ? thisCum : null,
      lastMonth: i + 1 <= daysInLastMonth ? lastCum : null
    };
  });
}


// Custom tooltip for pie chart — shows category icon + name + amount
const CategoryPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const { name, value } = payload[0];
  const idx = payload[0]?.payload?.idx ?? 0;
  const icon = payload[0]?.payload?.icon || getCategoryIcon(name);
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", boxShadow: "var(--shadow-md)", minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[idx % COLORS.length], display: "inline-block" }} />
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>{name}</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{formatPKR(value)}</span>
    </div>
  );
};

const TiltCard = ({ children, style }) => {
  const [t, setT] = useState({ x:0, y:0 });
  const handleMM = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width/2) / 20;
    const y = -(e.clientY - rect.top - rect.height/2) / 20;
    setT({ x, y });
  };
  return (
    <motion.div
      onMouseMove={handleMM} onMouseLeave={() => setT({ x:0, y:0 })}
      animate={{ rotateY: t.x, rotateX: t.y, translateZ: t.x ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ ...style, transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
};

const MetricCard = ({ icon, label, value, color, sub }) => (
  <TiltCard style={AN.metricCard}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{icon}</span>
      {sub && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-input)", padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>{sub}</span>}
    </div>
    <p style={{ ...AN.metricValue, color }}>{value}</p>
    <p style={AN.metricLabel}>{label}</p>
  </TiltCard>
);

export default function Analytics({ setActiveTab }) {
  const { expenses, budget, categories, previousMonthCarryOver, effectiveMonthlyBudget, allTimeBudget, budgetHistory, isLoading, goals = [], recurring = [], lang } = useApp();
  const [period, setPeriod] = useState("thisMonth");

  const budgetHistoryMap = useMemo(() => {
    return (budgetHistory || []).reduce((map, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
      map[key] = item.amount;
      return map;
    }, {});
  }, [budgetHistory]);

  const filtered = useMemo(() => filterByPeriod(expenses, period), [expenses, period]);
  const monthly = useMemo(() => getMonthlyData(filtered, period), [filtered, period]);
  const daily = useMemo(() => getDailyData(filtered, period === "lastMonth" ? new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate() : new Date().getDate()), [filtered, period]);
  const weekday = useMemo(() => getWeekdayData(filtered), [filtered]);
  const sizeDist = useMemo(() => getTransactionSizeDistribution(filtered), [filtered]);
  const topTxns = useMemo(() => getTopTransactions(filtered), [filtered]);
  const weekendVsWeekday = useMemo(() => getWeekendVsWeekday(filtered), [filtered]);
  const monthComparison = useMemo(() => getMonthComparisonData(expenses), [expenses]);

  // Savings and Fixed Cost analysis
  const activeSubs = recurring.filter(r => r.isActive);
  const fixedCostMonthly = activeSubs.reduce((s, r) => {
    if (r.frequency === "daily") return s + r.amount * 30;
    if (r.frequency === "weekly") return s + r.amount * 4.3;
    if (r.frequency === "monthly") return s + r.amount;
    return s;
  }, 0);

  const goalData = useMemo(() => {
    return goals.map(g => ({
      name: g.name.length > 10 ? g.name.slice(0, 8) + ".." : g.name,
      saved: g.savedAmount,
      target: g.targetAmount,
      pct: Math.round((g.savedAmount / g.targetAmount) * 100)
    })).sort((a,b) => b.pct - a.pct).slice(0, 5);
  }, [goals]);

  const fixedVsVariable = [
    { name: "Fixed (Subs)", value: fixedCostMonthly, fill: "var(--accent)" },
    { name: "Variable (Others)", value: Math.max(0, (effectiveMonthlyBudget || 0) - fixedCostMonthly), fill: "var(--blue)" }
  ];

  // Helper to get icon for any category
  const getIcon = (catName) => categories.find(c => c.name === catName)?.icon || getCategoryIcon(catName) || "📦";

  const catMap = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const pieData = catMap.map(([name, value], idx) => ({ name, value, idx, icon: getIcon(name) }));
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const daysCount = period === "thisMonth" ? new Date().getDate() : period === "lastMonth" ? new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate() : Math.max(1, daily.length);
  const avgPerDay = filtered.length > 0 ? Math.round(totalSpent / daysCount) : 0;
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  const periodBudget = period === "thisMonth"
    ? effectiveMonthlyBudget
    : period === "lastMonth"
      ? (budgetHistoryMap[lastMonthKey] ?? 0)
      : allTimeBudget;
  const balance = periodBudget - totalSpent;
  const balanceLabel = formatPKR(balance);
  const maxDay = daily.reduce((m, d) => d.amount > m.amount ? d : m, { amount: 0, day: "N/A" });
  const topCat = catMap[0];
  const srcCounts = { manual: 0, voice: 0, scanner: 0 };
  filtered.forEach(e => { if (srcCounts[e.source || "manual"] !== undefined) srcCounts[e.source || "manual"]++; });

  // Forecast logic
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  let forecast = null;
  if (period === "thisMonth" && currentDay >= 3 && periodBudget > 0) {
    const projectedTotal = (totalSpent / currentDay) * daysInMonth;
    const isOver = projectedTotal > periodBudget;
    const pct = Math.round((projectedTotal / periodBudget) * 100);
    forecast = {
      projected: projectedTotal,
      isOver,
      pct,
      msg: isOver 
        ? `At your current rate, you will spend ${pct}% of your budget by the end of the month. Consider cutting back.`
        : `Great job! You are on track to stay within your budget this month (${pct}% projected usage).`
    };
  }

  const PERIOD_OPTIONS = [["thisMonth", "This Month"], ["lastMonth", "Last Month"], ["all", "All Time"]];

  if (isLoading) {
    return (
      <div style={AN.container}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div className="shimmer" style={{ width: 100, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: 100, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: 100, height: 32, borderRadius: 8 }} />
        </div>
        <div style={AN.metricsGrid}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
        <div style={{ ...AN.twoCol, marginTop: 20 }}>
          <div className="shimmer" style={{ height: 260, borderRadius: 14 }} />
          <div className="shimmer" style={{ height: 260, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 14 }}>📈</span>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>No Data Yet</h3>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Add expenses to unlock detailed analytics and trend charts.</p>
      </div>
    );
  }

  return (
    <div style={AN.container}>
      {/* Header with Back */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
        <motion.button 
          style={AN.backCircle} 
          onClick={() => setActiveTab("dashboard")}
          whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
          whileTap={{ scale:0.9 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </motion.button>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>Analytics</h2>
      </div>

      {/* Period filter */}
      <div style={AN.periodBar}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Period:</span>
        <div style={AN.periodBtns}>
          {PERIOD_OPTIONS.map(([k, l]) => (
            <button key={k} style={{ ...AN.periodBtn, ...(period === k ? AN.periodActive : {}) }} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: 12 }}>
        <span>Budget for Period: {formatPKR(periodBudget)}</span>
        {period === "thisMonth" && <span>(+ {formatPKR(previousMonthCarryOver)} carried)</span>}
        <strong style={{ color: "var(--text-primary)" }}>Total: {formatPKR(period === "thisMonth" ? effectiveMonthlyBudget : periodBudget)}</strong>
      </div>

      {/* Key metrics */}
      <div style={AN.metricsGrid}>
        <MetricCard icon="💸" label="Total Spent" value={formatPKR(totalSpent)} color="var(--red)" sub={`${filtered.length} txns`} />
        <MetricCard icon="💰" label="Balance" value={balanceLabel} color={period === "all" ? "var(--text-muted)" : balance >= 0 ? "var(--green)" : "var(--red)"} sub={period === "all" ? "All time" : `${balance >= 0 ? "Remaining" : "Over"}`} />
        <MetricCard icon="📅" label="Daily Average" value={formatPKR(avgPerDay)} color="var(--accent)" sub="avg" />
        <MetricCard icon="🏆" label="Top Category" value={topCat ? `${getIcon(topCat[0])} ${topCat[0]}` : "—"} color="var(--purple)" sub={topCat ? formatPKR(topCat[1]) : ""} />
      </div>

      {/* AI Forecast Card */}
      {forecast && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...AN.chartCard, background: forecast.isOver ? "var(--red-bg)" : "var(--green-bg)", borderColor: forecast.isOver ? "var(--red)" : "var(--green)" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 32 }}>{forecast.isOver ? "⚠️" : "✨"}</div>
            <div>
              <h3 style={{ ...AN.chartTitle, margin: "0 0 4px", color: forecast.isOver ? "var(--red)" : "var(--green)" }}>AI Spending Forecast</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
                {forecast.msg} <br/>
                Projected total: <strong style={{ color: "var(--text-primary)" }}>{formatPKR(forecast.projected)}</strong>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* New Analysis Row */}
      <div style={AN.twoCol}>
        {/* Transaction Size Distribution */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📦 Transaction Size</h3>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>Number of transactions by size range.</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sizeDist} margin={{ top: 15, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} allowDecimals={false} />
              <Tooltip {...TT} formatter={(v) => [v, "Transactions"]} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sizeDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekend vs Weekday */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📆 Weekend vs Weekday</h3>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>Total amount spent by day type.</div>
          {weekendVsWeekday[0].value > 0 || weekendVsWeekday[1].value > 0 ? (
            <div style={{ display: "flex", alignItems: "center", height: 200 }}>
              <div style={{ flex: 1, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={weekendVsWeekday} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip {...TT} formatter={(v) => [formatPKR(v), "Spent"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginRight: 20 }}>
                {weekendVsWeekday.map((d, i) => (
                  <div key={d.name}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#3b82f6" : "#f59e0b", display: "inline-block" }} />
                      {d.icon} {d.name}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{formatPKR(d.value)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {Math.round((d.value / (weekendVsWeekday[0].value + weekendVsWeekday[1].value)) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: 13 }}>No data</p>
          )}
        </div>
      </div>

      {/* Another Analysis Row */}
      <div style={AN.twoCol}>
        {/* Top 5 Transactions */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>💎 Top 5 Largest Transactions</h3>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4, marginBottom: 12 }}>Your biggest single expenses in this period.</div>
          {topTxns.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topTxns.map((txn, i) => {
                const maxAmt = topTxns[0].amount;
                const widthPct = Math.max(10, (txn.amount / maxAmt) * 100);
                return (
                  <div key={txn.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                          {getIcon(txn.category)} {txn.name}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red)" }}>{formatPKR(txn.amount)}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                        <motion.div 
                          style={{ height: "100%", borderRadius: 3, background: COLORS[i % COLORS.length] }} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${widthPct}%` }} 
                          transition={{ duration: 0.8, delay: i * 0.1 }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: 13 }}>No transactions found.</p>
          )}
        </div>

        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📊 By Weekday</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekday} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip {...TT} formatter={(v, n) => [`PKR ${v.toLocaleString()}`, n === "avg" ? "Average" : "Total"]} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]} name="avg">
                {weekday.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative line & Month Comparison */}
      <div style={AN.twoCol}>
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📈 Cumulative Spending</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={daily} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip {...TT} formatter={v => [`PKR ${v.toLocaleString()}`]} />
              <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Cumulative" />
              <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" dot={false} name="Daily" />
              {periodBudget > 0 && <Line type="monotone" dataKey={() => periodBudget} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1} dot={false} name="Budget" />}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {[["#8b5cf6", "Cumulative"], ["#f59e0b", "Daily"], periodBudget > 0 && ["#ef4444", "Budget limit"]].filter(Boolean).map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
                <span style={{ width: 12, height: 2, background: c, display: "inline-block", borderRadius: 1 }} />  {l}
              </span>
            ))}
          </div>
        </div>

        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>🗓️ This Month vs Last Month</h3>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4, marginBottom: 12 }}>Cumulative spending comparison by day of the month.</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthComparison} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip {...TT} formatter={(v, n) => [`PKR ${v.toLocaleString()}`, n === "thisMonth" ? "This Month" : "Last Month"]} />
              <Line type="monotone" dataKey="thisMonth" stroke="#10b981" strokeWidth={2} dot={false} name="thisMonth" connectNulls />
              <Line type="monotone" dataKey="lastMonth" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} name="lastMonth" connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}><span style={{ width: 12, height: 2, background: "#10b981", display: "inline-block", borderRadius: 1 }} /> This Month</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}><span style={{ width: 12, height: 2, background: "#6b7280", display: "inline-block", borderRadius: 1 }} /> Last Month</span>
          </div>
        </div>
      </div>

      {/* Category Pie + Source breakdown */}
      <div style={AN.twoCol}>
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>🥧 Category Split</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CategoryPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                {pieData.map((d, i) => (
                  <span key={d.name} style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                    {d.icon} {d.name}
                  </span>
                ))}
              </div>
            </>
          ) : <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0", fontSize: 13 }}>No data</p>}
        </div>

        {/* Source breakdown */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>⚙️ Input Methods</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
            {[["✍️", "Manual", srcCounts.manual, "#3b82f6"], ["🎙️", "Voice Input", srcCounts.voice, "#10b981"], ["📸", "Bill Scanner", srcCounts.scanner, "#f59e0b"]].map(([ic, label, count, color]) => {
              const p = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{ic} {label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} ({p}%)</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                    <motion.div style={{ height: "100%", borderRadius: 3, background: color }} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg-input)", borderRadius: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>💡 Pro Tip</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Try using the bill scanner or voice input to log expenses faster and more accurately.</p>
          </div>
        </div>
      </div>

      {/* Category table */}
      <div style={AN.chartCard}>
        <h3 style={AN.chartTitle}>📋 Category Breakdown</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Category", "Amount", "% of Total", "# Transactions", "Avg per Txn"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catMap.map(([cat, amt], i) => {
                const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : 0;
                const txns = filtered.filter(e => e.category === cat).length;
                const avg = txns > 0 ? Math.round(amt / txns) : 0;
                return (
                  <motion.tr key={cat} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: 15 }}>{getIcon(cat)}</span>
                        <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{cat}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: COLORS[i % COLORS.length], fontWeight: 700 }}>{formatPKR(amt)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{pct}%</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{txns}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{formatPKR(avg)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Subscriptions & Savings Goals Advanced Analysis ── */}
      <div style={AN.twoCol}>
        {/* Goals: Target vs Saved */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}><PiggyBank size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Goals: Target vs Saved</h3>
          {goalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={goals.map(g => ({ name: g.name.substring(0,8), saved: g.savedAmount, target: g.targetAmount }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip {...TT} formatter={(v) => [formatPKR(v), "Amount"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize:10 }} />
                <Bar dataKey="saved" fill="var(--green)" radius={[4, 4, 0, 0]} name="Saved" />
                <Bar dataKey="target" fill="var(--accent-subtle)" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>No active goals.</div>
          )}
        </div>

        {/* Subscription Burn Rate */}
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}><CalendarClock size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Subscription Monthly Impact</h3>
          <div style={{ padding:"10px 0", display:"flex", alignItems:"center", justifyContent:"center" }}>
             <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:10, color:"var(--text-muted)", margin:0 }}>Total Fixed Monthly Costs</p>
                <p style={{ fontSize:28, fontWeight:800, color:"var(--accent)", margin:"4px 0" }}>{formatPKR(Math.round(fixedCostMonthly))}</p>
                <p style={{ fontSize:11, color:"var(--text-muted)", margin:0 }}>{activeSubs.length} Active Subscriptions</p>
             </div>
          </div>
          <div style={{ marginTop:20 }}>
             {activeSubs.slice(0,4).map(s => {
               const weight = (s.amount / fixedCostMonthly) * 100;
               return (
                 <div key={s.id} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                       <span style={{ color:"var(--text-primary)", fontWeight:600 }}>{s.description || s.category}</span>
                       <span style={{ color:"var(--text-muted)" }}>{formatPKR(s.amount)} ({Math.round(weight)}%)</span>
                    </div>
                    <div style={{ height:4, background:"var(--border)", borderRadius:2 }}>
                       <div style={{ height:"100%", width:`${weight}%`, background:"var(--accent)", borderRadius:2 }} />
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>
      {/* ── AI Advanced Spending Analysis ── */}
      <div style={{ ...AN.chartCard, background: "linear-gradient(145deg, var(--bg-card), var(--bg-input))", border: "1px solid var(--accent-subtle)", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={22} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ ...AN.chartTitle, margin: 0 }}>AI Advanced Spending Analysis</h3>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Deep insights based on your spending patterns</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          {getSmartAdvice(expenses, lang).slice(0, 3).map((advice, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", gap: 12 }}
            >
              <div style={{ color: "var(--accent)", marginTop: 2 }}>
                <Sparkles size={18} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{advice}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(139, 92, 246, 0.05)", border: "1px dashed var(--accent)", borderRadius: 10, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-primary)" }}>
            💡 <strong style={{ color: "var(--accent)" }}>AI Tip:</strong> {lang === "en" ? "Reducing your 'Dining Out' by just 15% could save you " : "اگر آپ 'باہر کا کھانا' صرف 15٪ کم کریں تو آپ بچا سکتے ہیں "} 
            <strong>{formatPKR(totalSpent * 0.15)}</strong> {lang === "en" ? " next month." : " اگلے ماہ۔"}
          </p>
        </div>
      </div>
    </div>
  );
}

const AN = {
  container: { padding: 18, display: "flex", flexDirection: "column", gap: 14, maxWidth: 900, margin: "0 auto" },
  periodBar: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  periodBtns: { display: "flex", gap: 4 },
  periodBtn: { padding: "6px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "var(--font)" },
  periodActive: { background: "var(--accent-subtle)", border: "1px solid var(--accent)", color: "var(--accent)" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 },
  metricCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 14px" },
  metricValue: { margin: "4px 0 3px", fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" },
  metricLabel: { margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14 },
  chartCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" },
  chartTitle: { margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" },
  backCircle: { width:36, height:36, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
};
