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
    },
  });
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

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    config: {
      maxOutputTokens: 1024,
    },
  });

  return response.text ?? '';
}
