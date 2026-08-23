export type ChatStreamEvent =
  | { event: 'token'; data: { token: string } }
  | { event: 'done'; data: { conversationId: string; ttftMs: number | null; latencyMs: number } }
  | { event: 'error'; data: { code: string; message: string } };

export function encodeSseEvent(event: ChatStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export function writeSseHeaders(res: { setHeader(name: string, value: string): void; flushHeaders?: () => void }) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}
