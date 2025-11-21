export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  GENERATING = 'GENERATING'
}

export interface ThemeColors {
  background: string;
  ground: string;
  player: string;
  obstacle: string;
  fog: string;
  sun: string;
}

export interface LevelTheme {
  name: string;
  description: string;
  colors: ThemeColors;
  shapeType: 'box' | 'sphere' | 'cylinder' | 'dodecahedron';
  fogDensity: number;
  lightingIntensity: number;
  speedModifier: number;
}

export const DEFAULT_THEME: LevelTheme = {
  name: "Neon Default",
  description: "A classic retro-wave aesthetic.",
  colors: {
    background: "#101010",
    ground: "#1a1a1a",
    player: "#00ffff",
    obstacle: "#ff0055",
    fog: "#101010",
    sun: "#ff00ff"
  },
  shapeType: 'box',
  fogDensity: 0.05,
  lightingIntensity: 1.5,
  speedModifier: 1.0
};

export interface ScoreState {
  current: number;
  high: number;
}