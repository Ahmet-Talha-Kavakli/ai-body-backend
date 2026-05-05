/**
 * SSE streaming reader — React Native uyumlu.
 * fetch().body.getReader() RN'de güvenilir değil; XMLHttpRequest progress
 * event'i ile responseText'in farklı kısmını parse ediyoruz.
 */

export type StreamEvent =
  | { type: 'thinking' }
  | { type: 'user_message_id'; userMessageId: string }
  | { type: 'tool_start'; toolCallId: string; name: string; args: unknown }
  | { type: 'tool_end'; toolCallId: string; name: string; result: unknown }
  | { type: 'text_delta'; text: string }
  | { type: 'done'; finalText: string; toolCalls: unknown[] }
  | { type: 'saved'; aiMessageId: string }
  | { type: 'memory_saved'; facts: Array<{ category: string; content: string }> }
  | { type: 'error'; message: string };

export async function streamAssistantMessage(args: {
  url: string;
  token: string;
  content?: string;
  // V3 Faz B — Vision: foto/dosya yüklenmiş bir mesaja AI cevabı iste
  forAttachmentMessageId?: string;
  onEvent: (event: StreamEvent) => void;
  onError?: (e: unknown) => void;
}): Promise<void> {
  const { url, token, content, forAttachmentMessageId, onEvent, onError } = args;

  return new Promise<void>((resolve) => {
    const xhr = new XMLHttpRequest();
    let lastIndex = 0;
    let buffer = '';

    const flushBuffer = () => {
      let eventEnd: number;
      // eslint-disable-next-line no-cond-assign
      while ((eventEnd = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);
        const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;
        const json = dataLine.slice(6).trim();
        if (!json) continue;
        try {
          const event = JSON.parse(json) as StreamEvent;
          onEvent(event);
        } catch {
          // ignore parse error
        }
      }
    };

    xhr.open('POST', url);
    xhr.timeout = 90_000; // 90sn — uzun AI cevapları için tampon, donmayı engeller
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'text/event-stream');

    xhr.ontimeout = () => {
      onEvent({ type: 'error', message: 'timeout' });
      resolve();
    };

    xhr.onreadystatechange = () => {
      // readyState 3 = LOADING — yanıt gövdesi parça parça geliyor
      if (xhr.readyState >= 3) {
        const chunk = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;
        if (chunk.length > 0) {
          buffer += chunk;
          flushBuffer();
        }
      }
      if (xhr.readyState === 4) {
        // Tamamlandı
        if (xhr.status >= 400) {
          onEvent({ type: 'error', message: `http_${xhr.status}` });
        }
        resolve();
      }
    };

    xhr.onerror = () => {
      onError?.(new Error('xhr_error'));
      onEvent({ type: 'error', message: 'network' });
      resolve();
    };

    xhr.send(
      JSON.stringify(
        forAttachmentMessageId
          ? { forAttachmentMessageId, content: content ?? '' }
          : { content: content ?? '' },
      ),
    );
  });
}
