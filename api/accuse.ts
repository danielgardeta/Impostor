import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRevelationNarrative } from '../server/src/services/characterService';
import { Case, Difficulty } from '../server/src/types/game';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

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

app.post('*', async (req, res) => {
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error processing accusation:', error);
    return res.status(500).json({ error: msg });
  }
});

export default app;
