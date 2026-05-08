import React from "react";

interface GameCardProps {
  name: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ name, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-[3/4] cursor-pointer"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 rounded-[2rem] blur-2xl transition-all duration-500"></div>
      
      {/* Main Card Container */}
      <div className="relative h-full w-full bg-white/[0.03] group-hover:bg-white/[0.07] backdrop-blur-xl border border-white/10 group-hover:border-white/20 rounded-[2rem] flex flex-col items-center justify-between p-6 transition-all duration-500 group-hover:-translate-y-2 group-active:scale-95 overflow-hidden">
        
        {/* Animated Gradient Background on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        {/* Icon Area */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative">
             {/* Subtle ring around icon */}
            <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150"></div>
            
            <div className="relative w-24 h-24 bg-gradient-to-b from-white/10 to-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-5xl filter drop-shadow-lg select-none">🎮</span>
            </div>
          </div>
        </div>
        
        {/* Game Title Area */}
        <div className="w-full pt-4 space-y-2">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="text-indigo-50 font-semibold text-center truncate px-2 text-sm tracking-wide group-hover:text-white transition-colors">
            {name}
          </h3>
          <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
             <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Play Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
