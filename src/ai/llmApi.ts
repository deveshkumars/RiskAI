const LLM_ENDPOINT =
  'https://api.buildworkforce.ai/api/v1/chatflows/a53a927a-8904-4a30-9c05-b158ed20833f/prediction';

const LLM_TIMEOUT_MS = 30_000;

/**
 * Call the Buildworkforce chatflow API with a prompt string.
 * Returns the LLM's text response.
 */
export async function callLLM(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `LLM API error ${response.status}: ${errorBody.slice(0, 200)}`
      );
    }

    const result = await response.json();

    // Try common response field names
    const text =
      result.text ??
      result.answer ??
      result.message ??
      result.content ??
      result.response ??
      (typeof result === 'string' ? result : JSON.stringify(result));

    return String(text);
  } finally {
    clearTimeout(timeoutId);
  }
}
