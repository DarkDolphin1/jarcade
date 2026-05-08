import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import GameCard from "./components/GameCard";

interface Game {
  name: string;
  path: string;
  icon?: string;
  emoji?: string;
}

const EMOJIS = ["🎮","🕹️","⚔️","🏎️","🚀","🐍","🧱","🥷","🐠","⚡","🎯","🏆"];

const CATEGORIES = [
  { id: "settings",icon: "⚙️", label: "Settings" },
  { id: "game",    icon: "🎮", label: "Game"     },
  { id: "network", icon: "🌐", label: "Network"  },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="xmb-clock">
      {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      {"  "}
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function App() {
  const [games, setGames]               = useState<Game[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [catIdx, setCatIdx]             = useState(1); // Default to "Game"
  const [launching, setLaunching]       = useState(false);

  const scanGames = async () => {
    setLoading(true);
    try {
      const list: Game[] = await invoke("scan_directory", { path: "../games" });
      setGames(list.map((g, i) => ({ ...g, emoji: EMOJIS[i % EMOJIS.length] })));
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const launchGame = async (path: string) => {
    if (launching) return;
    setLaunching(true);
    try { await invoke("launch_game", { gamePath: path }); }
    catch (err) { console.error(err); }
    finally { setTimeout(() => setLaunching(false), 2000); }
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowUp")    setSelectedIdx(i => Math.max(0, i - 1));
    if (e.key === "ArrowDown")  setSelectedIdx(i => Math.min(games.length - 1, i + 1));
    if (e.key === "ArrowLeft")  setCatIdx(i => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setCatIdx(i => Math.min(CATEGORIES.length - 1, i + 1));
    if (e.key === "Enter" && CATEGORIES[catIdx].id === "game" && games[selectedIdx]) {
      launchGame(games[selectedIdx].path);
    }
  }, [games, selectedIdx, catIdx, launching]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => { scanGames(); }, []);

  const activeCat = CATEGORIES[catIdx];
  const selectedGame = activeCat.id === "game" ? games[selectedIdx] : null;

  const arcs = [340, 420, 500, 580, 660, 740, 820];

  return (
    <div style={{ minHeight: "100vh", position: "relative", background: "#000814", overflow: "hidden" }}>

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

      <div className="xmb-topbar">
        <div />
        <Clock />
      </div>

      <div className="xmb-categories">
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            className={`xmb-cat ${catIdx === i ? "active" : ""}`}
            onClick={() => setCatIdx(i)}
          >
            <div className="xmb-cat-icon">{cat.icon}</div>
            <div className="xmb-cat-label">{cat.label}</div>
          </div>
        ))}
      </div>

      <div className="xmb-separator" />

      <div className="xmb-items">
        {activeCat.id === "game" ? (
          loading ? (
            <div className="text-indigo-200/30 font-light tracking-widest text-xs uppercase animate-pulse">
              Initializing Library...
            </div>
          ) : games.length === 0 ? (
            <div className="xmb-item selected">
              <div className="xmb-item-icon"><span>📦</span></div>
              <div className="xmb-item-info">
                <div className="xmb-item-name">No Games Found</div>
                <div className="xmb-item-sub">Place .jar files in the games/ directory</div>
              </div>
            </div>
          ) : (
            games.map((game, i) => (
              <GameCard
                key={game.path}
                name={game.name}
                icon={game.icon}
                emoji={game.emoji ?? "🎮"}
                selected={i === selectedIdx}
                onClick={() => {
                  setSelectedIdx(i);
                  if (i === selectedIdx) launchGame(game.path);
                }}
              />
            ))
          )
        ) : (
          <div className="xmb-item selected">
            <div className="xmb-item-icon"><span>{activeCat.icon}</span></div>
            <div className="xmb-item-info">
              <div className="xmb-item-name">{activeCat.label}</div>
              <div className="xmb-item-sub">System Category Placeholder</div>
            </div>
          </div>
        )}
      </div>

      {selectedGame && (
        <div className="xmb-detail">
          <div className="xmb-detail-art">
            {launching ? (
              <div className="w-full h-full flex items-center justify-center animate-spin">⚡</div>
            ) : selectedGame.icon ? (
              <img src={selectedGame.icon} className="w-32 h-32 object-contain" />
            ) : (
              selectedGame.emoji
            )}
          </div>
          <div className="xmb-detail-title">
            {selectedGame.name}
          </div>
          <div className="xmb-detail-meta text-indigo-300/40">
            {launching ? "Executing Application..." : "J2ME Classic · MIDP 2.0"}
          </div>
        </div>
      )}

      <div className="xmb-hints">
        <div className="xmb-hint">
          <div className="xmb-hint-btn triangle">△</div>
          <div className="xmb-hint-label">Options</div>
        </div>
        <div className="xmb-hint">
          <div className="xmb-hint-btn circle">○</div>
          <div className="xmb-hint-label">Back</div>
        </div>
        <div className="xmb-hint">
          <div className="xmb-hint-btn cross">✕</div>
          <div className="xmb-hint-label">Launch</div>
        </div>
      </div>
    </div>
  );
}

export default App;
