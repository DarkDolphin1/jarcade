import React from "react";

interface GameCardProps {
  name: string;
  onClick: () => void;
  selected: boolean;
  icon?: string;
  emoji: string;
}

const GameCard: React.FC<GameCardProps> = ({ name, onClick, selected, icon, emoji }) => {
  return (
    <div
      onClick={onClick}
      className={`xmb-item ${selected ? "selected" : ""}`}
    >
      <div className="xmb-selection-bar" />
      <div className="xmb-item-icon">
        {icon ? (
          <img src={icon} alt={name} className="w-full h-full object-contain p-2 rounded-lg" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="xmb-item-info">
        <div className="xmb-item-name">{name}</div>
        <div className="xmb-item-sub">J2ME · Mobile Classic</div>
      </div>
    </div>
  );
};

export default GameCard;
