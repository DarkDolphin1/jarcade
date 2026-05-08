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
      // Use relative path from the backend executable's perspective
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
      alert(`Failed to launch game: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
    }
  };

  useEffect(() => {
    scanGames();
  }, []);

  return (
    <div className="min-h-screen bg-[#02020a] text-white font-sans selection:bg-indigo-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-purple-300">
              JArcade
            </h1>
            <p className="text-indigo-200/40 text-lg mt-2 font-light">
              Your retro J2ME collection, refined.
            </p>
          </div>
          
          <button
            onClick={scanGames}
            className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2 text-indigo-100 font-medium">
              <svg 
                className={`w-5 h-5 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Library
            </span>
          </button>
        </header>

        <main>
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-indigo-300/40 animate-pulse uppercase tracking-widest text-xs">Scanning games</p>
            </div>
          ) : error ? (
            <div className="p-12 bg-red-500/5 backdrop-blur-2xl border border-red-500/20 rounded-3xl text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-100 mb-2">Discovery Failed</h2>
              <p className="text-red-300/60 mb-8">{error}</p>
              <button 
                onClick={() => scanGames()}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all"
              >
                Retry Scan
              </button>
            </div>
          ) : games.length === 0 ? (
            <div className="p-20 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[3rem] text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                <span className="text-4xl">📂</span>
              </div>
              <h2 className="text-2xl font-light text-indigo-100/80 mb-2">Your library is empty</h2>
              <p className="text-indigo-200/30 max-w-xs mx-auto">
                Add .jar files to the <code className="bg-white/5 px-2 py-0.5 rounded text-indigo-300">games</code> folder to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
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

      <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
        <div className="container mx-auto flex justify-end">
           <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] text-indigo-300/40">
             Powered by FreeJ2ME
           </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
