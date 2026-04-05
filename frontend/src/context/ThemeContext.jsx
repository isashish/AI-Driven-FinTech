import React, { createContext, useContext, useState, useEffect } from 'react';

const light = {
  mode: 'light',
  bg:          '#F4F7FB',
  surface:     '#FFFFFF',
  surface2:    '#EEF2FF',
  border:      '#E2E8F4',
  shadow:      '0 2px 18px rgba(60,80,160,0.08)',
  shadowHov:   '0 8px 36px rgba(60,80,160,0.15)',
  teal:        '#0EA5A0',
  tealLight:   '#E6F7F7',
  tealDark:    '#0C8A86',
  blue:        '#4F6EF7',
  blueLight:   '#EEF1FF',
  violet:      '#7C5CFC',
  amber:       '#F59E0B',
  amberLight:  '#FEF3C7',
  rose:        '#F43F5E',
  roseLight:   '#FFF1F4',
  green:       '#10B981',
  greenLight:  '#ECFDF5',
  text:        '#1A2340',
  textSub:     '#4B5A7A',
  textMuted:   '#8A97B8',
  inputBg:     '#F4F7FB',
  navActive:   'linear-gradient(135deg,#E6F7F7,#EEF1FF)',
  sidebarBg:   '#FFFFFF',
  cardBg:      '#FFFFFF',
};

const dark = {
  mode: 'dark',
  bg:          '#0D1117',
  surface:     '#161B27',
  surface2:    '#1E2738',
  border:      '#263045',
  shadow:      '0 2px 18px rgba(0,0,0,0.35)',
  shadowHov:   '0 8px 36px rgba(0,0,0,0.5)',
  teal:        '#2DD4CF',
  tealLight:   '#0D2E2D',
  tealDark:    '#22B2AD',
  blue:        '#6B8EFF',
  blueLight:   '#111C3A',
  violet:      '#A78BFA',
  amber:       '#FBBF24',
  amberLight:  '#2A1F05',
  rose:        '#FB7185',
  roseLight:   '#2A0D14',
  green:       '#34D399',
  greenLight:  '#052E1C',
  text:        '#E8EDF5',
  textSub:     '#94A3C0',
  textMuted:   '#5A6A8A',
  inputBg:     '#0D1117',
  navActive:   'linear-gradient(135deg,#0D2E2D,#111C3A)',
  sidebarBg:   '#161B27',
  cardBg:      '#161B27',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('finai-theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('finai-theme', isDark ? 'dark' : 'light');
    document.body.style.background = isDark ? dark.bg : light.bg;
  }, [isDark]);

  const T = isDark ? dark : light;
  const toggleTheme = () => setIsDark(p => !p);

  return (
    <ThemeContext.Provider value={{ T, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
