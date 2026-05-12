import { motion } from "framer-motion";

/**
 * SkeletonLoader — Reusable shimmer skeleton for loading states
 * Follows HCI principle: provide visual feedback during loading
 */

const shimmer = {
  animate: { backgroundPosition: ["200% 0", "-200% 0"] },
  transition: { duration: 1.8, repeat: Infinity, ease: "linear" },
};

function SkeletonBlock({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <motion.div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--bg-input) 25%, var(--border-light) 50%, var(--bg-input) 75%)",
        backgroundSize: "200% 100%",
        ...style,
      }}
      animate={shimmer.animate}
      transition={shimmer.transition}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width={180} height={28} radius={10} />
        <SkeletonBlock width={100} height={32} radius={10} />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <SkeletonBlock width={40} height={40} radius={10} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="70%" height={24} radius={6} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="50%" height={12} radius={4} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
        <SkeletonBlock width={120} height={18} radius={6} style={{ marginBottom: 20 }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
          {[40, 65, 50, 80, 35, 70, 55].map((h, i) => (
            <SkeletonBlock key={i} width="100%" height={`${h}%`} radius={6} style={{ flex: 1 }} />
          ))}
        </div>
      </div>

      {/* List items */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
        <SkeletonBlock width={100} height={16} radius={6} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--border-light)" : "none" }}>
            <SkeletonBlock width={40} height={40} radius={12} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="60%" height={14} radius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="40%" height={10} radius={4} />
            </div>
            <SkeletonBlock width={60} height={18} radius={6} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 16px" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <SkeletonBlock width={44} height={44} radius={12} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="50%" height={14} radius={4} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="30%" height={10} radius={4} />
            </div>
          </div>
          <SkeletonBlock width="90%" height={12} radius={4} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="70%" height={12} radius={4} />
        </div>
      ))}
    </motion.div>
  );
}

export function PageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <SkeletonBlock width={200} height={28} radius={10} />
      <SkeletonBlock width="100%" height={1} radius={0} style={{ opacity: 0.5 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
            <SkeletonBlock width={36} height={36} radius={10} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="80%" height={16} radius={4} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="60%" height={12} radius={4} />
          </div>
        ))}
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border-light)" : "none" }}>
            <SkeletonBlock width={36} height={36} radius={10} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width={`${50 + i * 8}%`} height={13} radius={4} style={{ marginBottom: 5 }} />
              <SkeletonBlock width="35%" height={10} radius={4} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function HistorySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock width={140} height={28} radius={10} />
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBlock width={36} height={36} radius={10} />
          <SkeletonBlock width={36} height={36} radius={10} />
        </div>
      </div>
      <SkeletonBlock width="100%" height={44} radius={12} style={{ marginBottom: 10 }} />
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <SkeletonBlock width={40} height={40} radius={12} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock width="45%" height={14} radius={4} style={{ marginBottom: 6 }} />
            <SkeletonBlock width="30%" height={10} radius={4} />
          </div>
          <SkeletonBlock width={70} height={18} radius={6} />
        </div>
      ))}
    </motion.div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      <SkeletonBlock width={180} height={28} radius={10} />
      <div style={{ display: "flex", gap: 12 }}>
        <SkeletonBlock width={100} height={36} radius={18} />
        <SkeletonBlock width={100} height={36} radius={18} />
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SkeletonBlock width="80%" height="80%" radius="50%" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
            <SkeletonBlock width="40%" height={12} radius={4} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="80%" height={24} radius={6} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function AddExpenseSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SkeletonBlock width={36} height={36} radius="50%" />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width={150} height={24} radius={6} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={200} height={12} radius={4} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <SkeletonBlock width={120} height={34} radius={10} />
        <SkeletonBlock width={80} height={34} radius={10} />
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
        <SkeletonBlock width={80} height={10} radius={4} style={{ marginBottom: 12 }} />
        <SkeletonBlock width="60%" height={48} radius={8} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} width={45} height={24} radius={12} />)}
        </div>
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 14, display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <SkeletonBlock width={20} height={20} radius={4} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <SkeletonBlock width={80} height={12} radius={4} />
            <SkeletonBlock width={120} height={8} radius={4} />
          </div>
        </div>
        <SkeletonBlock width={60} height={28} radius={8} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <SkeletonBlock width={32} height={32} radius={8} />
            <SkeletonBlock width="60%" height={8} radius={3} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}
    >
      <SkeletonBlock width={100} height={100} radius="50%" style={{ marginBottom: 10 }} />
      <SkeletonBlock width={180} height={24} radius={6} style={{ marginBottom: 4 }} />
      <SkeletonBlock width={140} height={14} radius={4} style={{ marginBottom: 20 }} />
      
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <SkeletonBlock width={24} height={24} radius={6} />
            <SkeletonBlock width="50%" height={14} radius={4} />
            <div style={{ flex: 1 }} />
            <SkeletonBlock width={16} height={16} radius={4} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function RewardsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}
    >
      <SkeletonBlock width={160} height={28} radius={10} />
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, height: 160 }} />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <SkeletonBlock width={60} height={60} radius="50%" />
            <SkeletonBlock width="80%" height={14} radius={4} />
            <SkeletonBlock width="60%" height={10} radius={4} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default SkeletonBlock;
