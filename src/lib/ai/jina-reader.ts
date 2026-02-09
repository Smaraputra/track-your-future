const JINA_BASE = 'https://r.jina.ai/';
const TIMEOUT_MS = 15_000;
const MIN_RESPONSE_LENGTH = 50;

export async function fetchUrlAsText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${JINA_BASE}${encodeURIComponent(url)}`, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Jina Reader returned HTTP ${res.status}`);
    }

    const text = await res.text();

    if (text.length < MIN_RESPONSE_LENGTH) {
      throw new Error('URL returned insufficient content for extraction');
    }

    return text;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('URL fetch timed out after 15 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
