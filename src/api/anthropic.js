const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MONDAY_TOKEN = import.meta.env.VITE_MONDAY_API_TOKEN;

const MONDAY_MCP_SERVER = {
  type: 'url',
  url: 'https://mcp.monday.com/sse',
  name: 'monday-mcp',
  authorization_token: MONDAY_TOKEN,
};

export function isChatConfigured() {
  return Boolean(API_KEY && API_KEY !== '<your_anthropic_api_key_here>');
}

export async function sendChatMessage(messages, systemPrompt) {
  if (!isChatConfigured()) {
    throw new Error('MISSING_API_KEY');
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      mcp_servers: [MONDAY_MCP_SERVER],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();

  // Extract only text blocks — tool calls happen server-side via MCP
  const textContent = (data.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return textContent || '(No response)';
}
