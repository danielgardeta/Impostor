import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MODEL = 'gemma-4-31b-it';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError;
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  _useCache: boolean = false
): Promise<string> {
  // Gemma 4 does not support systemInstruction — embed it in the user prompt instead.
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        maxOutputTokens: 4096,
      },
    })
  );
  return response.text ?? '';
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  // Gemma 4 31B does not support multi-turn conversations via the Gemini API.
  // Flatten history into a single prompt so the model gets full context in one turn.
  const dialogue = conversationHistory
    .map(msg => (msg.role === 'user' ? `Detective: ${msg.content}` : `Tú: ${msg.content}`))
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n---\n\n${dialogue}\n\nTú:`;

  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: {
        maxOutputTokens: 1024,
      },
    })
  );

  return response.text ?? '';
}
