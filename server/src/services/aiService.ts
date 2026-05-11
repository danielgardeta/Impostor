import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

let groqClient: Groq | null = null;
let googleClient: GoogleGenAI | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment variables');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getGoogleClient(): GoogleGenAI {
  if (!googleClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');
    googleClient = new GoogleGenAI({ apiKey });
  }
  return googleClient;
}

const MODEL_GENERATION = 'llama-3.3-70b-versatile'; // Groq — fast, no quota issues
const MODEL_RESPONSE   = 'gemma-4-31b-it';           // Google — best intelligence for gameplay

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

// Case generation via Groq — fast, free, no quota issues
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  _useCache: boolean = false
): Promise<string> {
  const response = await withRetry(
    () =>
      getGroqClient().chat.completions.create({
        model: MODEL_GENERATION,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    2,
    1000
  );
  return stripThinking(response.choices[0]?.message?.content ?? '');
}

// Character responses via Google Gemma 4 31B — maximum intelligence for gameplay
export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  // Gemma 4 does not support systemInstruction — embed it in the prompt
  const dialogue = conversationHistory
    .map(msg => (msg.role === 'user' ? `Detective: ${msg.content}` : `Tú: ${msg.content}`))
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n---\n\n${dialogue}\n\nTú:`;

  const response = await withRetry(
    () =>
      getGoogleClient().models.generateContent({
        model: MODEL_RESPONSE,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config: { maxOutputTokens: 512 },
      }),
    3,
    1000
  );
  return stripThinking(response.text ?? '');
}
