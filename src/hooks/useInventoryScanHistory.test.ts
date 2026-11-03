import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { inventoryScanHistoryOptions } from "./useInventoryScanHistory";

test("calendar and metadata observers share in-flight and cached scan history, including empty results", async () => {
  const originalFetch = globalThis.fetch;
  const client = new QueryClient();
  let calls = 0;
  let resolve!: (response: Response) => void;
  globalThis.fetch = Object.assign(
    () => {
      calls++;
      return new Promise<Response>((done) => {
        resolve = done;
      });
    },
    { preconnect: originalFetch.preconnect },
  );
  const options = inventoryScanHistoryOptions("123");
  const calendar = new QueryObserver(client, { ...options, enabled: false });
  const metadata = new QueryObserver(client, { ...options, enabled: false });
  const unsubCalendar = calendar.subscribe(() => {});
  const unsubMetadata = metadata.subscribe(() => {});
  try {
    expect(calls).toBe(0);
    calendar.setOptions({ ...options, enabled: true });
    metadata.setOptions({ ...options, enabled: true });
    expect(calls).toBe(1);
    resolve(Response.json([]));
    await client.fetchQuery(options);
    expect(calendar.getCurrentResult().data).toEqual([]);
    expect(metadata.getCurrentResult().data).toEqual([]);
    metadata.setOptions({ ...options, enabled: false });
    metadata.setOptions({ ...options, enabled: true });
    expect(calls).toBe(1);
    expect(inventoryScanHistoryOptions("456").queryKey).not.toEqual(
      options.queryKey,
    );
  } finally {
    unsubCalendar();
    unsubMetadata();
    client.clear();
    globalThis.fetch = originalFetch;
  }
});
