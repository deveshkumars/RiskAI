import type { GameState, MapData } from '../engine/types';
import { MapRenderer } from '../map/MapRenderer';

interface GameBoardProps {
  state: GameState;
  mapData: MapData;
  selectedTerritory: string | null;
  highlightedTerritories: string[];
  validTargets: string[];
  onTerritoryClick: (id: string) => void;
}

export function GameBoard({
  state,
  mapData,
  selectedTerritory,
  highlightedTerritories,
  validTargets,
  onTerritoryClick,
}: GameBoardProps) {
  return (
    <div className="game-board">
      <MapRenderer
        mapData={mapData}
        territories={state.territories}
        players={state.players}
        selectedTerritory={selectedTerritory}
        highlightedTerritories={highlightedTerritories}
        validTargets={validTargets}
        onTerritoryClick={onTerritoryClick}
      />
    </div>
  );
}
