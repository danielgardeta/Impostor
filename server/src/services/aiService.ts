import Groq from 'groq-sdk';

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment variables');
    client = new Groq({ apiKey });
  }
  return client;
}

const MODEL = 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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
  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
    })
  );
  return response.choices[0]?.message?.content ?? '';
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  _useCache: boolean = true
): Promise<string> {
  // Merge consecutive messages with the same role (required by chat completions APIs)
  const merged = conversationHistory.reduce<Array<{ role: 'user' | 'assistant'; content: string }>>(
    (acc, msg) => {
      const last = acc[acc.length - 1];
      if (last && last.role === msg.role) {
        last.content += '\n' + msg.content;
      } else {
        acc.push({ ...msg });
      }
      return acc;
    },
    []
  );

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...merged.map(msg => ({ role: msg.role, content: msg.content })),
  ];

  const response = await withRetry(() =>
    getClient().chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 1024,
    })
  );

  return response.choices[0]?.message?.content ?? '';
}
