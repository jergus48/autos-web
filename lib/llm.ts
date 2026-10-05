export async function llmJson<T = any>(system: string, user: string): Promise<{ data: T; tokens: number }> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error('OPENROUTER_API_KEY missing');
  const model = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'x-title': 'Outreach Studio' },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 7000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!r.ok) {
      lastErr = `OpenRouter ${r.status}: ${(await r.text()).slice(0, 200)}`;
      continue;
    }
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content || '';
    try {
      return { data: JSON.parse(txt), tokens: j.usage?.total_tokens || 0 };
    } catch {
      lastErr = 'Model returned invalid JSON';
    }
  }
  throw new Error(lastErr || 'LLM failed');
}
