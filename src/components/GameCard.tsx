import React from "react";
import { useTheme } from "../theme/ThemeContext";
import { Gamepad2, Star } from "lucide-react";

interface GameCardProps {
  name: string;
  onClick: () => void;
  selected: boolean;
  icon?: string;
  emoji: string;
  favorite: boolean;
  playtime: number;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const GameCard: React.FC<GameCardProps> = ({ 
  name, 
  onClick, 
  selected, 
  icon, 
  emoji, 
  favorite, 
  playtime, 
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

        {/* Favorite Indicator */}
        {favorite && (
          <div className="absolute top-[-4px] right-[-4px] bg-yellow-500 rounded-full p-1 shadow-lg border border-yellow-400">
            <Star size={10} fill="white" color="white" />
          </div>
        )}
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
        <div className="xmb-item-sub" style={{ color: theme.colors.textSecondary }}>
          {playtime > 0 ? `${Math.floor(playtime / 60)}m played` : "Never played"}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
