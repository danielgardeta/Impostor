import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateResponses } from '../server/src/services/characterService';
import { Case, Message } from '../server/src/types/game';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.post('*', async (req, res) => {
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error processing question:', error);
    return res.status(500).json({ error: msg });
  }
});

export default app;
