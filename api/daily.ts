import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';
import { generateCase } from '../server/src/services/caseGenerator';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('*', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `daily_case_${today}`;

    try {
      const redis = Redis.fromEnv();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const dailyCase = await generateCase('detective', 'oficina', 'daily', today);

      const response = {
        caseId: dailyCase.id,
        title: dailyCase.title,
        description: dailyCase.description,
        characters: dailyCase.characters,
        scenario: dailyCase.scenario,
        difficulty: dailyCase.difficulty,
        lieRoadmap: dailyCase.lieRoadmap,
      };

      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);

      await redis.set(cacheKey, response, { ex: ttl });

      return res.json(response);
    } catch (redisError) {
      console.warn('Redis unavailable, generating fresh case:', redisError);

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
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: msg });
  }
});

export default app;
