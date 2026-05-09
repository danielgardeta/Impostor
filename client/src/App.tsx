import React from 'react';
import { useGame } from './hooks/useGame';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { AccusationScreen } from './components/AccusationScreen';
import { RevealScreen } from './components/RevealScreen';

export default function App() {
  const game = useGame();

  switch (game.phase) {
    case 'playing':
      if (!game.gameState) return null;
      return (
        <GameScreen
          gameState={game.gameState}
          isLoading={game.isLoading}
          error={game.error}
          onSendQuestion={game.sendQuestion}
          onOpenAccusation={game.openAccusation}
          onClearError={game.clearError}
          onReturnToMenu={game.returnToMenu}
        />
      );

    case 'accusing':
      if (!game.gameState) return null;
      return (
        <AccusationScreen
          gameState={game.gameState}
          isLoading={game.isLoading}
          error={game.error}
          onAccuse={game.makeAccusation}
          onBack={game.backToPlaying}
          onClearError={game.clearError}
        />
      );

    case 'revealed':
      if (!game.gameState || !game.revealResult) return null;
      return (
        <RevealScreen
          gameState={game.gameState}
          revealResult={game.revealResult}
          onReturnToMenu={game.returnToMenu}
        />
      );

    default:
      return (
        <MainMenu
          onStartDaily={game.startDailyGame}
          onStartFree={game.startFreeGame}
          isLoading={game.isLoading}
          error={game.error}
          onClearError={game.clearError}
        />
      );
  }
}
