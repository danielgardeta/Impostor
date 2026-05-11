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
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

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

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  _useCache: boolean = false
): Promise<string> {
  // Gemma 4 does not support systemInstruction — embed it in the user prompt.
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: { maxOutputTokens: 4096 },
    })
  );
  return stripThinking(response.text ?? '');
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  // Gemma 4 does not support multi-turn — flatten history into a single prompt.
  const dialogue = conversationHistory
    .map(msg => (msg.role === 'user' ? `Detective: ${msg.content}` : `Tú: ${msg.content}`))
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n---\n\n${dialogue}\n\nTú:`;

  const response = await withRetry(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      config: { maxOutputTokens: 512 },
    })
  );
  return stripThinking(response.text ?? '');
}
