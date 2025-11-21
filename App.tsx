import React, { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { GameState, LevelTheme, DEFAULT_THEME } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [theme, setTheme] = useState<LevelTheme>(DEFAULT_THEME);

  // Persist high score
  useEffect(() => {
    const saved = localStorage.getItem('neonflow_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neonflow_highscore', score.toString());
    }
  }, [score, highScore]);

  const handleCrash = () => {
    setGameState(GameState.GAME_OVER);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* 3D Background / Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameScene 
          gameState={gameState} 
          setGameState={setGameState}
          theme={theme}
          onScoreUpdate={setScore}
          onCrash={handleCrash}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
            <UI 
                gameState={gameState} 
                setGameState={setGameState}
                score={score}
                highScore={highScore}
                theme={theme}
                setTheme={setTheme}
            />
        </div>
      </div>
    </div>
  );
}

export default App;