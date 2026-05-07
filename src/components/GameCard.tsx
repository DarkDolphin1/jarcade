import React from "react";

interface GameCardProps {
  name: String;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ name, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
      <div className="relative p-6 bg-indigo-900/20 backdrop-blur-md border border-white/10 rounded-xl flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-3xl">🎮</span>
        </div>
        <h3 className="text-white font-medium text-center truncate w-full">
          {name}
        </h3>
      </div>
    </div>
  );
};

export default GameCard;
