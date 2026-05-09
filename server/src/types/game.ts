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

export interface Case {
  id: string;
  date?: string;
  scenario: Scenario;
  difficulty: Difficulty;
  title: string;
  description: string;
  characters: Character[];
  lieRoadmap: LieRoadmap;
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
  budget: number;
  messages: Message[];
  phase: GamePhase;
  accusedId?: string;
  score?: number;
  questionsUsed: number;
}

export interface CaseGenerateRequest {
  difficulty: Difficulty;
  scenario: Scenario;
  mode: GameMode;
  date?: string;
}

export interface AskRequest {
  caseId: string;
  question: string;
  targetIds: string[] | 'all';
}

export interface AccuseRequest {
  caseId: string;
  accusedId: string;
  questionsUsed: number;
  budgetRemaining: number;
}

export interface CharacterResponse {
  characterId: string;
  content: string;
}

export interface CachedCase {
  case: Case;
  messages: Message[];
}
