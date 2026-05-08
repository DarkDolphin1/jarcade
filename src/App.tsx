import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import GameCard from "./components/GameCard";

interface Game {
  name: string;
  path: string;
}

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scanGames = async () => {
    setLoading(true);
    try {
      const gameList: Game[] = await invoke("scan_directory", { path: "../games" });
      setGames(gameList);
      setError(null);
    } catch (err) {
      setError(`Failed to scan games: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const launchGame = async (path: string) => {
    try {
      await invoke("launch_game", { gamePath: path });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    scanGames();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      </div>

      <div className="relative z-10 container mx-auto px-8 py-16">
        {/* Header Section */}
        <header className="mb-20 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-300/80">System Online</span>
            </div>
            <h1 className="text-7xl font-black tracking-tighter leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-white/40">
                JARCADE
              </span>
            </h1>
            <p className="text-indigo-200/30 text-xl font-light max-w-md leading-relaxed">
              Modern access to the golden age of mobile gaming.
            </p>
          </div>
          
          <button
            onClick={scanGames}
            disabled={loading}
            className="group relative flex items-center gap-4 px-10 py-5 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[2rem] transition-all duration-500 active:scale-95 disabled:opacity-50"
          >
            <div className={`w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}></div>
            <span className="text-lg font-medium tracking-wide text-indigo-50">Refresh Library</span>
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]"></div>
          </button>
        </header>

        {/* Content Section */}
        <main className="min-h-[60vh]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/[0.02] border border-white/5 rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto p-12 bg-white/[0.02] backdrop-blur-3xl border border-red-500/20 rounded-[3rem] text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Discovery Failed</h2>
              <p className="text-indigo-200/40 mb-10 leading-relaxed">{error}</p>
              <button 
                onClick={() => scanGames()}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all font-semibold"
              >
                Retry Initialization
              </button>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white/[0.01] backdrop-blur-sm border border-white/5 rounded-[4rem] text-center">
              <div className="w-32 h-32 bg-indigo-500/5 rounded-[3rem] flex items-center justify-center mb-10 transform -rotate-6 border border-white/5">
                <span className="text-6xl grayscale opacity-30">📦</span>
              </div>
              <h2 className="text-3xl font-bold text-indigo-50 mb-4">No Data Detected</h2>
              <p className="text-indigo-200/30 max-w-sm mx-auto text-lg font-light leading-relaxed">
                Connect your library by placing <span className="text-indigo-400 font-medium">.jar</span> files in the root games directory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
              {games.map((game) => (
                <GameCard
                  key={game.path}
                  name={game.name}
                  onClick={() => launchGame(game.path)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Persistence Info Bar */}
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="px-6 py-3 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Engine: FreeJ2ME</span>
          </div>
          <div className="w-px h-3 bg-white/10"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Build 2.0.0-Stable</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
