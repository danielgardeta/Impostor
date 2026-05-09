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

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  _useCache: boolean = false
): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });
  return response.text ?? '';
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  const contents = conversationHistory.map(msg => ({
    role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: msg.content }],
  }));

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 1024,
    },
  });

  return response.text ?? '';
}
