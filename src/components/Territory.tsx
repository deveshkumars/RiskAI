import type { TerritoryDefinition, TerritoryState, Player } from '../engine/types';

interface TerritoryProps {
  definition: TerritoryDefinition;
  state: TerritoryState;
  player: Player;
  continentColor: string;
  isSelected: boolean;
  isHighlighted: boolean;
  isValidTarget: boolean;
  onClick: (id: string) => void;
}

export function Territory({
  definition,
  state,
  player,
  continentColor,
  isSelected,
  isHighlighted,
  isValidTarget,
  onClick,
}: TerritoryProps) {
  let strokeColor = '#1a1a2e';
  let strokeWidth = 1;
  let fillOpacity = 0.85;

  if (isSelected) {
    strokeColor = '#fff';
    strokeWidth = 2.5;
    fillOpacity = 1;
  } else if (isValidTarget) {
    strokeColor = '#ffd700';
    strokeWidth = 2;
    fillOpacity = 0.95;
  } else if (isHighlighted) {
    strokeColor = 'rgba(255,255,255,0.6)';
    strokeWidth = 1.5;
  }

  // Blend player color with continent color for a classic Risk look
  return (
    <g
      onClick={() => onClick(definition.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Territory shape - continent tint background */}
      <path
        d={definition.svgPath}
        fill={continentColor}
        fillOpacity={0.35}
        stroke="none"
      />
      {/* Territory shape - player color overlay */}
      <path
        d={definition.svgPath}
        fill={player.color}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Territory name */}
      <text
        x={definition.labelPosition.x}
        y={definition.labelPosition.y - 13}
        textAnchor="middle"
        fontSize={8}
        fontWeight="600"
        fill="#fff"
        stroke="#000"
        strokeWidth={0.3}
        style={{ pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        {definition.name}
      </text>
      {/* Army count circle */}
      <circle
        cx={definition.labelPosition.x}
        cy={definition.labelPosition.y + 2}
        r={10}
        fill="#fff"
        stroke={player.color}
        strokeWidth={1.5}
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={definition.labelPosition.x}
        y={definition.labelPosition.y + 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight="bold"
        fill="#222"
        style={{ pointerEvents: 'none' }}
      >
        {state.armies}
      </text>
      <title>{`${definition.name} - ${player.name} (${state.armies} armies)`}</title>
    </g>
  );
}
