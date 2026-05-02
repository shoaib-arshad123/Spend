import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { formatPKR } from "../utils/helpers";
import { Plus, Trash2, ToggleLeft, ToggleRight, CalendarDays, RefreshCw, ChevronLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4444/api";
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const FREQ_OPTIONS = [
  { value: "daily", label: "Daily", icon: "📅" },
  { value: "weekly", label: "Weekly", icon: "📆" },
  { value: "monthly", label: "Monthly", icon: "🗓️" },
  { value: "yearly", label: "Yearly", icon: "📊" }
];

const FREQ_COLORS = {
  daily: "#3b82f6", weekly: "#8b5cf6", monthly: "#10b981", yearly: "#f59e0b"
};

const calculateNextDate = (current, freq) => {
  const d = new Date(current);
  if (freq === "daily") d.setDate(d.getDate() + 1);
  else if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function RecurringExpenses({ setActiveTab }) {
  const { token, categories, pushToast, pushNotification, isLoading: appLoading, addExpense, recurring, setRecurring, refreshRecurring } = useApp();
  const [processingId, setProcessingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", description: "", frequency: "monthly", startDate: new Date().toISOString().slice(0, 10) });

  const handleCreate = async () => {
    if (!form.amount || !form.category) return pushToast({ type: "warning", message: "Amount and category required" });
    try {
      const res = await fetch(`${API_URL}/recurring`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      const data = await res.json();
      if (data.success) {
        setRecurring(prev => [...prev, data.recurring]);
        setForm({ amount: "", category: "", description: "", frequency: "monthly", startDate: new Date().toISOString().slice(0, 10) });
        setShowForm(false);
        pushToast({ type: "success", message: "Recurring expense created!" });
        pushNotification({ title: "Subscription Added", message: `${form.description || form.category} - ${formatPKR(Number(form.amount))} (${form.frequency})`, type: "info", icon: "🔄" });
      }
    } catch (err) { pushToast({ type: "danger", message: "Failed to create" }); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/recurring/${id}`, { method: "DELETE", headers: authHeaders(token) });
      setRecurring(prev => prev.filter(r => r.id !== id));
      pushToast({ type: "warning", message: "Subscription removed" });
    } catch (err) { pushToast({ type: "danger", message: "Failed to delete" }); }
  };

  const handleToggle = async (item) => {
    try {
      await fetch(`${API_URL}/recurring/${item.id}`, {
        method: "PUT", headers: authHeaders(token),
        body: JSON.stringify({ ...item, isActive: !item.isActive })
      });
      setRecurring(prev => prev.map(r => r.id === item.id ? { ...r, isActive: !r.isActive } : r));
      pushToast({ type: "info", message: `${item.description || item.category} ${item.isActive ? "paused" : "resumed"}` });
    } catch (err) { pushToast({ type: "danger", message: "Failed to update" }); }
  };

  const calculateNextDate = (current, freq) => {
    const d = new Date(current);
    if (freq === "daily") d.setDate(d.getDate() + 1);
    else if (freq === "weekly") d.setDate(d.getDate() + 7);
    else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
    else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };

  const handlePayNow = async (item) => {
    if (processingId) return;
    setProcessingId(item.id);

    const success = await addExpense({
      amount: item.amount,
      category: item.category,
      description: `Bill Paid: ${item.description || item.category}`,
      date: new Date().toISOString().slice(0, 10)
    }, { 
      title: "Bill Paid! ✅", 
      message: `Successfully paid PKR ${item.amount.toLocaleString()} for ${item.description || item.category}.`, 
      type: "success", 
      icon: "💳" 
    });

    if (!success) {
      setProcessingId(null);
      return;
    }

    const nextDate = calculateNextDate(item.nextDueDate, item.frequency);
    const today = new Date().toISOString().slice(0, 10);
    try {
      await fetch(`${API_URL}/recurring/${item.id}`, {
        method: "PUT", headers: authHeaders(token),
        body: JSON.stringify({ ...item, nextDueDate: nextDate, lastPaidDate: today })
      });
      await refreshRecurring();
      pushToast({ type: "success", message: "Bill marked as paid!" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update subscription" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessDue = async () => {
    try {
      const res = await fetch(`${API_URL}/recurring/process`, { method: "POST", headers: authHeaders(token) });
      const data = await res.json();
      if (data.success && data.processed > 0) {
        pushToast({ type: "success", message: `✅ ${data.processed} recurring expense(s) processed!` });
        await refreshRecurring();
      } else {
        pushToast({ type: "info", message: "No due recurring expenses today" });
      }
    } catch (err) { pushToast({ type: "danger", message: "Failed to process" }); }
  };

  const totalMonthly = recurring.filter(r => r.isActive).reduce((s, r) => {
    if (r.frequency === "daily") return s + r.amount * 30;
    if (r.frequency === "weekly") return s + r.amount * 4;
    if (r.frequency === "monthly") return s + r.amount;
    if (r.frequency === "yearly") return s + r.amount / 12;
    return s;
  }, 0);

  const upcomingDue = [...recurring].filter(r => r.isActive).sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate)).slice(0, 5);

  const getIcon = (catName) => categories.find(c => c.name === catName)?.icon || "📦";

  if (appLoading) {
    return (
      <div style={S.container}>
        <div className="shimmer" style={{ height: 120, borderRadius: 16, marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
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
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>Subscriptions</h2>
      </div>

      {/* Summary Cards */}
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>🔄</span>
          <div>
            <p style={S.summaryValue}>{recurring.length}</p>
            <p style={S.summaryLabel}>Subscriptions</p>
          </div>
        </div>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>💰</span>
          <div>
            <p style={{ ...S.summaryValue, color: "var(--accent)" }}>{formatPKR(Math.round(totalMonthly))}</p>
            <p style={S.summaryLabel}>Monthly Fixed Cost</p>
          </div>
        </div>
        <div style={S.summaryCard}>
          <span style={{ fontSize: 24 }}>📅</span>
          <div>
            <p style={{ ...S.summaryValue, color: "var(--blue)" }}>{recurring.filter(r => r.isActive).length}</p>
            <p style={S.summaryLabel}>Active</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <motion.button style={S.addBtn} onClick={() => setShowForm(!showForm)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Plus size={16} /> {showForm ? "Cancel" : "Add Subscription"}
        </motion.button>
        <motion.button style={S.processBtn} onClick={handleProcessDue} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <RefreshCw size={14} /> Process Due
        </motion.button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={S.formCard}>
            <h3 style={S.formTitle}>New Recurring Expense</h3>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Amount (PKR)</label>
                <input type="number" style={S.input} placeholder="e.g. 2500" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Category</label>
                <select style={S.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.icon || "📦"} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Description</label>
                <input style={S.input} placeholder="e.g. Netflix, Rent" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Frequency</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {FREQ_OPTIONS.map(f => (
                    <button key={f.value} onClick={() => setForm({ ...form, frequency: f.value })}
                      style={{ ...S.freqBtn, ...(form.frequency === f.value ? { background: FREQ_COLORS[f.value] + "22", border: `2px solid ${FREQ_COLORS[f.value]}`, color: FREQ_COLORS[f.value] } : {}) }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Start Date</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
                  <span>📅</span>
                  <input 
                    type="date" 
                    value={form.startDate} 
                    onChange={e => setForm({ ...form, startDate: e.target.value })} 
                    onClick={e => e.target.showPicker && e.target.showPicker()}
                    style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font)", outline: "none", cursor: "pointer", width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <motion.button style={S.saveBtn} onClick={handleCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Create Subscription
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Payments */}
      {upcomingDue.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}><CalendarDays size={16} /> Upcoming Payments</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {upcomingDue.map(r => {
              const daysUntil = Math.ceil((new Date(r.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntil < 0;
              const isDueToday = daysUntil === 0;
              return (
                <div key={r.id} style={{ ...S.upcomingCard, borderColor: isOverdue ? "var(--red)" : isDueToday ? "var(--accent)" : "var(--border)" }}>
                  <span style={{ fontSize: 20 }}>{getIcon(r.category)}</span>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.description || r.category}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>{formatPKR(r.amount)}</p>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: isOverdue ? "var(--red)" : isDueToday ? "var(--accent)" : "var(--text-muted)" }}>
                    {isOverdue ? `${Math.abs(daysUntil)}d overdue` : isDueToday ? "Due today!" : `in ${daysUntil}d`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Subscriptions */}
      <div style={S.section}>
        <h3 style={S.sectionTitle}>All Subscriptions</h3>
        {recurring.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 10 }}>🔄</span>
            <p style={{ margin: 0, fontSize: 14 }}>No recurring expenses yet. Add your first subscription!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recurring.map((r, i) => {
              const isDue = new Date(r.nextDueDate) <= new Date(new Date().toISOString().slice(0,10));
              const isProcessing = processingId === r.id;

              return (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ ...S.itemCard, opacity: r.isActive ? 1 : 0.5, borderColor: isDue && r.isActive ? "var(--accent)" : "var(--border)" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(r.category)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.description || r.category}</p>
                      <span style={{ ...S.freqBadge, background: FREQ_COLORS[r.frequency] + "22", color: FREQ_COLORS[r.frequency] }}>{r.frequency}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: isDue && r.isActive ? "var(--accent)" : "var(--text-muted)", fontWeight: isDue && r.isActive ? 700 : 400 }}>
                      Next: {new Date(r.nextDueDate).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                      {isDue && r.isActive && !r.lastPaidDate?.startsWith(r.nextDueDate) && " (DUE)"}
                      {r.lastPaidDate && r.lastPaidDate >= r.nextDueDate && " (PAID ✅)"}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>{formatPKR(r.amount)}</p>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {r.isActive && isDue && (
                      <motion.button 
                        style={{ 
                          ...S.payBtn, 
                          opacity: isProcessing ? 0.6 : 1,
                          ...(r.lastPaidDate && r.lastPaidDate >= r.nextDueDate ? { background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "default", border: "1px solid var(--border)" } : {})
                        }} 
                        disabled={isProcessing || (r.lastPaidDate && r.lastPaidDate >= r.nextDueDate)}
                        onClick={() => {
                          if (!(r.lastPaidDate && r.lastPaidDate >= r.nextDueDate)) handlePayNow(r);
                        }} 
                        whileHover={!(r.lastPaidDate && r.lastPaidDate >= r.nextDueDate) ? { scale: 1.05 } : {}} 
                        whileTap={!(r.lastPaidDate && r.lastPaidDate >= r.nextDueDate) ? { scale: 0.95 } : {}}
                      >
                        {isProcessing ? "..." : (r.lastPaidDate && r.lastPaidDate >= r.nextDueDate) ? "Already Paid" : "Pay Now"}
                      </motion.button>
                    )}
                    <div style={{ display: "flex", gap: 4 }}>
                      <motion.button style={S.iconBtn} onClick={() => handleToggle(r)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title={r.isActive ? "Pause" : "Resume"}>
                        {r.isActive ? <ToggleRight size={18} color="var(--green)" /> : <ToggleLeft size={18} color="var(--text-muted)" />}
                      </motion.button>
                      <motion.button style={S.iconBtn} onClick={() => handleDelete(r.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Delete">
                        <Trash2 size={14} color="var(--red)" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  container: { padding: 18, maxWidth: 900, margin: "0 auto" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 },
  summaryCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 },
  summaryValue: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" },
  summaryLabel: { margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "var(--accent)", border: "none", color: "#111", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)" },
  processBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" },
  formCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 20, overflow: "hidden" },
  formTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" },
  formGrid: { display: "flex", flexDirection: "column", gap: 14 },
  formLabel: { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" },
  backCircle: { width:36, height:36, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  input: { width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font)", outline: "none" },
  freqBtn: { flex: 1, padding: "8px 6px", background: "var(--bg-input)", border: "2px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s" },
  saveBtn: { width: "100%", marginTop: 16, padding: "12px", background: "var(--accent)", border: "none", color: "#111", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)" },
  section: { marginBottom: 24 },
  sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 },
  upcomingCard: { minWidth: 130, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", flexShrink: 0 },
  itemCard: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, transition: "all 0.2s" },
  freqBadge: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" },
  payBtn: { background: "var(--accent)", border: "none", color: "#111", padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)" }
};
