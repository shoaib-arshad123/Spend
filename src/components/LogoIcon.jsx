import logo from "../assets/logo.png";

/**
 * LogoIcon — Flexible logo component
 * 
 * Props:
 *  - size:      height of the logo image (px). Default 64.
 *  - variant:   "full" (logo with text, default), "icon" (icon only - cropped to S symbol)
 *  - showName:  if true, renders a separate "SpendSmart" text label beside the icon
 *  - nameSize:  font size for the optional name label
 *  - className: optional CSS class
 *  - glow:      if true, adds a subtle golden glow behind the logo
 */
export function LogoIcon({ 
  size = 64, 
  className = "", 
  showName = false, 
  nameSize = 22,
  variant = "full",
  glow = false 
}) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: showName ? 10 : 0,
      position: "relative"
    }}>
      {glow && (
        <div style={{
          position: "absolute",
          inset: "-30%",
          background: "radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0
        }} />
      )}
      <img 
        src={logo} 
        alt="SpendSmart Logo" 
        className={className}
        style={{ 
          height: size, 
          width: "auto",
          maxWidth: variant === "icon" ? size : "none",
          objectFit: "contain",
          display: "block",
          position: "relative",
          zIndex: 1,
          ...(variant === "icon" ? { objectPosition: "center top" } : {})
        }} 
      />
      {showName && (
        <span style={{ 
          fontSize: nameSize, 
          fontWeight: 900, 
          background: "linear-gradient(135deg, #f5b800, #ffd04a)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px",
          fontFamily: "'Outfit', sans-serif",
          whiteSpace: "nowrap",
          position: "relative",
          zIndex: 1
        }}>
          SpendSmart
        </span>
      )}
    </div>
  );
}
