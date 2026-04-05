import React from "react";

export default function MobileNavbar({ toggleSidebar, T }) {
  return (
    <div
      className="mobile-navbar"
      style={{
        background: T.sidebarBg,
        borderBottom: `1px solid ${T.border}`
      }}
    >
      {/* LEFT - Hamburger */}
      <button
        className="mobile-hamburger"
        onClick={toggleSidebar}
        style={{ color: T.text }}
      >
        ☰
      </button>

      {/* CENTER - Logo */}
      <div className="mobile-logo-wrap">
        <div
          className="mobile-logo-icon"
          style={{
            background: `linear-gradient(135deg,${T.teal},${T.blue})`
          }}
        >
          💎
        </div>

        <div>
          <div className="mobile-logo-name" style={{ color: T.text }}>
            AI-FinTech
          </div>
          <div
            className="mobile-logo-sub"
            style={{ color: T.textMuted }}
          >
            Health Planner
          </div>
        </div>
      </div>
    </div>
  );
}