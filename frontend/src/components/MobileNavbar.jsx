import React from "react";
import { Menu, Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function MobileNavbar({ toggleSidebar, onLogout }) {
  const { isDark, toggleTheme, T } = useTheme();

  const actionBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    background: T.inputBg,
    color: T.text,
    borderColor: T.border
  };

  return (
    <div
      className="mobile-navbar"
      style={{
        background: T.sidebarBg,
        borderBottom: `1px solid ${T.border}`,
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {/* LEFT - Hamburger & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="mobile-hamburger"
          onClick={toggleSidebar}
          style={{ color: T.text, display: 'flex', alignItems: 'center' }}
        >
          <Menu size={24} />
        </button>

        <div className="mobile-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="mobile-logo-icon"
            style={{
              background: `linear-gradient(135deg,${T.teal},${T.blue})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px'
            }}
          >
            <Sparkles size={16} />
          </div>

          <div className="mobile-logo-name" style={{ color: T.text, fontSize: '15px', fontWeight: '800' }}>
            AI-FinTech
          </div>
        </div>
      </div>

      {/* RIGHT - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={toggleTheme} style={actionBtnStyle}>
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={onLogout}
          style={{
            ...actionBtnStyle,
            background: T.rose + '15',
            color: T.rose,
            borderColor: T.rose + '33'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}