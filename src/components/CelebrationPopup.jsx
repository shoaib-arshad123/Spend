import { motion, AnimatePresence } from "framer-motion";

export default function CelebrationPopup({ reward, onClose }) {
  if (!reward) return null;

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg, var(--bg-card), var(--bg-elevated))",
              border: "2px solid var(--accent)",
              borderRadius: 24,
              padding: 40,
              textAlign: "center",
              maxWidth: 380,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Animated background particles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.05,
                background: `radial-gradient(circle at 30% 50%, var(--accent), transparent 50%)`,
                pointerEvents: "none",
              }}
            />

            {/* Confetti animation */}
            <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)" }}>
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    y: 300,
                    x: Math.cos((i / 6) * Math.PI * 2) * 150,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 2.5, delay: 0.2 }}
                  style={{
                    position: "absolute",
                    fontSize: 24,
                    left: 0,
                  }}
                >
                  {"🎉"[i % 1]}
                </motion.span>
              ))}
            </div>

            {/* Content */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              {/* Badge Icon */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3, repeat: Infinity, repeatDelay: 3 }}
                style={{
                  fontSize: 80,
                  marginBottom: 16,
                  display: "inline-block",
                  filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))",
                }}
              >
                {reward.icon}
              </motion.div>

              {/* Celebration text */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  margin: "0 0 8px",
                  fontSize: 28,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, var(--accent), var(--accent))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.5px",
                }}
              >
                🎉 Badge Unlocked!
              </motion.h2>

              {/* Badge title */}
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  margin: "12px 0 0",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {reward.title}
              </motion.h3>

              {/* Badge description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  margin: "12px 0 0",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {reward.desc}
              </motion.p>

              {/* Close hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{
                  margin: "16px 0 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Click anywhere to close
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
