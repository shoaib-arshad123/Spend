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

const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#f97316", "#6b7280"];
const TT = { contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 12 }, cursor: { fill: "rgba(255,255,255,0.04)" } };

function filterByPeriod(expenses, period) {
  if (period === "all") return expenses;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return expenses.filter(e => e.date >= cutoff);
}

function getMonthlyData(expenses) {
  const m = {};
  expenses.forEach(e => { const mo = e.date.slice(0, 7); m[mo] = (m[mo] || 0) + e.amount; });
  return Object.entries(m).sort().slice(-6).map(([mo, amount]) => ({ month: new Date(mo + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }), amount }));
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

export default function Analytics() {
  const { expenses, budget } = useApp();
  const [period, setPeriod] = useState("30d");

  const filtered = useMemo(() => filterByPeriod(expenses, period), [expenses, period]);
  const monthly = useMemo(() => getMonthlyData(expenses), [expenses]);
  const daily = useMemo(() => getDailyData(filtered, period === "7d" ? 7 : 30), [filtered, period]);
  const weekday = useMemo(() => getWeekdayData(filtered), [filtered]);

  const catMap = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const pieData = catMap.map(([name, value]) => ({ name, value }));
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const avgPerDay = filtered.length > 0 ? Math.round(totalSpent / (period === "7d" ? 7 : 30)) : 0;
  const maxDay = daily.reduce((m, d) => d.amount > m.amount ? d : m, { amount: 0, day: "N/A" });
  const topCat = catMap[0];
  const srcCounts = { manual: 0, voice: 0, scanner: 0 };
  filtered.forEach(e => { if (srcCounts[e.source || "manual"] !== undefined) srcCounts[e.source || "manual"]++; });

  const PERIOD_OPTIONS = [["7d", "7 Days"], ["30d", "30 Days"], ["90d", "3 Months"], ["all", "All Time"]];

  const MetricCard = ({ icon, label, value, color, sub }) => (
    <motion.div style={AN.metricCard} whileHover={{ y: -3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {sub && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-input)", padding: "2px 7px", borderRadius: 8 }}>{sub}</span>}
      </div>
      <p style={{ ...AN.metricValue, color }}>{value}</p>
      <p style={AN.metricLabel}>{label}</p>
    </motion.div>
  );

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
      {/* Period filter */}
      <div style={AN.periodBar}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Period:</span>
        <div style={AN.periodBtns}>
          {PERIOD_OPTIONS.map(([k, l]) => (
            <button key={k} style={{ ...AN.periodBtn, ...(period === k ? AN.periodActive : {}) }} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={AN.metricsGrid}>
        <MetricCard icon="💸" label="Total Spent" value={formatPKR(totalSpent)} color="var(--red)" sub={`${filtered.length} txns`} />
        <MetricCard icon="📅" label="Daily Average" value={formatPKR(avgPerDay)} color="var(--accent)" sub="avg" />
        <MetricCard icon="📈" label="Peak Day" value={maxDay.day || "N/A"} color="var(--blue)" sub={formatPKR(maxDay.amount)} />
        <MetricCard icon="🏆" label="Top Category" value={topCat ? `${getCategoryIcon(topCat[0])} ${topCat[0]}` : "—"} color="var(--purple)" sub={topCat ? formatPKR(topCat[1]) : ""} />
      </div>

      {/* Monthly trend + daily */}
      <div style={AN.twoCol}>
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📅 Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip {...TT} formatter={v => [`PKR ${v.toLocaleString()}`, "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} fill="url(#mg)" dot={{ r: 3, fill: "#f59e0b" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>📊 By Weekday</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekday} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip {...TT} formatter={(v, n) => [`PKR ${v.toLocaleString()}`, n === "avg" ? "Average" : "Total"]} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} name="avg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative line */}
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
            {budget > 0 && <Line type="monotone" dataKey={() => budget} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1} dot={false} name="Budget" />}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          {[["#8b5cf6", "Cumulative"], ["#f59e0b", "Daily"], budget > 0 && ["#ef4444", "Budget limit"]].filter(Boolean).map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ width: 12, height: 2, background: c, display: "inline-block", borderRadius: 1 }} />  {l}
            </span>
          ))}
        </div>
      </div>

      {/* Category + Pie */}
      <div style={AN.twoCol}>
        <div style={AN.chartCard}>
          <h3 style={AN.chartTitle}>🥧 Category Split</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TT} formatter={v => [`PKR ${v.toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                {pieData.map((d, i) => (
                  <span key={d.name} style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                    {getCategoryIcon(d.name)} {d.name}
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
                    <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 15 }}>{getCategoryIcon(cat)}</span> <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{cat}</span></td>
                    <td style={{ padding: "10px 12px", color: "var(--accent)", fontWeight: 700 }}>{formatPKR(amt)}</td>
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
};
