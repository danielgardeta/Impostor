import { Difficulty, Scenario, GameMode, LieRoadmap, Character, RevealResult, Message } from '../types/game';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface GenerateCaseResponse {
  caseId: string;
  title: string;
  description: string;
  characters: Character[];
  scenario: Scenario;
  difficulty: Difficulty;
  lieRoadmap: LieRoadmap;
}

export interface CaseData {
  id: string;
  scenario: Scenario;
  difficulty: Difficulty;
  title: string;
  description: string;
  characters: Character[];
  lieRoadmap: LieRoadmap;
}

export interface AskResponse {
  responses: Array<{ characterId: string; content: string }>;
  cost: number;
}

export async function generateCase(
  difficulty: Difficulty,
  scenario: Scenario,
  mode: GameMode,
  date?: string
): Promise<GenerateCaseResponse> {
  const response = await fetch(`${API_BASE}/generate-case`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, scenario, mode, date }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getDailyCase(): Promise<GenerateCaseResponse> {
  const response = await fetch(`${API_BASE}/daily`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function askQuestion(
  caseData: CaseData,
  messages: Message[],
  question: string,
  targetIds: string[] | 'all'
): Promise<AskResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData, messages, question, targetIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function accuseCharacter(
  caseData: CaseData,
  accusedId: string,
  questionsUsed: number,
  budgetRemaining: number
): Promise<RevealResult> {
  const response = await fetch(`${API_BASE}/accuse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData, accusedId, questionsUsed, budgetRemaining }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
