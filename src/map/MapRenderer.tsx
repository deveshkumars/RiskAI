import type { TerritoryState, Player, MapData } from '../engine/types';
import { Territory } from '../components/Territory';

interface MapRendererProps {
  mapData: MapData;
  territories: Record<string, TerritoryState>;
  players: Player[];
  selectedTerritory: string | null;
  highlightedTerritories: string[];
  validTargets: string[];
  onTerritoryClick: (id: string) => void;
}


export function MapRenderer({
  mapData,
  territories,
  players,
  selectedTerritory,
  highlightedTerritories,
  validTargets,
  onTerritoryClick,
}: MapRendererProps) {
  const getContinentColor = (territoryId: string) => {
    const tDef = mapData.territories.find((t) => t.id === territoryId);
    if (!tDef) return '#444';
    const continent = mapData.continents.find((c) => c.id === tDef.continentId);
    return continent?.color ?? '#444';
  };

  return (
    <svg
      viewBox="0 0 1024 792"
      style={{
        width: '100%',
        height: 'auto',
        borderRadius: 8,
        border: '2px solid #2a2a3e',
      }}
    >
      <defs>
        {/* Ocean gradient */}
        <radialGradient id="ocean" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0d1b2a" />
        </radialGradient>
      </defs>

      {/* Ocean background */}
      <rect width="1024" height="792" fill="url(#ocean)" />

      {/* Grid lines for classic map feel */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line
          key={`vg${i}`}
          x1={i * 128}
          y1={0}
          x2={i * 128}
          y2={792}
          stroke="#1a2a40"
          strokeWidth={0.5}
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={`hg${i}`}
          x1={0}
          y1={i * 132}
          x2={1024}
          y2={i * 132}
          stroke="#1a2a40"
          strokeWidth={0.5}
        />
      ))}

      {/* Adjacency lines (drawn under territories) */}
      {mapData.territories.map((tDef) =>
        tDef.adjacentTo
          .filter((adjId) => adjId > tDef.id)
          .map((adjId) => {
            const adj = mapData.territories.find((t) => t.id === adjId);
            if (!adj) return null;
            // Skip cross-map connections (drawn separately)
            const dx = Math.abs(tDef.labelPosition.x - adj.labelPosition.x);
            if (dx > 500) return null;
            return (
              <line
                key={`${tDef.id}-${adjId}`}
                x1={tDef.labelPosition.x}
                y1={tDef.labelPosition.y}
                x2={adj.labelPosition.x}
                y2={adj.labelPosition.y}
                stroke="#3a5070"
                strokeWidth={0.8}
                strokeDasharray="3,3"
                opacity={0.4}
              />
            );
          })
      )}

      {/* Cross-map connection labels */}
      <text x={512} y={14} textAnchor="middle" fontSize={9} fill="#5a7a9a" fontStyle="italic">
        Alaska ↔ Kamchatka
      </text>
      <line x1={68} y1={100} x2={20} y2={20} stroke="#5a7a9a" strokeWidth={0.8} strokeDasharray="4,2" opacity={0.5} />
      <line x1={933} y1={120} x2={1000} y2={20} stroke="#5a7a9a" strokeWidth={0.8} strokeDasharray="4,2" opacity={0.5} />

      {/* Continent labels */}
      {mapData.continents.map((continent) => {
        const tDefs = mapData.territories.filter(
          (t) => t.continentId === continent.id
        );
        const cx = tDefs.reduce((s, t) => s + t.labelPosition.x, 0) / tDefs.length;
        const cy = Math.min(...tDefs.map((t) => t.labelPosition.y)) - 22;

        return (
          <text
            key={continent.id}
            x={cx}
            y={cy}
            textAnchor="middle"
            fontSize={11}
            fill={continent.color}
            opacity={0.7}
            fontWeight="bold"
            style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
          >
            {continent.name} (+{continent.bonus})
          </text>
        );
      })}

      {/* Territories */}
      {mapData.territories.map((tDef) => {
        const tState = territories[tDef.id];
        if (!tState) return null;
        return (
          <Territory
            key={tDef.id}
            definition={tDef}
            state={tState}
            player={players[tState.owner]}
            continentColor={getContinentColor(tDef.id)}
            isSelected={selectedTerritory === tDef.id}
            isHighlighted={highlightedTerritories.includes(tDef.id)}
            isValidTarget={validTargets.includes(tDef.id)}
            onClick={onTerritoryClick}
          />
        );
      })}
    </svg>
  );
}
