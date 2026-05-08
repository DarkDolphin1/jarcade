import { LucideIcon, Settings, Gamepad2, Globe, Box, RefreshCw } from "lucide-react";

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    cardBg: string;
    cardBorder: string;
    selectionBar: string;
  };
  icons: {
    settings: LucideIcon;
    game: LucideIcon;
    network: LucideIcon;
    fallback: LucideIcon;
    loading: LucideIcon;
    empty: LucideIcon;
  };
  animations: {
    cardHover: string;
    selectionPulse: string;
  };
  transitions: {
    tabEnter: any;
    tabExit: any;
    tabInitial: any;
  };
  styles: {
    showXmbBackground: boolean;
    useGlassmorphism: boolean;
  };
}

export const XMB_THEME: Theme = {
  id: "xmb",
  name: "XMB Classic",
  colors: {
    background: "#000814",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.4)",
    accent: "#0070d1",
    cardBg: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    selectionBar: "linear-gradient(90deg, rgba(0, 100, 200, 0.0) 0%, rgba(0, 100, 200, 0.18) 20%, rgba(0, 120, 220, 0.22) 50%, rgba(0, 100, 200, 0.18) 80%, rgba(0, 100, 200, 0.0) 100%)",
  },
  icons: {
    settings: Settings,
    game: Gamepad2,
    network: Globe,
    fallback: Gamepad2,
    loading: RefreshCw,
    empty: Box,
  },
  animations: {
    cardHover: "hover:scale(1.06) transition-transform duration-300",
    selectionPulse: "animate-selection-pulse", // Requires CSS definition
  },
  transitions: {
    tabEnter: { opacity: 1, x: 0, scale: 1 },
    tabExit: { opacity: 0, x: -20, scale: 0.98 },
    tabInitial: { opacity: 0, x: 20, scale: 1.02 },
  },
  styles: {
    showXmbBackground: true,
    useGlassmorphism: true,
  }
};

export const MINIMAL_DARK: Theme = {
  id: "minimal",
  name: "Minimal Dark",
  colors: {
    background: "#1C1C1C",
    textPrimary: "#E0E0E0",
    textSecondary: "#888888",
    accent: "#4F46E5",
    cardBg: "#252525",
    cardBorder: "#333333",
    selectionBar: "rgba(79, 70, 229, 0.3)",
  },
  icons: {
    settings: Settings,
    game: Gamepad2,
    network: Globe,
    fallback: Gamepad2,
    loading: RefreshCw,
    empty: Box,
  },
  animations: {
    cardHover: "hover:translate-x-2 transition-all duration-200",
    selectionPulse: "",
  },
  transitions: {
    tabEnter: { opacity: 1, y: 0 },
    tabExit: { opacity: 0, y: 10 },
    tabInitial: { opacity: 0, y: -10 },
  },
  styles: {
    showXmbBackground: false,
    useGlassmorphism: false,
  }
};

export const themes: Record<string, Theme> = {
  xmb: XMB_THEME,
  minimal: MINIMAL_DARK,
};
