import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPKR } from "../utils/helpers";
import { translations } from "../i18n/translations";
import { useApp } from "../context/AppContext";
import { Download, Edit2 } from "lucide-react";

export default function ExpenseHistory({ t, lang, expenses, onDelete }) {
  const { editExpense, categories } = useApp();
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [sortBy,  setSortBy]  = useState("date");
  const [confirm, setConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filtered = useMemo(() => {
    return expenses
      .filter(e => filter==="all" || e.category===filter)
      .filter(e => {
        const q = search.toLowerCase();
        return !q || e.description?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      })
      .sort((a,b) => sortBy==="amount"
        ? b.amount - a.amount
        : new Date(b.date) - new Date(a.date)
      );
  }, [expenses, filter, search, sortBy]);

  const total    = filtered.reduce((s,e)=>s+e.amount,0);
  const avgAmt   = filtered.length>0 ? Math.round(total/filtered.length) : 0;
  const maxAmt   = filtered.length>0 ? Math.max(...filtered.map(e=>e.amount)) : 0;

  // Group by date
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(e => { g[e.date] = [...(g[e.date]||[]), e]; });
    return Object.entries(g).sort((a,b)=>new Date(b[0])-new Date(a[0]));
  }, [filtered]);

  // Helper to get icon for any category name
  const getIcon = (catName) => categories.find(c => c.name === catName)?.icon || "📦";

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Date", "Amount (PKR)", "Category", "Description"];
    const rows = filtered.map(e => [e.date, e.amount, e.category, `"${(e.description||"").replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `spendsmart_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditSave = () => {
    if (!editForm.amount || isNaN(editForm.amount) || Number(editForm.amount) <= 0) return;
    editExpense(editingId, { 
      amount: Number(editForm.amount), 
      category: editForm.category, 
      description: editForm.description 
    });
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div style={H.container}>
      {/* Search + sort */}
      <div style={H.toolbar}>
        <div style={H.searchWrap}>
          <span style={H.searchIcon}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} style={H.searchInput} />
          {search && <button style={H.clearBtn} onClick={()=>setSearch("")}>✕</button>}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={H.select}>
          <option value="date">Date ↓</option>
          <option value="amount">Amount ↓</option>
        </select>
        <button style={H.exportBtn} onClick={exportCSV} title="Export as CSV">
          <Download size={16} />
        </button>
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

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <span style={{ fontSize:40, display:"block", marginBottom:12 }}>🔍</span>
          <p style={{ color:"var(--text-muted)", fontSize:14 }}>{t.noExpenses}</p>
          {search && <button style={H.clearSearchBtn} onClick={()=>setSearch("")}>Clear search</button>}
        </div>
      ) : grouped.map(([date, items]) => {
        const dayTotal = items.reduce((s,e)=>s+e.amount,0);
        return (
          <div key={date}>
            <div style={H.dateHeader}>
              <span style={H.dateLabel}>{formatDate(date)}</span>
              <span style={H.dateTotalBadge}>{formatPKR(dayTotal)}</span>
            </div>
            <div style={H.group}>
              {items.map((exp, i) => (
                <motion.div key={exp.id} layout style={H.row}>
                  <div style={{ ...H.rowIcon, background:"var(--bg-elevated)" }}>
                    <span style={{ fontSize:20 }}>{getIcon(exp.category)}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={H.rowNote}>{exp.description || exp.category}</p>
                    <div style={H.rowMeta}>
                      <span style={{ ...H.catTag, background:"var(--accent-subtle)", color:"var(--accent)" }}>
                        {exp.category}
                      </span>
                      <span style={H.metaTime}>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                    <span style={H.rowAmt}>−{formatPKR(exp.amount)}</span>
                    <AnimatePresence>
                      {confirm===exp.id ? (
                        <motion.div key="confirm" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", gap:4 }}>
                          <button style={H.confirmYes} onClick={()=>{ onDelete(exp.id); setConfirm(null); }}>Delete</button>
                          <button style={H.confirmNo}  onClick={()=>setConfirm(null)}>No</button>
                        </motion.div>
                      ) : (
                        <div style={{ display:"flex", gap:8 }}>
                          <button style={H.editBtn} onClick={() => { setEditingId(exp.id); setEditForm({...exp}); }}><Edit2 size={14} /></button>
                          <button style={H.deleteBtn} onClick={()=>setConfirm(exp.id)}>🗑</button>
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
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>

                <label style={H.modalLabel}>Description</label>
                <input type="text" value={editForm.description} onChange={e=>setEditForm(f=>({...f, description:e.target.value}))} style={H.modalInput} />
              </div>
              <div style={H.modalFooter}>
                <button style={H.modalCancel} onClick={()=>setEditingId(null)}>Cancel</button>
                <button style={H.modalSave} onClick={handleEditSave}>Save Changes</button>
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
    <button
      style={{
        padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
        fontWeight: active ? 700 : 400, whiteSpace:"nowrap", fontFamily:"var(--font)",
        background: active ? (color||"var(--accent)")+"18" : "var(--bg-card)",
        border: `1px solid ${active ? (color||"var(--accent)") : "var(--border)"}`,
        color: active ? (color||"var(--accent)") : "var(--text-muted)",
      }}
      onClick={onClick}
    >{label}</button>
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
  container:     { padding:18, display:"flex", flexDirection:"column", gap:12, maxWidth:700, margin:"0 auto" },
  toolbar:       { display:"flex", gap:8 },
  searchWrap:    { flex:1, display:"flex", alignItems:"center", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", padding:"0 12px" },
  searchIcon:    { fontSize:14, flexShrink:0, marginRight:4 },
  searchInput:   { flex:1, background:"transparent", border:"none", color:"var(--text-primary)", fontSize:13, padding:"10px 0", outline:"none", fontFamily:"var(--font)" },
  clearBtn:      { background:"transparent", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:13, padding:"0 4px" },
  select:        { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:10, padding:"10px 12px", fontSize:12, outline:"none", cursor:"pointer", fontFamily:"var(--font)" },
  exportBtn:     { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:10, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s" },
  chips:         { display:"flex", gap:6, flexWrap:"wrap" },
  summaryBar:    { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 16px" },
  summaryItem:   { fontSize:12, color:"var(--text-muted)" },
  summaryDivider:{ width:1, height:12, background:"var(--border)" },
  dateHeader:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 4px 6px" },
  dateLabel:     { fontSize:12, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.08em" },
  dateTotalBadge:{ fontSize:11, color:"var(--red)", fontWeight:700, background:"var(--red-bg)", padding:"2px 8px", borderRadius:10 },
  group:         { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", marginBottom:4 },
  row:           { display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:"1px solid var(--border-light)" },
  rowIcon:       { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  rowNote:       { margin:0, fontSize:13, color:"var(--text-primary)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  rowMeta:       { margin:"4px 0 0", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" },
  catTag:        { fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6 },
  metaTime:      { fontSize:10, color:"var(--text-muted)" },
  srcBadge:      { fontSize:10, color:"var(--blue)", background:"var(--blue-bg)", padding:"2px 6px", borderRadius:6 },
  rowAmt:        { fontSize:13, color:"var(--red)", fontWeight:700, whiteSpace:"nowrap" },
  editBtn:       { background:"transparent", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:2 },
  deleteBtn:     { background:"transparent", border:"none", cursor:"pointer", fontSize:14, opacity:0.4, lineHeight:1 },
  confirmYes:    { background:"var(--red-bg)", border:"1px solid var(--red)", color:"var(--red)", borderRadius:5, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:"var(--font)" },
  confirmNo:     { background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-muted)", borderRadius:5, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:"var(--font)" },
  clearSearchBtn:{ marginTop:8, background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontFamily:"var(--font)" },
  modalOverlay:  { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:         { width:"100%", maxWidth:400, background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)", overflow:"hidden" },
  modalTitle:    { margin:0, padding:"16px 20px", fontSize:16, fontWeight:700, color:"var(--text-primary)", borderBottom:"1px solid var(--border-light)" },
  modalBody:     { padding:"20px", display:"flex", flexDirection:"column", gap:14 },
  modalLabel:    { fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:-8 },
  modalInput:    { width:"100%", background:"var(--bg-input)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none", fontFamily:"var(--font)" },
  modalFooter:   { padding:"16px 20px", background:"var(--bg-secondary)", borderTop:"1px solid var(--border-light)", display:"flex", gap:10, justifyContent:"flex-end" },
  modalCancel:   { background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"var(--font)" },
  modalSave:     { background:"var(--accent)", border:"none", color:"#111", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--font)" }
};
