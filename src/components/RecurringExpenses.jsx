import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { formatPKR } from "../utils/helpers";
import { Plus, Trash2, ToggleLeft, ToggleRight, CalendarDays, RefreshCw, ChevronLeft } from "lucide-react";
import { recurringApi } from "../services/supabaseApi";

const FREQ_OPTIONS = [
  { value: "daily", label: "Daily", icon: "📅" },
  { value: "weekly", label: "Weekly", icon: "📆" },
  { value: "monthly", label: "Monthly", icon: "🗓️" },
  { value: "yearly", label: "Yearly", icon: "📊" }
];

const FREQ_COLORS = {
  daily: "#3b82f6", weekly: "#8b5cf6", monthly: "#10b981", yearly: "#f5b800"
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
  const { categories, pushToast, pushNotification, isLoading: appLoading, addExpense, expenses, refreshExpenses, recurring, setRecurring, refreshRecurring } = useApp();
  const [processingId, setProcessingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", description: "", frequency: "monthly", startDate: new Date().toISOString().slice(0, 10) });

  const handleCreate = async () => {
    if (!form.amount || !form.category) return pushToast({ type: "warning", message: "Amount and category required" });
    try {
      const data = await recurringApi.create({ ...form, amount: Number(form.amount) });
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
      await recurringApi.delete(id);
      setRecurring(prev => prev.filter(r => r.id !== id));
      pushToast({ type: "warning", message: "Subscription removed" });
    } catch (err) { pushToast({ type: "danger", message: "Failed to delete" }); }
  };

  const handleToggle = async (item) => {
    try {
      await recurringApi.update(item.id, { ...item, isActive: !item.isActive });
      setRecurring(prev => prev.map(r => r.id === item.id ? { ...r, isActive: !r.isActive } : r));
      pushToast({ type: "info", message: `${item.description || item.category} ${item.isActive ? "paused" : "resumed"}` });
    } catch (err) { pushToast({ type: "danger", message: "Failed to update" }); }
  };

  const handlePayNow = async (item) => {
    if (processingId) return;
    setProcessingId(item.id);

    const today = new Date().toISOString().slice(0, 10);
    const paymentDescription = `Bill Paid: ${item.description || item.category}`;
    const alreadyPaid = (item.lastPaidDate && item.lastPaidDate >= item.nextDueDate) ||
      expenses.some(e =>
        e.description === paymentDescription &&
        e.date >= item.nextDueDate &&
        e.date <= today
      );

    if (alreadyPaid) {
      try {
        const nextDate = calculateNextDate(item.nextDueDate, item.frequency);
        await recurringApi.update(item.id, { ...item, nextDueDate: nextDate, lastPaidDate: item.lastPaidDate || today });
        await refreshRecurring();
        pushToast({ type: "info", message: "This billing cycle is already paid." });
      } catch (err) {
        pushToast({ type: "danger", message: "Failed to update subscription" });
      }
      setProcessingId(null);
      return;
    }

    const result = await addExpense({
      amount: item.amount,
      category: item.category,
      description: paymentDescription,
      date: today
    }, { 
      title: "Bill Paid! ✅", 
      message: `Successfully paid PKR ${item.amount.toLocaleString()} for ${item.description || item.category}.`, 
      type: "success", 
      icon: "💳" 
    });

    if (!result?.success) {
      setProcessingId(null);
      return;
    }

    const nextDate = calculateNextDate(item.nextDueDate, item.frequency);
    try {
      await recurringApi.update(item.id, { ...item, nextDueDate: nextDate, lastPaidDate: today });
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
      const data = await recurringApi.processDue();
      if (data.success && data.processed > 0) {
        pushToast({ type: "success", message: `✅ ${data.processed} recurring expense(s) processed!` });
        await refreshRecurring();
        await refreshExpenses();
      } else if (data.success && data.skipped > 0) {
        pushToast({ type: "info", message: "Due subscriptions were already paid." });
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
  const billHistory = (expenses || []).filter(e => e.description?.startsWith("Bill Paid: ")).slice(0, 15);

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

      {/* Bill Payment History */}
      {billHistory.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>💳 Payment History</h3>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            {billHistory.map((exp, i) => (
              <motion.div 
                key={exp.id || i} 
                initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.05 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < billHistory.length - 1 ? "1px solid var(--border-light)" : "none", background: "rgba(255,255,255,0.02)" }}
                whileHover={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div style={{ width:32, height:32, borderRadius:8, background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                  {getIcon(exp.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description?.replace("Bill Paid: ", "") || exp.category}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", fontWeight:500 }}>{new Date(exp.date).toLocaleDateString('en-PK', { month:'short', day:'numeric' })}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "var(--red)" }}>−{formatPKR(exp.amount)}</span>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--green)", background: "var(--green-bg)", padding: "1px 5px", borderRadius:4, display:"inline-block", marginLeft:4 }}>PAID</div>
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
  summaryValue: { margin: 0, fontSize: 20, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  summaryLabel: { margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "linear-gradient(135deg, var(--accent), #f97316)", border: "none", color: "#111", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  processBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)", backdropFilter: "blur(12px)", transition: "all 0.2s" },
  formCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "24px", marginBottom: 20, overflow: "hidden", backdropFilter: "blur(12px)" },
  formTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  formGrid: { display: "flex", flexDirection: "column", gap: 14 },
  formLabel: { fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.08em" },
  backCircle: { width: 38, height: 38, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)" },
  input: { width: "100%", padding: "12px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 14, fontFamily: "var(--font)", outline: "none" },
  freqBtn: { flex: 1, padding: "8px 6px", background: "var(--bg-input)", border: "2px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s" },
  saveBtn: { width: "100%", marginTop: 20, padding: "14px", background: "linear-gradient(135deg, var(--accent), #f97316)", border: "none", color: "#111", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" },
  section: { marginBottom: 24 },
  sectionTitle: { margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.5px" },
  upcomingCard: { minWidth: 130, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", flexShrink: 0, backdropFilter: "blur(12px)" },
  itemCard: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, transition: "all 0.2s", backdropFilter: "blur(12px)" },
  freqBadge: { fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" },
  payBtn: { background: "var(--accent)", border: "none", color: "#111", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s" },
  label: { display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" },
};
