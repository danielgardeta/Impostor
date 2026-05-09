import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateCase } from '../server/src/services/caseGenerator';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.post('*', async (req, res) => {
  try {
    const { difficulty, scenario, mode, date } = req.body;

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

export default app;
