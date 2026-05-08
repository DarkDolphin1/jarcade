import React from "react";

interface GameCardProps {
  name: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ name, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative h-48 cursor-pointer perspective-1000"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
      
      {/* Card Content */}
      <div className="relative h-full p-6 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-2xl border border-white/10 group-hover:border-white/20 rounded-3xl flex flex-col items-center justify-between transition-all duration-500 group-hover:-translate-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner">
          <span className="text-3xl filter drop-shadow-md">🎮</span>
        </div>
        
        <div className="text-center w-full space-y-1">
          <h3 className="text-indigo-50 font-medium truncate w-full group-hover:text-white transition-colors">
            {name}
          </h3>
          <p className="text-[10px] text-indigo-300/30 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Click to Launch
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
