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

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number, delayMs: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`[aiService] attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// Case generation: 1 retry, short delay — must finish well under Vercel's 60s limit
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  _useCache: boolean = false
): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await withRetry(
    () =>
      getClient().models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: { maxOutputTokens: 4096 },
      }),
    2,
    1000
  );
  return stripThinking(response.text ?? '');
}

// Character responses: 3 retries, short delay — output is small so each attempt is fast
export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  const dialogue = conversationHistory
    .map(msg => (msg.role === 'user' ? `Detective: ${msg.content}` : `Tú: ${msg.content}`))
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n---\n\n${dialogue}\n\nTú:`;

  const response = await withRetry(
    () =>
      getClient().models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: { maxOutputTokens: 512 },
      }),
    3,
    1000
  );
  return stripThinking(response.text ?? '');
}
