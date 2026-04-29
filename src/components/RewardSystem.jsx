import { motion } from "framer-motion";
import { classifyUser, formatPKR } from "../utils/helpers";
import { useApp } from "../context/AppContext";

const BADGES = [
  { id:"first",    icon:"🌟", title:"First Step",      desc:"Added your first expense",              unlocked:e=>e.length>=1 },
  { id:"five",     icon:"📊", title:"Data Tracker",    desc:"Tracked 5+ expenses",                   unlocked:e=>e.length>=5 },
  { id:"ten",      icon:"🔥", title:"On Fire!",         desc:"Tracked 10+ expenses",                  unlocked:e=>e.length>=10 },
  { id:"twenty",   icon:"💪", title:"Dedicated",       desc:"Tracked 20+ expenses",                  unlocked:e=>e.length>=20 },
  { id:"saver",    icon:"💰", title:"Smart Saver",     desc:"Stayed under 60% of budget",            unlocked:(e,b)=>b>0&&e.reduce((s,x)=>s+x.amount,0)/b<0.6 },
  { id:"variety",  icon:"🎨", title:"Well Rounded",    desc:"Used 4+ spending categories",           unlocked:e=>new Set(e.map(x=>x.category)).size>=4 },
  { id:"scanner",  icon:"📸", title:"Tech Savvy",      desc:"Scanned a bill receipt",                unlocked:e=>e.some(x=>x.source==="scanner") },
  { id:"voice",    icon:"🎙️", title:"Hands-Free",      desc:"Used voice to add expense",             unlocked:e=>e.some(x=>x.source==="voice") },
  { id:"books",    icon:"📚", title:"Scholar",         desc:"Tracked a book/stationery expense",     unlocked:e=>e.some(x=>x.category==="books") },
  { id:"health",   icon:"💊", title:"Health Aware",    desc:"Tracked a health expense",              unlocked:e=>e.some(x=>x.category==="health") },
  { id:"mindful",  icon:"🥗", title:"Mindful Spender", desc:"Food < 40% of total spending",          unlocked:e=>{ const t=e.reduce((s,x)=>s+x.amount,0); const f=e.filter(x=>x.category==="food").reduce((s,x)=>s+x.amount,0); return t>0&&f/t<0.4; } },
  { id:"streak7",  icon:"🗓️", title:"Week Warrior",    desc:"Tracked expenses for 7 consecutive days", unlocked:e=>streak(e)>=7 },
];

function streak(expenses) {
  const dates = new Set(expenses.map(e=>e.date));
  let s=0;
  for (let i=0;i<30;i++) { const d=new Date(); d.setDate(d.getDate()-i); if(dates.has(d.toISOString().slice(0,10))) s++; else if(i>0) break; }
  return s;
}

const TYPE_CONFIG = {
  saver:   { label:"💚 Smart Saver",  color:"var(--green)",  bg:"var(--green-bg)",   message:"Excellent! You're managing your budget wisely. Keep it up!", next:"Maintain spending below 60% of budget to keep this status." },
  balanced:{ label:"🟡 Balanced",     color:"var(--accent)", bg:"var(--accent-subtle)", message:"Good balance! A little more discipline and you'll be a top saver.", next:"Reduce spending to below 60% of your budget to become a Saver." },
  spender: { label:"🔴 High Spender", color:"var(--red)",    bg:"var(--red-bg)",     message:"You've been spending heavily. Try cutting your top categories.", next:"Bring spending below 85% of budget to become Balanced." },
};

