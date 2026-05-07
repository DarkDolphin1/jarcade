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
      // In a real app, we might ask the user for a path.
      // For now, we'll scan a 'games' folder in the current directory.
      const gameList: Game[] = await invoke("scan_directory", { path: "./games" });
      setGames(gameList);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to scan games. Ensure a 'games' folder exists.");
    } finally {
      setLoading(false);
    }
  };

  const launchGame = async (path: string) => {
    try {
      await invoke("launch_game", { gamePath: path });
    } catch (err) {
      console.error(err);
      alert("Failed to launch game: " + err);
    }
  };

  useEffect(() => {
    scanGames();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] bg-gradient-to-br from-[#050505] via-[#0a0a1f] to-[#050505] p-8 text-white font-sans">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            JArcade
          </h1>
          <p className="text-indigo-300/60 mt-2">Retro J2ME Game Launcher</p>
        </div>
        <button
          onClick={scanGames}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all active:scale-95"
        >
          Refresh Library
        </button>
      </header>

      <main>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-900/20 backdrop-blur-md border border-red-500/20 rounded-xl text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => scanGames()}
              className="mt-4 text-sm text-red-300 underline"
            >
              Try creating a 'games' folder and click here
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-center">
            <p className="text-indigo-200/50 text-xl">No games found in ./games</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
  );
}

export default App;
