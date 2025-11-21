import React, { useState, useEffect } from 'react';
import { GameState, LevelTheme, DEFAULT_THEME } from '../types';
import { generateLevelTheme } from '../services/geminiService';
import { Sparkles, Play, RotateCcw, Palette, AlertCircle } from 'lucide-react';

interface UIProps {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  score: number;
  highScore: number;
  theme: LevelTheme;
  setTheme: (t: LevelTheme) => void;
}

export const UI: React.FC<UIProps> = ({ gameState, setGameState, score, highScore, theme, setTheme }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const newTheme = await generateLevelTheme(prompt);
      setTheme(newTheme);
    } catch (e) {
      setError("Failed to generate theme. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStart = () => {
    setGameState(GameState.PLAYING);
  };

  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white text-3xl font-bold font-[Space Grotesk]" style={{ textShadow: `0 0 20px ${theme.colors.player}` }}>
              {score}
            </h2>
            <p className="text-white/60 text-sm">DISTANCE</p>
          </div>
          <div className="text-right">
             <p className="text-white/80 text-xs tracking-widest uppercase">{theme.name}</p>
          </div>
        </div>
        <div className="text-center">
           <p className="text-white/30 text-sm">← SWIPE / A / LEFT | RIGHT / D / SWIPE →</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
      <div className="max-w-md w-full p-8 bg-neutral-900/90 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center z-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-[Space Grotesk] mb-2">
            NEON FLOW
          </h1>
          <p className="text-neutral-400 text-sm">
            AI-Generated Infinite Runner
          </p>
        </div>

        {gameState === GameState.GAME_OVER && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-center">
                <h3 className="text-red-400 font-bold text-xl mb-1">CRASHED!</h3>
                <p className="text-white">Score: {score}</p>
                <p className="text-neutral-400 text-xs uppercase tracking-wide mt-2">High Score: {highScore}</p>
            </div>
        )}

        <div className="flex flex-col gap-4 z-10">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Dream Your World
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Cyberpunk rain', 'Candyland', 'Mars Outpost'"
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 border border-neutral-700 text-white p-3 rounded-lg transition-all flex items-center justify-center"
              >
                {isGenerating ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <Palette className="w-5 h-5" />
                )}
              </button>
            </div>
             <div className="flex justify-between items-center text-[10px] text-neutral-500 px-1">
                <span>Current: <span style={{ color: theme.colors.player }}>{theme.name}</span></span>
             </div>
          </div>

          <div className="h-px bg-neutral-800 w-full my-2"></div>

          <button
            onClick={handleStart}
            className="group relative w-full bg-white text-black font-bold text-lg py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity rounded-lg"></span>
            {gameState === GameState.GAME_OVER ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {gameState === GameState.GAME_OVER ? "RESTART RUN" : "START RUN"}
          </button>
        </div>
        
        {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-950/30 p-2 rounded">
                <AlertCircle className="w-3 h-3" />
                {error}
            </div>
        )}

        <div className="text-center text-neutral-600 text-[10px] mt-2">
            Use WASD or Arrow Keys to dodge.
        </div>
      </div>
    </div>
  );
};