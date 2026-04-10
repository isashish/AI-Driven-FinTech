import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { isDark, toggleTheme, T } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="app-theme-btn"
      style={{
        background: isDark ? "#1E2738" : "#F0F4FF",
        border: `1px solid ${T.border}`
      }}
    >
      <div
        className="app-theme-track"
        style={{ background: isDark ? T.teal : T.border }}
      >
        <div
          className="app-theme-knob"
          style={{ left: isDark ? 16 : 3 }}
        />
      </div>

      <span
        className="app-theme-label"
        style={{ color: T.textSub }}
      >
        {isDark ? "🌙 Dark" : "☀️ Light"}
      </span>
    </button>
  );
}