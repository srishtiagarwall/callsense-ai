import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateCall, getCall, listCalls, uploadCall } from "./api";
import { setApiKey } from "./auth";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as typeof fetch;
}

describe("apiFetch error handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws with status and body text when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Call not found"),
    }) as unknown as typeof fetch;

    await expect(getCall("missing-id")).rejects.toThrow(/404/);
  });

  it("resolves with parsed JSON when response is ok", async () => {
    mockFetchOnce({ id: "1", filename: "a.wav", audio_path: "/x", language: null, uploaded_at: "now", duration_seconds: null });
    const call = await getCall("1");
    expect(call.id).toBe("1");
  });
});

describe("endpoint URL/method construction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listCalls hits GET /calls with no params", async () => {
    mockFetchOnce({ items: [], total: 0, page: 1, page_size: 20 });
    await listCalls();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/calls$/), expect.anything());
  });

  it("listCalls includes pagination and search query params", async () => {
    mockFetchOnce({ items: [], total: 0, page: 2, page_size: 10 });
    await listCalls({ page: 2, pageSize: 10, search: "acme", sort: "filename" });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("/calls?");
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("page_size=10");
    expect(calledUrl).toContain("search=acme");
    expect(calledUrl).toContain("sort=filename");
  });

  it("getCall hits GET /calls/{id}", async () => {
    mockFetchOnce({ id: "abc" });
    await getCall("abc");
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/calls\/abc$/), expect.anything());
  });

  it("evaluateCall POSTs to /calls/{id}/evaluate with rubric_id query param", async () => {
    mockFetchOnce({ id: "abc" });
    await evaluateCall("abc", "custom-rubric");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/calls\/abc\/evaluate\?rubric_id=custom-rubric$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("uploadCall POSTs FormData to /calls/upload", async () => {
    mockFetchOnce({ id: "abc" });
    const file = new File(["data"], "test.wav", { type: "audio/wav" });
    await uploadCall(file);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/calls\/upload$/),
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("uploadCall includes language query param when provided", async () => {
    mockFetchOnce({ id: "abc" });
    const file = new File(["data"], "test.wav");
    await uploadCall(file, "en");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/calls\/upload\?language=en$/),
      expect.anything(),
    );
  });
});

describe("API key header attachment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("attaches X-API-Key header when a key is stored", async () => {
    setApiKey("secret123");
    mockFetchOnce({ id: "abc" });
    await getCall("abc");
    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("X-API-Key")).toBe("secret123");
  });

  it("omits X-API-Key header when no key is stored", async () => {
    mockFetchOnce({ id: "abc" });
    await getCall("abc");
    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("X-API-Key")).toBeNull();
  });
});
