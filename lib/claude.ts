const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT =
  'You are a compassionate mental wellness companion in the Mood Buddy app. ' +
  'The user has just logged their mood and wants to talk about how they are feeling. ' +
  'Provide supportive, empathetic conversation. Be warm, understanding, and non-judgmental. ' +
  'Ask thoughtful follow-up questions to help them explore their feelings. ' +
  'Keep responses conversational and concise (under 150 words). ' +
  'You are not a therapist — just a caring companion.';

export async function sendChatMessage(
  messages: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    let msg = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) msg = body.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const block = data.content.find(b => b.type === 'text');
  if (!block) throw new Error('No text response received.');
  return block.text;
}
