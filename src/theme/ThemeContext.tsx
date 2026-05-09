import React, { createContext, useContext, useState, ReactNode } from "react";
import { Theme, XMB_THEME, themes } from "./themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(XMB_THEME);

  const handleSetTheme = (id: string) => {
    if (themes[id]) {
      setCurrentTheme(themes[id]);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
