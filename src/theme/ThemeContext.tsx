import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { Theme, XMB_THEME, themes } from "./themes";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";

interface ThemeContextType {
  theme: Theme;
  setTheme: (id: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(XMB_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const hasPlayedAudio = useRef(false);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const library: any = await invoke("get_library_data");
        const savedThemeId = library.active_theme;
        
        if (savedThemeId && themes[savedThemeId]) {
          const theme = themes[savedThemeId];
          console.log(`[ThemeContext] Loading saved theme: ${savedThemeId} (${theme.name})`);
          setCurrentTheme(theme);
          
          if (savedThemeId === "xmb_wave" && theme.assets?.startupAudio && !hasPlayedAudio.current) {
            const assetUrl = theme.assets.startupAudio.startsWith("/") 
              ? theme.assets.startupAudio 
              : convertFileSrc(theme.assets.startupAudio);
              
            console.log(`[ThemeContext] Attempting to play startup audio: ${theme.assets.startupAudio}`);
            
            const audio = new Audio(assetUrl);
            audio.play()
              .then(() => console.log("[ThemeContext] Startup audio playing successfully."))
              .catch(e => console.error("[ThemeContext] Startup audio playback failed:", e));
            hasPlayedAudio.current = true;
          }
        } else {
          console.log("[ThemeContext] No saved theme or invalid ID, using default.");
        }
      } catch (e) {
        console.error("Failed to load saved theme:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initTheme();
  }, []);

  const handleSetTheme = async (id: string) => {
    if (themes[id]) {
      const newTheme = themes[id];
      setCurrentTheme(newTheme);
      
      try {
        const library: any = await invoke("get_library_data");
        library.active_theme = id;
        await invoke("save_library_data", { data: library });
      } catch (e) {
        console.error("Failed to persist theme choice:", e);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: handleSetTheme, isLoading }}>
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
