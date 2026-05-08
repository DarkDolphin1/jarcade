import React from "react";
import { useTheme } from "../theme/ThemeContext";

interface GameCardProps {
  name: string;
  onClick: () => void;
  selected: boolean;
  icon?: string;
  emoji: string;
}

const GameCard: React.FC<GameCardProps> = ({ name, onClick, selected, icon, emoji }) => {
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
      </div>
      <div className="xmb-item-info">
        <div className="xmb-item-name" style={{ color: theme.colors.textPrimary }}>
          {name}
        </div>
        <div className="xmb-item-sub" style={{ color: theme.colors.textSecondary }}>
          J2ME · Mobile Classic
        </div>
      </div>
    </div>
  );
};

export default GameCard;
