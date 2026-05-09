import React from "react";
import { useTheme } from "../theme/ThemeContext";
import { Star } from "lucide-react";

interface GameCardProps {
  name: string;
  onClick: () => void;
  selected: boolean;
  icon?: string;
  emoji: string;
  favorite: boolean;
  playtime: number;
  isRunning?: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const GameCard: React.FC<GameCardProps> = ({ 
  name, 
  onClick, 
  selected, 
  icon, 
  favorite, 
  playtime, 
  isRunning,
  onToggleFavorite 
}) => {
  const { theme } = useTheme();
  const Icon = theme.icons.game;

  return (
    <div
      onClick={onClick}
      className={`xmb-item ${selected ? "selected" : ""} ${selected ? "" : theme.animations.cardHover}`}
      style={{
        color: theme.colors.textPrimary,
      }}
    >
      <div 
        className="xmb-selection-bar"
        style={{
          background: theme.colors.selectionBar,
          display: selected ? 'block' : 'none'
        }}
      />
      
      <div 
        className="xmb-item-icon"
        style={{
          backgroundColor: theme.styles.useGlassmorphism ? undefined : theme.colors.cardBg,
          borderColor: theme.colors.cardBorder,
        }}
      >
        {icon ? (
          <img src={icon} alt={name} className="w-full h-full object-contain p-2 rounded-lg" />
        ) : (
          <Icon size={28} strokeWidth={1.5} color="white" />
        )}

        {/* Status Indicators Overlay */}
        <div className="absolute top-[-6px] right-[-6px] flex gap-1">
          {isRunning && (
             <div className="bg-green-500 rounded-full p-1 shadow-lg border border-green-400 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
             </div>
          )}
          {favorite && (
            <div className="bg-yellow-500 rounded-full p-1 shadow-lg border border-yellow-400">
              <Star size={10} fill="white" color="white" />
            </div>
          )}
        </div>
      </div>

      <div className="xmb-item-info">
        <div className="flex items-center gap-2">
          <div className="xmb-item-name" style={{ color: theme.colors.textPrimary }}>
            {name.replace(/\.jar$/i, "")}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className={`transition-opacity duration-300 ${selected ? 'opacity-100' : 'opacity-0'}`}
          >
            <Star 
              size={14} 
              fill={favorite ? "#eab308" : "none"} 
              color={favorite ? "#eab308" : theme.colors.textSecondary} 
              strokeWidth={1.5}
            />
          </button>
        </div>
        <div className="xmb-item-sub" style={{ color: isRunning ? "#4ade80" : theme.colors.textSecondary }}>
          {isRunning ? "Running" : playtime > 0 ? `${Math.floor(playtime / 60)}m played` : "Never played"}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
