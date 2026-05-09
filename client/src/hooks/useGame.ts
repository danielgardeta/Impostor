import { useState, useCallback, useEffect } from 'react';
import { GameState, GamePhase, Difficulty, Scenario, GameMode, Message, RevealResult } from '../types/game';
import { generateCase, getDailyCase, askQuestion, accuseCharacter, CaseData } from '../services/api';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const INITIAL_BUDGET = 12;
const STORAGE_KEY = 'mole_daily_state';

interface UseGameReturn {
  gameState: GameState | null;
  phase: GamePhase;
  isLoading: boolean;
  error: string | null;
  revealResult: RevealResult | null;
  startDailyGame: () => Promise<void>;
  startFreeGame: (difficulty: Difficulty, scenario: Scenario) => Promise<void>;
  sendQuestion: (question: string, targetIds: string[] | 'all') => Promise<void>;
  openAccusation: () => void;
  backToPlaying: () => void;
  makeAccusation: (accusedId: string) => Promise<void>;
  returnToMenu: () => void;
  clearError: () => void;
}

function buildCaseData(gameState: GameState): CaseData {
  return {
    id: gameState.caseId,
    scenario: gameState.scenario,
    difficulty: gameState.difficulty,
    title: gameState.title,
    description: gameState.description,
    characters: gameState.characters,
    lieRoadmap: gameState.lieRoadmap,
  };
}

export function useGame(): UseGameReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealResult, setRevealResult] = useState<RevealResult | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.date === today && parsed.gameState && parsed.gameState.lieRoadmap) {
          setGameState(parsed.gameState);
          setPhase(parsed.phase || 'playing');
          if (parsed.revealResult) {
            setRevealResult(parsed.revealResult);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persistDailyState = useCallback(
    (state: GameState, currentPhase: GamePhase, result?: RevealResult) => {
      if (state.mode === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            date: today,
            gameState: state,
            phase: currentPhase,
            revealResult: result || null,
          })
        );
      }
    },
    []
  );

  const startDailyGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const caseData = await getDailyCase();

      const newState: GameState = {
        caseId: caseData.caseId,
        mode: 'daily',
        difficulty: caseData.difficulty,
        scenario: caseData.scenario,
        title: caseData.title,
        description: caseData.description,
        characters: caseData.characters,
        lieRoadmap: caseData.lieRoadmap,
        budget: INITIAL_BUDGET,
        messages: [],
        phase: 'playing',
        questionsUsed: 0,
      };

      setGameState(newState);
      setPhase('playing');
      setRevealResult(null);
      persistDailyState(newState, 'playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error iniciando el juego diario');
    } finally {
      setIsLoading(false);
    }
  }, [persistDailyState]);

  const startFreeGame = useCallback(async (difficulty: Difficulty, scenario: Scenario) => {
    setIsLoading(true);
    setError(null);
    try {
      const caseData = await generateCase(difficulty, scenario, 'free');

      const newState: GameState = {
        caseId: caseData.caseId,
        mode: 'free',
        difficulty,
        scenario,
        title: caseData.title,
        description: caseData.description,
        characters: caseData.characters,
        lieRoadmap: caseData.lieRoadmap,
        budget: INITIAL_BUDGET,
        messages: [],
        phase: 'playing',
        questionsUsed: 0,
      };

      setGameState(newState);
      setPhase('playing');
      setRevealResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando el caso');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendQuestion = useCallback(
    async (question: string, targetIds: string[] | 'all') => {
      if (!gameState || isLoading) return;

      const cost = targetIds === 'all' ? 3 : Array.isArray(targetIds) && targetIds.length === 2 ? 2 : 1;

      if (gameState.budget < cost) {
        setError(`No tienes suficientes preguntas. Necesitas ${cost}, te quedan ${gameState.budget}.`);
        return;
      }

      setIsLoading(true);
      setError(null);

      const questionMsg: Message = {
        id: generateId(),
        type: 'question',
        content: question,
        cost,
        timestamp: Date.now(),
      };

      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, questionMsg] };
      });

      try {
        const caseData = buildCaseData(gameState);
        const relevantMessages = gameState.messages.filter(m => m.type !== 'system');
        const result = await askQuestion(caseData, relevantMessages, question, targetIds);

        const answerMessages: Message[] = result.responses.map(r => ({
          id: generateId(),
          type: 'answer' as const,
          characterId: r.characterId,
          content: r.content,
          timestamp: Date.now(),
        }));

        const systemMsg: Message = {
          id: generateId(),
          type: 'system',
          content: `${cost} pregunta${cost > 1 ? 's' : ''} utilizada${cost > 1 ? 's' : ''}`,
          timestamp: Date.now(),
        };

        setGameState(prev => {
          if (!prev) return prev;
          const newState = {
            ...prev,
            messages: [...prev.messages, ...answerMessages, systemMsg],
            budget: prev.budget - cost,
            questionsUsed: prev.questionsUsed + cost,
          };
          if (newState.mode === 'daily') {
            persistDailyState(newState, 'playing');
          }
          return newState;
        });
      } catch (err) {
        setGameState(prev => {
          if (!prev) return prev;
          return { ...prev, messages: prev.messages.filter(m => m.id !== questionMsg.id) };
        });
        setError(err instanceof Error ? err.message : 'Error generando respuesta, intenta de nuevo');
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, isLoading, persistDailyState]
  );

  const openAccusation = useCallback(() => {
    if (!gameState) return;
    setPhase('accusing');
    setGameState(prev => {
      if (!prev) return prev;
      const newState = { ...prev, phase: 'accusing' as GamePhase };
      if (newState.mode === 'daily') {
        persistDailyState(newState, 'accusing');
      }
      return newState;
    });
  }, [gameState, persistDailyState]);

  const makeAccusation = useCallback(
    async (accusedId: string) => {
      if (!gameState || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const caseData = buildCaseData(gameState);
        const result = await accuseCharacter(
          caseData,
          accusedId,
          gameState.questionsUsed,
          gameState.budget
        );

        setRevealResult(result);
        setPhase('revealed');
        setGameState(prev => {
          if (!prev) return prev;
          const newState = {
            ...prev,
            phase: 'revealed' as GamePhase,
            accusedId,
            score: result.score,
          };
          if (newState.mode === 'daily') {
            persistDailyState(newState, 'revealed', result);
          }
          return newState;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error procesando la acusación');
        setPhase('accusing');
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, isLoading, persistDailyState]
  );

  const backToPlaying = useCallback(() => {
    setPhase('playing');
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, phase: 'playing' as GamePhase };
    });
    setError(null);
  }, []);

  const returnToMenu = useCallback(() => {
    setPhase('menu');
    setGameState(null);
    setRevealResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    gameState,
    phase,
    isLoading,
    error,
    revealResult,
    startDailyGame,
    startFreeGame,
    sendQuestion,
    openAccusation,
    backToPlaying,
    makeAccusation,
    returnToMenu,
    clearError,
  };
}
