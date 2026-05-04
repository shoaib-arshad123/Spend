import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPKR } from "../utils/helpers";
import { translations } from "../i18n/translations";
import { useApp } from "../context/AppContext";
import { Download, Edit2, FileText, PiggyBank, ChevronLeft, Trash2, AlertTriangle } from "lucide-react";
import { getCategoryIcon } from "../i18n/translations";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExpenseHistory({ t, lang, expenses, onDelete, setActiveTab }) {
  const { editExpense, categories, user, budgetHistory, isLoading, clearAllExpenses, clearMonthExpenses } = useApp();
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy,  setSortBy]  = useState("date");
  const [confirm, setConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filtered = useMemo(() => {
    return expenses
      .filter(e => filter==="all" || e.category===filter)
      .filter(e => {
        if (typeFilter === "all") return true;
        if (typeFilter === "goal") return e.description?.startsWith("Goal Contribution:");
        if (typeFilter === "subscription") return e.description?.startsWith("Bill Paid:");
        if (typeFilter === "regular") return !e.description?.startsWith("Goal Contribution:") && !e.description?.startsWith("Bill Paid:");
        return true;
      })
      .filter(e => {
        const q = search.toLowerCase();
        return !q || e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q);
      })
      .sort((a,b) => sortBy==="amount"
        ? (Number(b.amount) || 0) - (Number(a.amount) || 0)
        : new Date(b.date) - new Date(a.date)
      );
  }, [expenses, filter, typeFilter, search, sortBy]);

  const total    = filtered.reduce((s,e)=>s+e.amount,0);
  const avgAmt   = filtered.length>0 ? Math.round(total/filtered.length) : 0;
  const maxAmt   = filtered.length>0 ? Math.max(...filtered.map(e=>e.amount)) : 0;

  // Group by month
  const groupedByMonth = useMemo(() => {
    const g = {};
    filtered.forEach(e => { 
      const mo = e.date.slice(0, 7); // YYYY-MM
      if (!g[mo]) g[mo] = { spent: 0, expenses: [] };
      g[mo].spent += e.amount;
      g[mo].expenses.push(e);
    });
    return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));
  }, [filtered]);

  // Helper to get icon for any category name
  const getIcon = (catName) => {
    const cat = categories.find(c => c.name === catName);
    if (cat?.icon) return cat.icon;
    return getCategoryIcon(catName);
  };

  // Build a map of month -> budget for per-month display
  const budgetHistoryMap = useMemo(() => {
    return (budgetHistory || []).reduce((map, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
      map[key] = item.amount;
      return map;
    }, {});
  }, [budgetHistory]);

  const exportPDF = () => {
    if (filtered.length === 0) return;
    const doc = new jsPDF();
    const now = new Date();
    
    // Calculations for Header
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const weekTotal = expenses
      .filter(e => new Date(e.date) >= oneWeekAgo)
      .reduce((s, e) => s + e.amount, 0);

    const lastMonthTotal = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= firstDayLastMonth && d <= lastDayLastMonth;
      })
      .reduce((s, e) => s + e.amount, 0);

    const allTimeTotal = expenses.reduce((s, e) => s + e.amount, 0);

    // Styling & Header
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11); // Accent color
    doc.text("SpendSmart Financial Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`User: ${user?.name || "Customer"}`, 14, 28);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 34);

    // Summary Cards Section
    doc.setDrawColor(230);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(14, 40, 182, 25, 3, 3, 'FD');
    
    doc.text("THIS WEEK", 20, 47);
    doc.text("LAST MONTH", 80, 47);
    doc.text("ALL-TIME TOTAL", 145, 47);

    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`${formatPKR(weekTotal)}`, 20, 57);
    doc.text(`${formatPKR(lastMonthTotal)}`, 80, 57);
    doc.text(`${formatPKR(allTimeTotal)}`, 145, 57);

    // Table
    const tableHeaders = [["TXN ID", "DATE & TIME", "CATEGORY", "DESCRIPTION", "AMOUNT"]];
    const tableData = filtered.map((e) => [
      `TXN-${e.id ?? ""}`,
      `${e.date || ""} ${new Date(e.createdAt || e.date || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      e.category || "Other",
      e.description || "-",
      formatPKR(Number(e.amount) || 0)
    ]);

    autoTable(doc, {
      startY: 75,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      margin: { top: 75 }
    });

    doc.save(`SpendSmart_Report_${now.toISOString().slice(0,10)}.pdf`);
  };

  const handleEditSave = () => {
    if (!editForm.amount || editForm.amount <= 0 || !editForm.category) return;
    editExpense(editingId, { ...editForm, amount: Number(editForm.amount) });
    setEditingId(null);
    setEditForm(null);
  };

  if (isLoading) {
    return (
      <div style={H.container}>
        <div className="shimmer" style={{ height: 60, borderRadius: 12, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          <div className="shimmer" style={{ height: 90, borderRadius: 12 }} />
          <div className="shimmer" style={{ height: 90, borderRadius: 12 }} />
          <div className="shimmer" style={{ height: 90, borderRadius: 12 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 14 }}>🧾</span>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>No Expense History</h3>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Your expense history will appear here once you add some transactions.</p>
      </div>
    );
  }


  return (
    <div style={H.container}>
      {/* Header with Back */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
        <motion.button 
          style={H.backCircle} 
          onClick={() => setActiveTab("dashboard")}
          whileHover={{ scale:1.1, background:"var(--bg-elevated)" }}
          whileTap={{ scale:0.9 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </motion.button>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>{t.history}</h2>
      </div>

      {/* Search + sort */}
      <div style={H.toolbar}>
        <div style={H.searchWrap}>
          <span style={H.searchIcon}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} style={H.searchInput} />
          {search && <motion.button style={H.clearBtn} onClick={()=>setSearch("")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>✕</motion.button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={H.select}>
          <option value="date">Date ↓</option>
          <option value="amount">Amount ↓</option>
        </select>
        <motion.button 
          style={H.exportBtn} 
          onClick={exportPDF}
          whileHover={{ scale:1.05, borderColor:"var(--accent)" }}
          whileTap={{ scale:0.95 }}
          title="Download expense report as PDF"
        >
          <Download size={14} /> PDF
        </motion.button>
      </div>

      {/* Category chips */}
      <div style={H.chips}>
        <Chip label={t.filterAll} active={filter==="all"} onClick={()=>setFilter("all")} />
        {categories.map(cat => (
          <Chip
            key={cat.name}
            label={`${cat.icon || "📦"} ${cat.name}`}
            active={filter===cat.name}
            onClick={()=>setFilter(cat.name)}
          />
        ))}
      </div>

      {/* Type filters */}
      <div style={H.typeFilters}>
        <button style={typeFilter==="all"?H.pillActive:H.pill} onClick={()=>setTypeFilter("all")}>All Transactions</button>
        <button style={typeFilter==="regular"?H.pillActive:H.pill} onClick={()=>setTypeFilter("regular")}>🛒 General</button>
        <button style={typeFilter==="goal"?H.pillActive:H.pill} onClick={()=>setTypeFilter("goal")}>🎯 Goal Savings</button>
        <button style={typeFilter==="subscription"?H.pillActive:H.pill} onClick={()=>setTypeFilter("subscription")}>🗓️ Bill Payments</button>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div style={H.summaryBar}>
          <span style={H.summaryItem}><strong style={{ color:"var(--text-primary)" }}>{filtered.length}</strong> expenses</span>
          <span style={H.summaryDivider} />
          <span style={H.summaryItem}>Total: <strong style={{ color:"var(--red)" }}>{formatPKR(total)}</strong></span>
          <span style={H.summaryDivider} />
          <span style={H.summaryItem}>Avg: <strong style={{ color:"var(--accent)" }}>{formatPKR(avgAmt)}</strong></span>
          <span style={H.summaryDivider} />
          <span style={H.summaryItem}>Max: <strong style={{ color:"var(--purple)" }}>{formatPKR(maxAmt)}</strong></span>
        </div>
      )}

      {/* Grouped list by Month */}
      {groupedByMonth.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <span style={{ fontSize:40, display:"block", marginBottom:12 }}>🔍</span>
          <p style={{ color:"var(--text-muted)", fontSize:14 }}>{t.noExpenses}</p>
          {search && <motion.button style={H.clearSearchBtn} onClick={()=>setSearch("")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Clear search</motion.button>}
        </div>
      ) : groupedByMonth.map(([mo, data]) => {
        const dateObj = new Date(mo + "-01");
        const monthName = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const isCurrentMonth = mo === new Date().toISOString().slice(0, 7);
        // Use the specific budget for this month, not a global budget
        const monthBudget = budgetHistoryMap[mo] ?? 0;
        const rem = monthBudget > 0 ? monthBudget - data.spent : 0;
        
        return (
          <div key={mo} style={{ marginBottom: 24 }}>
            <div style={{ ...H.monthHeader, background: isCurrentMonth ? "var(--accent-subtle)" : "var(--bg-card)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                  {isCurrentMonth ? "📍 " : "📅 "}{monthName}
                </h3>
                {monthBudget > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                    Budget: {formatPKR(monthBudget)} <span style={{ margin:"0 6px" }}>|</span> 
                    <span style={{ color: rem >= 0 ? "var(--green)" : "var(--red)", fontWeight:600 }}>
                      {rem >= 0 ? `${formatPKR(rem)} Left` : `${formatPKR(Math.abs(rem))} Overspent`}
                    </span>
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--red)" }}>{formatPKR(data.spent)}</span>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{data.expenses.length} expenses</p>
              </div>
            </div>
            
            <div style={H.group}>
              {data.expenses.map((exp) => (
                <motion.div key={exp.id} layout style={{...H.row, cursor:"pointer"}} whileHover={{ background:"var(--bg-elevated)", scale: 1.01, x: 4, boxShadow:"var(--shadow-md)" }} transition={{type:"spring", stiffness:300}}>
                  <div style={{ ...H.rowIcon, background: exp.category === "Savings" ? "var(--green-bg)" : "var(--bg-input)" }}>
                    {exp.category === "Savings" ? (
                      <PiggyBank size={20} color="var(--green)" />
                    ) : (
                      <span style={{ fontSize:20 }}>{getIcon(exp.category)}</span>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={H.rowNote}>{exp.description || exp.category}</p>
                    <div style={H.rowMeta}>
                      <span style={{ ...H.catTag, background:"var(--accent-subtle)", color:"var(--accent)" }}>
                        {exp.category}
                      </span>
                      <span style={H.metaTxn}>TXN-{exp.id}</span>
                      <span style={H.metaTime}>
                        {formatDate(exp.date)} • {new Date(exp.createdAt || exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                    <span style={H.rowAmt}>−{formatPKR(exp.amount)}</span>
                    <AnimatePresence>
                      {confirm===exp.id ? (
                        <motion.div key="confirm" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", gap:4 }}>
                          <motion.button style={H.confirmYes} onClick={()=>{ onDelete(exp.id); setConfirm(null); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Delete</motion.button>
                          <motion.button style={H.confirmNo}  onClick={()=>setConfirm(null)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>No</motion.button>
                        </motion.div>
                      ) : (
                        <div style={{ display:"flex", gap:8 }}>
                          <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} style={H.editBtn} onClick={() => { setEditingId(exp.id); setEditForm({...exp}); }}><Edit2 size={14} /></motion.button>
                          <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} style={H.deleteBtn} onClick={()=>setConfirm(exp.id)}>🗑</motion.button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingId && editForm && (
          <div style={H.modalOverlay}>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} style={H.modal}>
              <h3 style={H.modalTitle}>Edit Expense</h3>
              <div style={H.modalBody}>
                <label style={H.modalLabel}>Amount</label>
                <input type="number" value={editForm.amount} onChange={e=>setEditForm(f=>({...f, amount:e.target.value}))} style={H.modalInput} min="1" />
                
                <label style={H.modalLabel}>Category</label>
                <select value={editForm.category} onChange={e=>setEditForm(f=>({...f, category:e.target.value}))} style={H.modalInput}>
                  {categories.length > 0 
                    ? categories.map(c => <option key={c.name} value={c.name}>{getIcon(c.name)} {c.name}</option>)
                    : ["Food & Dining", "Transportation", "Education", "Health & Fitness", "Entertainment", "Shopping", "Bills & Utilities", "Travel", "Other"].map(c => <option key={c} value={c}>{getIcon(c)} {c}</option>)
                  }
                </select>

                <label style={H.modalLabel}>Description</label>
                <input type="text" value={editForm.description} onChange={e=>setEditForm(f=>({...f, description:e.target.value}))} style={H.modalInput} />
              </div>
              <div style={H.modalFooter}>
                <motion.button style={H.modalCancel} onClick={()=>setEditingId(null)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button style={H.modalSave} onClick={handleEditSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Save Changes</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ label, active, onClick, color }) {
  return (
    <motion.button
      style={{
        padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
        fontWeight: active ? 700 : 400, whiteSpace:"nowrap", fontFamily:"var(--font)",
        background: active ? (color||"var(--accent)")+"18" : "var(--bg-card)",
        border: `1px solid ${active ? (color||"var(--accent)") : "var(--border)"}`,
        color: active ? (color||"var(--accent)") : "var(--text-muted)",
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >{label}</motion.button>
  );
}

function formatDate(ds) {
  const d = new Date(ds);
  const today = new Date().toISOString().slice(0,10);
  const yest  = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if (ds===today) return "Today";
  if (ds===yest)  return "Yesterday";
  return d.toLocaleDateString("en-PK",{ weekday:"short", month:"short", day:"numeric" });
}

const H = {
  container:     { padding:"12px 16px", display:"flex", flexDirection:"column", gap:12, maxWidth:860, margin:"0 auto", position: "relative" },
  toolbar:       { display:"flex", gap:8, flexWrap:"wrap" },
  searchWrap:    { flex:1, display:"flex", alignItems:"center", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", padding:"0 12px", backdropFilter:"blur(12px)" },
  searchIcon:    { fontSize:14, flexShrink:0, marginRight:6 },
  searchInput:   { flex:1, background:"transparent", border:"none", color:"var(--text-primary)", fontSize:13, padding:"10px 0", outline:"none", fontFamily:"var(--font)" },
  clearBtn:      { background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:13, padding:"0 4px" },
  select:        { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:12, padding:"10px 14px", fontSize:12, outline:"none", cursor:"pointer", fontFamily:"var(--font)", backdropFilter:"blur(12px)", fontWeight: 600 },
  exportBtn:     { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:12, padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, backdropFilter:"blur(12px)", fontWeight: 700 },
  chips:         { display:"flex", gap:6, flexWrap:"wrap", marginTop: 2 },
  summaryBar:    { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"12px 16px", backdropFilter:"blur(12px)" },
  summaryItem:   { fontSize:12, color:"var(--text-muted)", fontWeight: 500 },
  summaryDivider:{ width:1, height:14, background:"var(--border)" },
  monthHeader:   { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderRadius:"14px 14px 0 0", border:"1px solid var(--border)", borderBottom:"none", flexWrap: "wrap", gap: 8, backdropFilter:"blur(12px)" },
  dateHeader:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 6px 6px" },
  dateLabel:     { fontSize:11, fontWeight:800, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.1em" },
  dateTotalBadge:{ fontSize:11, color:"var(--red)", fontWeight:800, background:"var(--red-bg)", padding:"2px 8px", borderRadius:10 },
  group:         { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"0 0 14px 14px", overflow:"hidden", backdropFilter:"blur(12px)" },
  row:           { display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:"1px solid var(--border-light)" },
  rowIcon:       { width:38, height:38, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  rowNote:       { margin:0, fontSize:14, color:"var(--text-primary)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  rowMeta:       { margin:"4px 0 0", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" },
  catTag:        { fontSize:10, fontWeight:800, padding:"2px 6px", borderRadius:6 },
  metaTime:      { fontSize:10, color:"var(--text-muted)", fontWeight: 500 },
  metaTxn:       { fontSize:10, color:"var(--text-secondary)", fontWeight:700, background:"var(--bg-elevated)", padding:"2px 6px", borderRadius:4 },
  srcBadge:      { fontSize:10, color:"var(--blue)", background:"var(--blue-bg)", padding:"2px 6px", borderRadius:6 },
  rowAmt:        { fontSize:14, color:"var(--red)", fontWeight:800, whiteSpace:"nowrap", letterSpacing:"-0.5px" },
  editBtn:       { background:"var(--accent-subtle)", border:"none", cursor:"pointer", color:"var(--accent)", padding:"6px 10px", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" },
  deleteBtn:     { background:"var(--red-bg)", border:"none", cursor:"pointer", fontSize:14, color:"var(--red)", padding:"6px 10px", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" },
  confirmYes:    { background:"var(--red-bg)", border:"1px solid var(--red)", color:"var(--red)", borderRadius:8, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"var(--font)", fontWeight:700 },
  confirmNo:     { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:8, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"var(--font)", fontWeight:700 },
  clearSearchBtn:{ marginTop:8, background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:12, fontFamily:"var(--font)", fontWeight: 600 },
  modalOverlay:  { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modal:         { width:"100%", maxWidth:400, background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"0 24px 48px rgba(0,0,0,0.4)", overflow:"hidden" },
  modalTitle:    { margin:0, padding:"16px", fontSize:18, fontWeight:900, color:"var(--text-primary)", borderBottom:"1px solid var(--border-light)", textAlign:"center", letterSpacing:"-0.5px" },
  modalBody:     { padding:"20px 16px", display:"flex", flexDirection:"column", gap:14 },
  modalLabel:    { fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:-6 },
  modalInput:    { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:10, padding:"12px 14px", fontSize:14, outline:"none", fontFamily:"var(--font)" },
  modalFooter:   { padding:"14px 16px", background:"var(--bg-secondary)", borderTop:"1px solid var(--border-light)", display:"flex", gap:10, justifyContent:"flex-end" },
  modalCancel:   { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"var(--font)" },
  modalSave:     { background:"var(--accent)", border:"none", color:"#111", padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:800, fontFamily:"var(--font)" },
  typeFilters:   { display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 },
  pill:          { padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:600, border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", cursor:"pointer", transition:"0.2s" },
  pillActive:    { padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:800, border:"1px solid var(--accent)", background:"var(--accent)", color:"#111", cursor:"pointer", boxShadow:"0 4px 12px rgba(245,158,11,0.2)" },
  backCircle:    { width:34, height:34, borderRadius:"50%", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", backdropFilter:"blur(12px)" },
  bulkConfirmBar:{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"var(--red-bg)", border:"1px solid var(--red)", borderRadius:12, flexWrap:"wrap" },
  bulkYes:       { background:"var(--red)", border:"none", color:"#fff", padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)" },
  bulkNo:        { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--font)" },
  monthClearBtn: { background:"var(--red-bg)", border:"1px solid rgba(239,68,68,0.3)", color:"var(--red)", width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 },
};
