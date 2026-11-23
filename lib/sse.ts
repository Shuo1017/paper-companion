/**
 * Browser-side SSE reader for the site's projected AI stream.
 * Parses `event:` / `data:` / `id:` fields, ignores `:` heartbeat comments,
 * and yields one object per blank-line-delimited frame. Bounded frame size,
 * abort-aware. This mirrors functions/sse.mjs for the browser bundle.
 */
export interface SSEFrame {
  event: string;
  id: string;
  data: string;
}

export async function* readSSE(
  body: ReadableStream<Uint8Array>,
  { maxFrameChars = 262144, signal }: { maxFrameChars?: number; signal?: AbortSignal } = {}
): AsyncGenerator<SSEFrame> {
  const reader = body.getReader();
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", abort, { once: true });
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];
  let event = "";
  let id = "";
  let size = 0;
  try {
    while (true) {
      if (signal?.aborted) throw new Error("sse_aborted");
      const chunk = await reader.read();
      if (signal?.aborted) throw new Error("sse_aborted");
      buffer += chunk.done
        ? decoder.decode()
        : decoder.decode(chunk.value, { stream: true });
      while (true) {
        if (signal?.aborted) throw new Error("sse_aborted");
        const match = /[\r\n]/.exec(buffer);
        if (
          !match ||
          (!chunk.done &&
            buffer[match.index] === "\r" &&
            match.index === buffer.length - 1)
        )
          break;
        const line = buffer.slice(0, match.index);
        const width =
          buffer[match.index] === "\r" && buffer[match.index + 1] === "\n" ? 2 : 1;
        buffer = buffer.slice(match.index + width);
        size += line.length;
        if (size > maxFrameChars) throw new Error("sse_frame_too_large");
        if (!line) {
          if (data.length)
            yield { event: event || "message", id, data: data.join("\n") };
          data = [];
          event = "";
          id = "";
          size = 0;
        } else if (!line.startsWith(":")) {
          const colon = line.indexOf(":");
          const field = colon < 0 ? line : line.slice(0, colon);
          let value = colon < 0 ? "" : line.slice(colon + 1);
          if (value.startsWith(" ")) value = value.slice(1);
          if (field === "data") data.push(value);
          else if (field === "event") event = value;
          else if (field === "id" && !value.includes("\0")) id = value;
        }
      }
      if (buffer.length + size > maxFrameChars) throw new Error("sse_frame_too_large");
      if (chunk.done) break;
    }
    // An unfinished frame at EOF is not a completed event.
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}