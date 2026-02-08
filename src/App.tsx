import { useState, useCallback, useMemo } from 'react';
import type { Player, GameAction } from './engine/types';
import { MAP_DATA } from './map/mapData';
import { useGameState } from './hooks/useGameState';
import { useGameLoop } from './hooks/useGameLoop';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard } from './components/GameBoard';
import { TurnIndicator } from './components/TurnIndicator';
import { PlayerPanel } from './components/PlayerPanel';
import { ActionPanel } from './components/ActionPanel';
import { GameLog } from './components/GameLog';
import { GameOverScreen } from './components/GameOverScreen';
import './App.css';

function GameView({ players }: { players: Player[] }) {
  const {
    state,
    dispatch,
    validActions,
    serializedState,
    getAgent,
    reset,
  } = useGameState(players, MAP_DATA);

  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer.type === 'human';

  // Drive AI turns
  useGameLoop(state, getAgent, dispatch, serializedState, validActions);

  // Compute valid targets for the selected territory
  const validTargets = useMemo(() => {
    if (!selectedTerritory || !isHumanTurn) return [];
    if (state.phase === 'attack') {
      return validActions
        .filter((a) => a.type === 'attack' && a.from === selectedTerritory)
        .map((a) => (a as { to: string }).to);
    }
    if (state.phase === 'fortify') {
      return validActions
        .filter((a) => a.type === 'fortify' && a.from === selectedTerritory)
        .map((a) => (a as { to: string }).to);
    }
    return [];
  }, [selectedTerritory, validActions, isHumanTurn, state.phase]);

  // Highlighted territories: ones the current player owns (for selection)
  const highlightedTerritories = useMemo(() => {
    if (!isHumanTurn) return [];
    return Object.entries(state.territories)
      .filter(([, t]) => t.owner === state.currentPlayerIndex)
      .map(([id]) => id);
  }, [state.territories, state.currentPlayerIndex, isHumanTurn]);

  const handleTerritoryClick = useCallback(
    (id: string) => {
      if (!isHumanTurn) return;

      const territory = state.territories[id];
      if (!territory) return;

      if (state.phase === 'reinforce') {
        if (territory.owner === state.currentPlayerIndex) {
          setSelectedTerritory(id);
        }
      } else if (state.phase === 'attack') {
        if (territory.owner === state.currentPlayerIndex) {
          setSelectedTerritory(id);
        } else if (selectedTerritory) {
          const attackAction = validActions.find(
            (a) =>
              a.type === 'attack' &&
              a.from === selectedTerritory &&
              a.to === id
          );
          if (attackAction) {
            dispatch(attackAction);
          }
        }
      } else if (state.phase === 'fortify') {
        if (territory.owner === state.currentPlayerIndex) {
          const fortifyAction = validActions.find(
            (a) =>
              a.type === 'fortify' &&
              a.from === selectedTerritory &&
              a.to === id
          );
          if (fortifyAction) {
            dispatch(fortifyAction);
            setSelectedTerritory(null);
          } else {
            setSelectedTerritory(id);
          }
        }
      }
    },
    [
      isHumanTurn,
      state.phase,
      state.territories,
      state.currentPlayerIndex,
      selectedTerritory,
      validActions,
      dispatch,
    ]
  );

  const handleAction = useCallback(
    (action: GameAction) => {
      dispatch(action);
      if (action.type === 'skip_phase' || action.type === 'fortify') {
        setSelectedTerritory(null);
      }
    },
    [dispatch]
  );

  return (
    <div className="game-container">
      <div className="game-header">
        <TurnIndicator
          player={currentPlayer}
          phase={state.phase}
          turnNumber={state.turnNumber}
          reinforcementsRemaining={state.reinforcementsRemaining}
        />
      </div>

      <div className="game-main">
        <div className="game-left">
          <GameBoard
            state={state}
            mapData={MAP_DATA}
            selectedTerritory={selectedTerritory}
            highlightedTerritories={highlightedTerritories}
            validTargets={validTargets}
            onTerritoryClick={handleTerritoryClick}
          />
          <ActionPanel
            state={state}
            mapData={MAP_DATA}
            validActions={validActions}
            selectedTerritory={selectedTerritory}
            onAction={handleAction}
            isHumanTurn={isHumanTurn}
          />
        </div>

        <div className="game-right">
          <PlayerPanel
            players={state.players}
            territories={state.territories}
            continents={MAP_DATA.continents}
            currentPlayerIndex={state.currentPlayerIndex}
          />
          <GameLog logs={state.gameLog} players={state.players} />
        </div>
      </div>

      {state.gameOver && state.winner !== null && (
        <GameOverScreen
          winner={state.players[state.winner]}
          onNewGame={() => reset(players)}
        />
      )}
    </div>
  );
}

function App() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleStartGame = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setGameKey((k) => k + 1);
  }, []);

  if (!players) {
    return <SetupScreen onStartGame={handleStartGame} />;
  }

  return <GameView key={gameKey} players={players} />;
}

export default App;
