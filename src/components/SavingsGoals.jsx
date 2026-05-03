import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { formatPKR } from "../utils/helpers";
import { Plus, Trash2, Target, TrendingUp, Sparkles, ChevronLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4444/api";
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const GOAL_CATEGORIES = [
  { value: "Emergency Fund", icon: "🛡️" },
  { value: "Travel", icon: "✈️" },
  { value: "Gadgets", icon: "💻" },
  { value: "Education", icon: "📚" },
  { value: "Vehicle", icon: "🚗" },
  { value: "Home", icon: "🏠" },
  { value: "Other", icon: "🎯" }
];

const GOAL_ICONS = ["🎯", "💻", "✈️", "🏠", "🚗", "📚", "🛡️", "💎", "🎮", "👟", "📱", "🎓"];

function ProgressRing({ pct, size = 80, stroke = 6, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: pct >= 100 ? 18 : 14, fontWeight: 800, fill: color }}>
        {pct >= 100 ? "🎉" : `${pct}%`}
      </text>
    </svg>
  );
}

export default function SavingsGoals({ setActiveTab }) {
  const { token, pushToast, pushNotification, playJingle, triggerHaptic, isLoading: appLoading, addExpense, expenses, goals, setGoals, refreshGoals } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", category: "Other", icon: "🎯", deadline: "" });

  const handleCreate = async () => {
    if (!form.name || !form.targetAmount) return pushToast({ type: "warning", message: "Name and target amount required" });
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: "POST", headers: authHeaders(token),
        body: JSON.stringify({ ...form, targetAmount: Number(form.targetAmount), deadline: form.deadline || null })
      });
      const data = await res.json();
      if (data.success) {
        setGoals(prev => [...prev, data.goal]);
        setForm({ name: "", targetAmount: "", category: "Other", icon: "🎯", deadline: "" });
        setShowForm(false);
        pushToast({ type: "success", message: `🎯 Goal "${form.name}" created!` });
        pushNotification({ title: "New Savings Goal", message: `Target: ${formatPKR(Number(form.targetAmount))}`, type: "info", icon: "🎯" });
      }
    } catch (err) { pushToast({ type: "danger", message: "Failed to create goal" }); }
  };

  const handleAddSavings = async (goalId) => {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) return pushToast({ type: "warning", message: "Enter a valid amount" });
    try {
      const res = await fetch(`${API_URL}/goals/${goalId}/savings`, {
        method: "PUT", headers: authHeaders(token),
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (data.success) {
        setGoals(prev => prev.map(g => g.id === goalId ? data.goal : g));
        setAddingTo(null);
        setAddAmount("");
        
        // Log this saving as an expense to deduct from available budget and show in history
        addExpense({
          amount: amt,
          category: "Savings",
          description: "Savings for: " + data.goal.name,
          date: new Date().toISOString().slice(0, 10)
        }, { 
          title: "Savings Added", 
          message: `PKR ${Number(amt).toLocaleString()} saved for ${data.goal.name}`, 
          type: "info", 
          icon: "💰" 
        });

        if (data.goal.isCompleted) {
          setShowConfetti(true);
          playJingle();
          triggerHaptic("success");
          pushToast({ type: "success", message: `🎉 Congratulations! Goal "${data.goal.name}" completed!` });
          pushNotification({ title: "🎉 Goal Achieved!", message: `You reached your ${formatPKR(data.goal.targetAmount)} target for "${data.goal.name}"!`, type: "success", icon: "🏆" });
          setTimeout(() => setShowConfetti(false), 4000);
        }
      }
    } catch (err) { pushToast({ type: "danger", message: "Failed to add savings" }); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/goals/${id}`, { method: "DELETE", headers: authHeaders(token) });
      setGoals(prev => prev.filter(g => g.id !== id));
      pushToast({ type: "warning", message: "Goal removed" });
    } catch (err) { pushToast({ type: "danger", message: "Failed to delete" }); }
  };

  const totalSaved = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedCount = goals.filter(g => g.isCompleted).length;
  const savingsHistory = (expenses || []).filter(e => e.description?.startsWith("Savings for: ")).slice(0, 15);

  if (appLoading) {
    return (
      <div style={S.container}>
        <div className="shimmer" style={{ height: 120, borderRadius: 16, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {[1,2].map(i => <div key={i} className="shimmer" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.6 }}
              style={{ fontSize: 80, textAlign: "center" }}>
              🎉
              <p style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)", margin: "10px 0 0" }}>Goal Achieved!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Back */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <motion.button 
          style={S.backCircle} 
          onClick={() => setActiveTab("dashboard")}
          whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
          whileTap={{ scale:0.9 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </motion.button>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>Savings Goals</h2>
      </div>

      {/* Summary Row */}
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <div>
            <p style={S.summaryValue}>{goals.length}</p>
            <p style={S.summaryLabel}>Total Goals</p>
          </div>
        </div>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>💰</span>
          <div>
            <p style={{ ...S.summaryValue, color: "var(--green)" }}>{formatPKR(totalSaved)}</p>
            <p style={S.summaryLabel}>Total Saved</p>
          </div>
        </div>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div>
            <p style={{ ...S.summaryValue, color: "var(--accent)" }}>{completedCount}</p>
            <p style={S.summaryLabel}>Completed</p>
          </div>
        </div>
      </div>

      {/* Add Goal Button */}
      <motion.button style={S.addBtn} onClick={() => setShowForm(!showForm)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Plus size={16} /> {showForm ? "Cancel" : "New Savings Goal"}
      </motion.button>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={S.formCard}>
            <h3 style={S.formTitle}><Target size={16} /> Create Savings Goal</h3>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Goal Name</label>
                <input style={S.input} placeholder="e.g. New Laptop" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Target Amount (PKR)</label>
                <input type="number" style={S.input} placeholder="e.g. 50000" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Category</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {GOAL_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm({ ...form, category: c.value, icon: c.icon })}
                      style={{ ...S.catBtn, ...(form.category === c.value ? S.catBtnActive : {}) }}>
                      {c.icon} {c.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Icon</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {GOAL_ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({ ...form, icon: ic })}
                      style={{ ...S.iconPickBtn, ...(form.icon === ic ? { border: "2px solid var(--accent)", background: "var(--accent-subtle)" } : {}) }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Deadline (optional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
                  <span>📅</span>
                  <input 
                    type="date" 
                    value={form.deadline} 
                    onChange={e => setForm({ ...form, deadline: e.target.value })} 
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                    style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font)", outline: "none", cursor: "pointer", width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <motion.button style={S.saveBtn} onClick={handleCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Create Goal
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
          <span style={{ fontSize: 52, display: "block", marginBottom: 12 }}>🎯</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>No Savings Goals Yet</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Set your first savings goal and start building towards it!</p>
        </div>
      ) : (
        <div style={S.goalsGrid}>
          {goals.map((g, i) => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const remaining = Math.max(0, g.targetAmount - g.savedAmount);
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const dailyNeeded = daysLeft && daysLeft > 0 && remaining > 0 ? Math.ceil(remaining / daysLeft) : null;
            const ringColor = g.isCompleted ? "var(--green)" : pct >= 75 ? "var(--accent)" : pct >= 40 ? "var(--blue)" : "var(--purple)";

            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ ...S.goalCard, ...(g.isCompleted ? { borderColor: "var(--green)", background: "var(--green-bg)" } : {}) }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{g.icon || "🎯"}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{g.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{g.category}</p>
                    </div>
                  </div>
                  <motion.button style={S.deleteBtn} onClick={() => handleDelete(g.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Trash2 size={14} />
                  </motion.button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "16px 0" }}>
                  <ProgressRing pct={pct} color={ringColor} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Saved</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--green)" }}>{formatPKR(g.savedAmount || 0)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Target</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{formatPKR(g.targetAmount)}</p>
                  </div>
                </div>

                {remaining > 0 && (
                  <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                    {formatPKR(remaining)} remaining
                  </p>
                )}

                {/* Smart Suggestion */}
                {dailyNeeded && !g.isCompleted && (
                  <div style={S.suggestion}>
                    <Sparkles size={12} style={{ flexShrink: 0 }} />
                    <span>Save {formatPKR(dailyNeeded)}/day to reach your goal{daysLeft > 0 ? ` in ${daysLeft} days` : ""}.</span>
                  </div>
                )}

                {daysLeft !== null && !g.isCompleted && (
                  <p style={{ margin: "6px 0 0", fontSize: 10, color: daysLeft < 0 ? "var(--red)" : daysLeft < 7 ? "var(--accent)" : "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d past deadline` : daysLeft === 0 ? "Deadline today!" : `${daysLeft} days left`}
                  </p>
                )}

                {g.isCompleted ? (
                  <div style={{ textAlign: "center", marginTop: 12, padding: "8px", background: "var(--green)", borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111" }}>🏆 Goal Completed!</p>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    {addingTo === g.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input type="number" style={{ ...S.input, flex: 1 }} placeholder="Amount" value={addAmount}
                          onChange={e => setAddAmount(e.target.value)} autoFocus />
                        <motion.button style={S.confirmBtn} onClick={() => handleAddSavings(g.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          Save
                        </motion.button>
                        <motion.button style={S.cancelBtn} onClick={() => { setAddingTo(null); setAddAmount(""); }} whileTap={{ scale: 0.97 }}>
                          ✕
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button style={S.addSavingsBtn} onClick={() => setAddingTo(g.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <TrendingUp size={14} /> Add Savings
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Savings Transaction History */}
      {savingsHistory.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>💰 Savings History</h3>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            {savingsHistory.slice(0, 10).map((exp, i) => (
              <motion.div 
                key={exp.id || i} 
                initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.05 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < savingsHistory.length - 1 ? "1px solid var(--border-light)" : "none", background: "rgba(255,255,255,0.02)" }}
                whileHover={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div style={{ width:32, height:32, borderRadius:8, background:"var(--accent-subtle)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🎯</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description.replace("Savings for: ", "")}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", fontWeight:500 }}>{new Date(exp.date).toLocaleDateString('en-PK', { month:'short', day:'numeric' })}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "var(--green)" }}>+{formatPKR(exp.amount)}</span>
                  <p style={{ margin:0, fontSize:10, color:"var(--text-muted)", fontWeight:700 }}>SAVED</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  container: { padding: "20px 16px", maxWidth: 900, margin: "0 auto" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 },
  summaryCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, backdropFilter: "blur(12px)" },
  summaryValue: { margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  summaryLabel: { margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 },
  backCircle: { width: 38, height: 38, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "linear-gradient(135deg, var(--accent), #f97316)", border: "none", color: "#111", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", marginBottom: 20, boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  formCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", marginBottom: 20, overflow: "hidden", backdropFilter: "blur(12px)" },
  formTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.5px" },
  formGrid: { display: "flex", flexDirection: "column", gap: 14 },
  label: { display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font)", outline: "none" },
  catBtn: { padding: "8px 14px", background: "var(--bg-input)", border: "2px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s" },
  catBtnActive: { background: "var(--accent-subtle)", borderColor: "var(--accent)", color: "var(--accent)", fontWeight: 700 },
  iconPickBtn: { width: 40, height: 40, background: "var(--bg-input)", border: "2px solid var(--border)", borderRadius: 10, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  saveBtn: { width: "100%", marginTop: 20, padding: "14px", background: "linear-gradient(135deg, var(--accent), #f97316)", border: "none", color: "#111", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  goalsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 },
  goalCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "20px", backdropFilter: "blur(12px)" },
  deleteBtn: { background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 6 },
  suggestion: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "var(--accent-subtle)", borderRadius: 10, fontSize: 11, color: "var(--accent)", fontWeight: 700 },
  addSavingsBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", transition: "background 0.2s" },
  confirmBtn: { padding: "10px 16px", background: "var(--green)", border: "none", color: "#111", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)" },
  cancelBtn: { padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)" },
};
