import { Router, Request, Response } from 'express';
import { CaseGenerateRequest, Difficulty, Case, Message } from '../types/game';
import { generateCase } from '../services/caseGenerator';
import { generateResponses, generateRevelationNarrative } from '../services/characterService';

const router = Router();

function calculateScore(questionsUsed: number, difficulty: Difficulty, correct: boolean): number {
  const baseScore = 100;
  const questionPenalty = questionsUsed * 5;
  const difficultyBonus: Record<Difficulty, number> = {
    bisoño: 0,
    detective: 20,
    inquisidor: 40,
    maestro: 60,
  };
  const rawScore = Math.max(0, baseScore - questionPenalty);
  return rawScore + (correct ? difficultyBonus[difficulty] : 0);
}

router.get('/daily', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyCase = await generateCase('detective', 'oficina', 'daily', today);
    return res.json({
      caseId: dailyCase.id,
      title: dailyCase.title,
      description: dailyCase.description,
      characters: dailyCase.characters,
      scenario: dailyCase.scenario,
      difficulty: dailyCase.difficulty,
      lieRoadmap: dailyCase.lieRoadmap,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: msg });
  }
});

router.post('/generate-case', async (req: Request, res: Response) => {
  try {
    const { difficulty, scenario, mode, date }: CaseGenerateRequest = req.body;

    if (!difficulty || !scenario || !mode) {
      return res.status(400).json({ error: 'Missing required fields: difficulty, scenario, mode' });
    }

    const generatedCase = await generateCase(difficulty, scenario, mode, date);

    return res.json({
      caseId: generatedCase.id,
      title: generatedCase.title,
      description: generatedCase.description,
      characters: generatedCase.characters,
      scenario: generatedCase.scenario,
      difficulty: generatedCase.difficulty,
      lieRoadmap: generatedCase.lieRoadmap,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: msg });
  }
});

router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { caseData, messages, question, targetIds }: {
      caseData: Case;
      messages: Message[];
      question: string;
      targetIds: string[] | 'all';
    } = req.body;

    if (!caseData || !question || !targetIds) {
      return res.status(400).json({ error: 'Missing required fields: caseData, question, targetIds' });
    }

    let cost: number;
    if (targetIds === 'all') {
      cost = 3;
    } else if (Array.isArray(targetIds) && targetIds.length === 2) {
      cost = 2;
    } else {
      cost = 1;
    }

    const responses = await generateResponses(caseData, messages || [], question, targetIds);

    return res.json({ responses, cost });
  } catch (error) {
    console.error('Error processing question:', error);
    return res.status(500).json({ error: 'Error generando respuesta. Inténtalo de nuevo.' });
  }
});

router.post('/accuse', async (req: Request, res: Response) => {
  try {
    const { caseData, accusedId, questionsUsed }: {
      caseData: Case;
      accusedId: string;
      questionsUsed: number;
    } = req.body;

    if (!caseData || !accusedId) {
      return res.status(400).json({ error: 'Missing required fields: caseData, accusedId' });
    }

    const { lieRoadmap, difficulty } = caseData;
    const correct = accusedId === lieRoadmap.moleId;
    const score = calculateScore(questionsUsed, difficulty, correct);
    const revelationNarrative = generateRevelationNarrative(caseData);

    return res.json({
      correct,
      moleId: lieRoadmap.moleId,
      score,
      lieRoadmap,
      revelationNarrative,
    });
  } catch (error) {
    console.error('Error processing accusation:', error);
    return res.status(500).json({ error: 'Error procesando la acusación. Inténtalo de nuevo.' });
  }
});

export default router;
