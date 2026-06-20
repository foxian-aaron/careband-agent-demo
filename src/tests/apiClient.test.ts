import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "../lib/apiClient";

describe("apiClient requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns parsed JSON for successful API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true, value: 42 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(requestJson<{ value: number }>("/api/test")).resolves.toMatchObject({ value: 42 });
  });

  it("throws a useful short error for non-JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<html><body>temporary tunnel warning page</body></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ),
    );

    await expect(requestJson("/api/health")).rejects.toThrow(
      /API did not return JSON\. status=200, content-type=text\/html; charset=utf-8, preview=<html>/,
    );
  });

  it("aborts requests after the configured timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      ),
    );

    const request = requestJson("/api/slow", {}, 25);
    const expectation = expect(request).rejects.toThrow("API request timed out after 25ms");
    await vi.advanceTimersByTimeAsync(25);

    await expectation;
  });
});