export default function RewardSystem({ t, expenses, budget }) {
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
  const userType   = classifyUser(totalSpent, budget);
  const currentStreak = streak(expenses);
  const tc         = TYPE_CONFIG[userType];
  const earned     = BADGES.filter(b=>b.unlocked(expenses, budget));
  const locked     = BADGES.filter(b=>!b.unlocked(expenses, budget));
  const pct        = Math.round((earned.length/BADGES.length)*100);

  return (
    <div style={RW.container}>
      {/* Profile classification card */}
      <motion.div style={{ ...RW.profileCard, background:tc.bg, border:`1px solid ${tc.color}30` }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <div style={{ ...RW.profileIcon, borderColor:tc.color }}>
            {userType==="saver"?"🏆":userType==="balanced"?"⚖️":"⚠️"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:tc.color, marginBottom:4 }}>{tc.label}</div>
            <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)", lineHeight:1.5 }}>{tc.message}</p>
            <p style={{ margin:"6px 0 0", fontSize:12, color:"var(--text-muted)" }}>💡 {tc.next}</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:36, fontWeight:900, color:tc.color, lineHeight:1 }}>{currentStreak}</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{t.streakDays}</div>
          </div>
        </div>
      </motion.div>

      {/* Streak calendar */}
      <div style={RW.card}>
        <h3 style={RW.cardTitle}>🗓 Activity (Last 14 Days)</h3>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Array.from({length:14},(_,i)=>{
            const d=new Date(); d.setDate(d.getDate()-(13-i));
            const ds=d.toISOString().slice(0,10);
            const hasActivity=expenses.some(e=>e.date===ds);
            const isToday=i===13;
            const dayAmt=expenses.filter(e=>e.date===ds).reduce((s,e)=>s+e.amount,0);
            return (
              <div key={i} title={`${ds}: ${formatPKR(dayAmt)}`} style={{ ...RW.calDay, background: hasActivity?"var(--green)":isToday?"var(--accent-subtle)":"var(--bg-input)", border:`1px solid ${hasActivity?"var(--green)":isToday?"var(--accent)":"var(--border)"}` }}>
                <span style={{ fontSize:9, color: hasActivity?"var(--bg-primary)":isToday?"var(--accent)":"var(--text-muted)", fontWeight:700 }}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()]}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ margin:"10px 0 0", fontSize:12, color:"var(--text-muted)" }}>🟢 = Day with tracked expenses</p>
      </div>

      {/* Badge progress */}
      <div style={RW.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={RW.cardTitle}>🏅 Badges — {earned.length}/{BADGES.length}</h3>
          <div style={RW.progressPill}>
            <div style={{ ...RW.progressFill, width:`${pct}%` }} />
            <span style={RW.progressText}>{pct}%</span>
          </div>
        </div>

        {/* Earned */}
        {earned.length > 0 && (
          <>
            <p style={RW.groupLabel}>✅ Earned ({earned.length})</p>
            <div style={RW.badgeGrid}>
              {earned.map((b,i) => (
                <motion.div key={b.id} style={RW.badgeCard} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.06, type:"spring" }} whileHover={{ y:-4 }}>
                  <span style={{ fontSize:30, display:"block", marginBottom:6 }}>{b.icon}</span>
                  <p style={RW.badgeTitle}>{b.title}</p>
                  <p style={RW.badgeDesc}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Locked */}
        {locked.length > 0 && (
          <>
            <p style={{ ...RW.groupLabel, marginTop:16 }}>🔒 Locked ({locked.length})</p>
            <div style={RW.badgeGrid}>
              {locked.map(b => (
                <div key={b.id} style={{ ...RW.badgeCard, opacity:0.4, filter:"grayscale(1)" }}>
                  <span style={{ fontSize:30, display:"block", marginBottom:6 }}>{b.icon}</span>
                  <p style={{ ...RW.badgeTitle, color:"var(--text-muted)" }}>{b.title}</p>
                  <p style={RW.badgeDesc}>{b.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Motivation */}
      <div style={{ ...RW.card, textAlign:"center", padding:"24px 20px" }}>
        <span style={{ fontSize:36 }}>{currentStreak>=7?"🔥":currentStreak>=3?"⚡":"💪"}</span>
        <p style={{ margin:"10px 0 4px", fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>
          {currentStreak===0 ? "Start your streak today!" : currentStreak>=7 ? `Amazing ${currentStreak}-day streak! 🔥` : `${currentStreak}-day streak! Keep going!`}
        </p>
        <p style={{ margin:0, fontSize:13, color:"var(--text-muted)" }}>
          {currentStreak===0 ? "Log an expense every day to build your streak and earn the Week Warrior badge." : `${7-Math.min(currentStreak,7)} more days to earn the Week Warrior badge!`}
        </p>
      </div>
    </div>
  );
}

const RW = {
  container:    { padding:18, display:"flex", flexDirection:"column", gap:14, maxWidth:700, margin:"0 auto" },
  profileCard:  { borderRadius:16, padding:"20px 22px" },
  profileIcon:  { width:60, height:60, borderRadius:"50%", border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0, background:"var(--bg-card)" },
  card:         { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px" },
  cardTitle:    { margin:0, fontSize:15, fontWeight:700, color:"var(--text-primary)" },
  calDay:       { width:38, height:38, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  progressPill: { position:"relative", width:80, height:18, background:"var(--border)", borderRadius:9, overflow:"hidden" },
  progressFill: { position:"absolute", left:0, top:0, height:"100%", background:"var(--green)", borderRadius:9, transition:"width 0.8s" },
  progressText: { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"var(--text-primary)" },
  groupLabel:   { fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" },
  badgeGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 },
  badgeCard:    { background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 10px", textAlign:"center" },
  badgeTitle:   { margin:"0 0 4px", fontSize:12, fontWeight:700, color:"var(--text-primary)" },
  badgeDesc:    { margin:0, fontSize:10, color:"var(--text-muted)", lineHeight:1.4 },
};
