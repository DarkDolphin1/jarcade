import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import GameCard from "./components/GameCard";
import { useTheme } from "./theme/ThemeContext";
import { themes } from "./theme/themes";
import { motion, AnimatePresence } from "framer-motion";

import { Settings, Gamepad2, Globe, Box, RefreshCw, Star } from "lucide-react";

interface Game {
  name: string;
  path: string;
  icon?: string;
  emoji?: string;
  favorite: boolean;
  playtime: number;
}

const EMOJIS = ["🎮","🕹️","⚔️","🏎️","🚀","🐍","🧱","🥷","🐠","⚡","🎯","🏆"];

const CATEGORIES = [
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "game",     icon: Gamepad2, label: "Game"     },
  { id: "network",  icon: Globe,    label: "Network"  },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  const { theme } = useTheme();
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div className="xmb-clock" style={{ color: theme.colors.textSecondary }}>
      {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      {"  "}
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function App() {
  const { theme, setTheme } = useTheme();
  const [games, setGames]               = useState<Game[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [catIdx, setCatIdx]             = useState(1); // Default to "Game"
  const [launching, setLaunching]       = useState(false);
  const [runningGames, setRunningGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    let unlistenStart: any;
    let unlistenExit: any;

    const setupListeners = async () => {
      try {
        const initialRunning: string[] = await invoke("get_running_games");
        setRunningGames(new Set(initialRunning));
      } catch (e) { console.error(e); }

      unlistenStart = await listen<string>("game-started", (event) => {
        setRunningGames(prev => {
          const next = new Set(prev);
          next.add(event.payload);
          return next;
        });
      });

      unlistenExit = await listen<string>("game-exited", (event) => {
        setRunningGames(prev => {
          const next = new Set(prev);
          next.delete(event.payload);
          return next;
        });
        scanGames(); 
      });
    };

    setupListeners();

    return () => {
      if (unlistenStart) unlistenStart();
      if (unlistenExit) unlistenExit();
    };
  }, []);

  const scanGames = async () => {
    setLoading(true);
    try {
      const list: Game[] = await invoke("scan_directory", { path: "../games" });
      setGames(list.map((g, i) => ({ ...g, emoji: EMOJIS[i % EMOJIS.length] })));
    } catch (err) {
      console.error(err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (game: Game) => {
    try {
      const newStatus: boolean = await invoke("toggle_favorite", { gamePath: game.path });
      setGames(prev => prev.map(g => g.path === game.path ? { ...g, favorite: newStatus } : g));
    } catch (err) {
      console.error(err);
    }
  };

  const launchGame = async (path: string) => {
    if (launching) return;

    if (runningGames.has(path)) {
      alert("This game instance is already active.");
      return;
    }

    setLaunching(true);
    try { await invoke("launch_game", { gamePath: path }); }
    catch (err) { alert(err); }
    finally { setTimeout(() => setLaunching(false), 1000); }
  };
  const handleKey = useCallback((e: KeyboardEvent) => {
    let maxIdx = 0;
    const activeId = CATEGORIES[catIdx].id;
    
    if (activeId === "game") {
      maxIdx = Math.max(0, games.length - 1);
    } else if (activeId === "settings") {
      maxIdx = Object.keys(themes).length - 1;
    }

    if (e.key === "ArrowUp")    setSelectedIdx(i => Math.max(0, i - 1));
    if (e.key === "ArrowDown")  setSelectedIdx(i => Math.min(maxIdx, i + 1));
    
    if (e.key === "ArrowLeft")  {
      setCatIdx(i => Math.max(0, i - 1));
      setSelectedIdx(0);
    }
    if (e.key === "ArrowRight") {
      setCatIdx(i => Math.min(CATEGORIES.length - 1, i + 1));
      setSelectedIdx(0);
    }
    
    if (e.key === "Enter") {
      if (activeId === "game" && games[selectedIdx]) {
        launchGame(games[selectedIdx].path);
      } else if (activeId === "settings") {
        const themeId = Object.keys(themes)[selectedIdx];
        if (themeId) setTheme(themeId);
      }
    }
  }, [games, selectedIdx, catIdx, launching, setTheme]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    (e.currentTarget as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
    (e.currentTarget as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => { scanGames(); }, []);

  const activeCat = CATEGORIES[catIdx];
  const selectedGame = activeCat.id === "game" ? games[selectedIdx] : null;
  const arcs = [340, 420, 500, 580, 660, 740, 820];

  return (
    <div style={{ 
      minHeight: "100vh", 
      position: "relative", 
      background: theme.colors.background, 
      color: theme.colors.textPrimary,
      overflow: "hidden" 
    }}>

      {theme.styles.showXmbBackground && (
        <div className="xmb-bg">
          <div className="xmb-wave" />
          <div className="xmb-arcs">
            {arcs.map((r, i) => (
              <div
                key={r}
                className="xmb-arc"
                style={{
                  width: r * 2,
                  height: r * 2,
                  bottom: `-${r * 0.6}px`,
                  left: `calc(22% - ${r}px)`,
                  animationDelay: `${i * 1.5}s`,
                  animationDuration: `${10 + i * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="xmb-topbar">
        <div />
        <Clock />
      </div>

      <div className="xmb-categories">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`xmb-cat ${catIdx === i ? "active" : ""}`}
              onClick={() => {
                setCatIdx(i);
                setSelectedIdx(0);
              }}
            >
              <div className="xmb-cat-icon">
                <Icon size={24} strokeWidth={1.5} color="white" />
              </div>
              <div className="xmb-cat-label" style={{ color: catIdx === i ? theme.colors.textPrimary : theme.colors.textSecondary }}>
                {cat.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="xmb-separator" />

      <div className="xmb-items" onMouseMove={handleMouseMove}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat.id}
            initial={theme.transitions.tabInitial}
            animate={theme.transitions.tabEnter}
            exit={theme.transitions.tabExit}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ width: "100%" }}
          >
            {activeCat.id === "game" ? (
              loading ? (
                <div className="flex items-center gap-3 text-indigo-200/30 font-light tracking-widest text-xs uppercase animate-pulse">
                  <theme.icons.loading size={14} className="animate-spin" color="white" />
                  Initializing Library...
                </div>
              ) : games.length === 0 ? (
                <div className="xmb-item selected">
                  <div className="xmb-selection-bar" style={{ background: theme.colors.selectionBar }} />
                  <div className="xmb-item-icon" style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }}>
                    <theme.icons.empty size={28} strokeWidth={1.5} color="white" />
                  </div>
                  <div className="xmb-item-info">
                    <div className="xmb-item-name" style={{ color: theme.colors.textPrimary }}>No Games Found</div>
                    <div className="xmb-item-sub" style={{ color: theme.colors.textSecondary }}>Place .jar files in the games/ directory</div>
                  </div>
                </div>
              ) : (
                games.map((game, i) => (
                  <GameCard
                    key={game.path}
                    name={game.name}
                    icon={game.icon}
                    favorite={game.favorite}
                    playtime={game.playtime}
                    isRunning={runningGames.has(game.path)}
                    onToggleFavorite={() => toggleFavorite(game)}
                    emoji={game.emoji ?? "🎮"}
                    selected={i === selectedIdx}
                    onClick={() => {
                      setSelectedIdx(i);
                      if (i === selectedIdx) launchGame(game.path);
                    }}
                  />
                ))
              )
            ) : activeCat.id === "settings" ? (
              <div className="flex flex-col gap-0">
                <div className="text-indigo-200/20 font-light tracking-[0.2em] text-[10px] uppercase mb-6 ml-2">
                  System Appearance
                </div>
                {Object.values(themes).map((t, i) => (
                  <div 
                    key={t.id}
                    className={`xmb-item ${selectedIdx === i ? "selected" : ""} ${theme.animations.cardHover}`}
                    onClick={() => {
                      setSelectedIdx(i);
                      setTheme(t.id);
                    }}
                  >
                    <div className="xmb-selection-bar" style={{ 
                      background: theme.colors.selectionBar, 
                      display: selectedIdx === i ? 'block' : 'none' 
                    }} />
                    <div className="xmb-item-icon" style={{ 
                      backgroundColor: theme.colors.cardBg, 
                      borderColor: theme.colors.cardBorder 
                    }}>
                      <theme.icons.settings size={28} strokeWidth={1.5} color="white" />
                    </div>
                    <div className="xmb-item-info">
                      <div className="xmb-item-name" style={{ color: theme.colors.textPrimary }}>{t.name}</div>
                      <div className="xmb-item-sub" style={{ color: theme.colors.textSecondary }}>
                        {theme.id === t.id ? "Currently Active" : "Press Enter to apply"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="xmb-item selected">
                <div className="xmb-selection-bar" style={{ background: theme.colors.selectionBar }} />
                <div className="xmb-item-icon" style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }}>
                  <theme.icons.network size={28} strokeWidth={1.5} color="white" />
                </div>
                <div className="xmb-item-info">
                  <div className="xmb-item-name" style={{ color: theme.colors.textPrimary }}>{activeCat.label}</div>
                  <div className="xmb-item-sub" style={{ color: theme.colors.textSecondary }}>System Category Placeholder</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedGame && (
        <div className="xmb-detail">
          <div className="xmb-detail-art" style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }}>
            {launching ? (
              <div className="w-full h-full flex items-center justify-center animate-spin">
                <theme.icons.loading size={48} strokeWidth={1} color="white" />
              </div>
            ) : selectedGame.icon ? (
              <img src={selectedGame.icon} className="w-32 h-32 object-contain" />
            ) : (
              <theme.icons.game size={72} strokeWidth={1} color="white" style={{ opacity: 0.2 }} />
            )}
          </div>
          <div className="xmb-detail-title" style={{ color: theme.colors.textPrimary }}>
            {selectedGame.name}
          </div>
          <div className="xmb-detail-meta" style={{ color: theme.colors.textSecondary }}>
            {runningGames.has(selectedGame.path) ? (
              <span className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-widest text-[10px]">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Currently Running
              </span>
            ) : launching ? "Executing Application..." : `J2ME Classic · Played ${Math.floor(selectedGame.playtime / 60)}m`}
          </div>
        </div>
      )}

      <div className="xmb-hints">
        <div className="xmb-hint">
          <div className="xmb-hint-btn triangle" style={{ color: theme.colors.accent, borderColor: theme.colors.accent }}>△</div>
          <div className="xmb-hint-label" style={{ color: theme.colors.textSecondary }}>Options</div>
        </div>
        <div className="xmb-hint">
          <div className="xmb-hint-btn circle">○</div>
          <div className="xmb-hint-label" style={{ color: theme.colors.textSecondary }}>Back</div>
        </div>
        <div className="xmb-hint">
          <div className="xmb-hint-btn cross">✕</div>
          <div className="xmb-hint-label" style={{ color: theme.colors.textSecondary }}>Launch</div>
        </div>
      </div>
    </div>
  );
}

export default App;
