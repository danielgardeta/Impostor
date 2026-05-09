export type Difficulty = 'bisoño' | 'detective' | 'inquisidor' | 'maestro';
export type Scenario = 'oficina' | 'restaurante' | 'escuela' | 'viaje' | 'hospital' | 'fiesta';
export type GameMode = 'daily' | 'free';
export type GamePhase = 'menu' | 'playing' | 'accusing' | 'revealed';

export interface Character {
  id: string;
  name: string;
  age: number;
  role: string;
  personality: string;
  avatar: string;
  gender: 'masculino' | 'femenino';
  isMole?: boolean;
  personalSecret?: string;
}

export interface LieRoadmap {
  truth: string;
  moleId: string;
  hiddenFact: string;
  falseNarrative: string;
  allowedImprovise: string[];
  mustNotReveal: string[];
  breakingPoint: string;
  deflectionTargetId: string;
  innocentTheories: Record<string, string>;
}

export interface Message {
  id: string;
  type: 'question' | 'answer' | 'system';
  characterId?: string;
  content: string;
  cost?: number;
  timestamp: number;
}

export interface GameState {
  caseId: string;
  mode: GameMode;
  difficulty: Difficulty;
  scenario: Scenario;
  title: string;
  description: string;
  characters: Character[];
  lieRoadmap: LieRoadmap;
  budget: number;
  messages: Message[];
  phase: GamePhase;
  accusedId?: string;
  score?: number;
  questionsUsed: number;
}

export interface RevealResult {
  correct: boolean;
  moleId: string;
  score: number;
  lieRoadmap: LieRoadmap;
  revelationNarrative: string;
}
