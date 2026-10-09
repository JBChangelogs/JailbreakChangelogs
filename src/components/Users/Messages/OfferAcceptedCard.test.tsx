import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import {
  asId,
  normalizeOfferItems,
  parseOfferAcceptedMetadata,
} from "@/utils/messages/parsing";
import type {
  TradeOfferDetails,
  useOfferDetailsBatch,
} from "@/hooks/useOfferDetailsBatch";
import { getResponseErrorMessage } from "@/utils/api/api";
import type { OfferAcceptedMetadata } from "@/utils/messages/types";
import { formatOfferItemSummary } from "@/utils/messages/formatting";
import type { Message } from "@/utils/messages/types";
import { QueryClient } from "@tanstack/react-query";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("inline accepted offers keep their own links and details, allow only owners to complete once, and preserve history on success or failure", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  let finish: () => void = () => {};
  let reject: (error: Error) => void = () => {};
  const requests: unknown[][] = [];
  const errors: string[] = [];
  const details: ReturnType<typeof useOfferDetailsBatch> = {
    errorMessage: "Unable to load trade offer details.",
    status: "loaded",
    map: {
      "47810:12464": {
        id: 12464,
        trade: 47810,
        status: 1,
        note: "Meet at the trading island",
        offering: [{ name: "HyperBlue Level 4", amount: 2 }],
        requesting: [{ name: "HyperRed Level 5" }],
      },
      "40000:12000": { id: 12000, trade: 40000, status: 3, note: null },
    },
    markCompleted: async (offer) => {
      details.map = {
        ...details.map,
        [`${offer.trade}:${offer.id}`]: { ...offer, status: 3 },
      };
    },
  };
  const exports = {} as { OfferAcceptedCard: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]): Node => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./OfferAcceptedCard.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      Error,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (value: unknown) => {
                  slots[index] = value;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
          };
        if (name === "next/link") return { default: "link", __esModule: true };
        if (name === "sonner")
          return {
            toast: {
              success: () => {},
              error: (message: string) => errors.push(message),
            },
          };
        if (name === "@/utils/messages/parsing")
          return { asId, normalizeOfferItems };
        if (name === "@/utils/messages/formatting")
          return { formatMessageText: (text: string) => text };
        if (name === "@/utils/trading/core")
          return {
            respondToTradeOfferV2: (...args: unknown[]) => {
              requests.push(args);
              return new Promise<void>((resolve, rejectRequest) => {
                finish = resolve;
                reject = rejectRequest;
              });
            },
          };
        return {
          Button: "button",
          Icon: "icon",
          Spinner: "spinner",
          ChatEventTime: "time",
          OfferItems: "items",
        };
      },
    },
  );
  const metadata: OfferAcceptedMetadata = {
    type: "offer_accepted",
    trade: 47810,
    offer: 12464,
    trade_user: 42,
  };
  const render = (currentUserId: string | null = "42", meta = metadata) => {
    cursor = 0;
    return nodes(
      exports.OfferAcceptedCard({
        metadata: meta,
        currentUserId,
        offerDetails: details,
      }),
    );
  };
  const completeButton = (card: Node[]) =>
    card.find(
      (node) => node.type === "button" && node.props.variant === "success",
    );
  const original = details.map["47810:12464"]!;
  const sibling = details.map["40000:12000"];
  const card = render();
  expect(card.find((node) => node.type === "link")?.props.href).toBe(
    "/trading/ad/47810",
  );
  expect(
    card
      .filter((node) => node.type === "items")
      .map((node) => node.props.items),
  ).toEqual([
    [{ name: "HyperBlue Level 4", amount: 2, type: undefined }],
    [{ name: "HyperRed Level 5", amount: 1, type: undefined }],
  ]);
  expect(card.some((node) => node.type === "time")).toBe(false);
  expect(completeButton(render("7"))).toBeUndefined();
  expect(completeButton(render(null))).toBeUndefined();
  const completedCard = render("42", {
    ...metadata,
    trade: 40000,
    offer: 12000,
  });
  expect(completedCard.find((node) => node.type === "link")?.props.href).toBe(
    "/trading/ad/40000",
  );
  expect(
    completedCard.some((node) => node.props.children === "Completed"),
  ).toBe(true);
  expect(completeButton(completedCard)).toBeUndefined();

  const click = completeButton(render())!.props.onClick as () => void;
  click();
  click();
  expect(requests).toEqual([[47810, 12464, "complete"]]);
  expect(details.map["47810:12464"]?.status).toBe(1);
  expect(completeButton(render())?.props.disabled).toBe(true);
  reject(new Error("Could not complete offer"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(errors).toEqual(["Could not complete offer"]);
  expect(details.map["47810:12464"]).toBe(original);
  expect(completeButton(render())?.props.disabled).toBe(false);
  click();
  finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(requests).toHaveLength(2);
  expect(original.status).toBe(1);
  expect(details.map["47810:12464"]?.status).toBe(3);
  expect(details.map["40000:12000"]).toBe(sibling);
  expect(render().some((node) => node.props.children === "Completed")).toBe(
    true,
  );
  expect(completeButton(render())).toBeUndefined();
  expect(render().filter((node) => node.type === "items")).toHaveLength(2);
  click();
  // A stale click after a rerender must not complete the same offer again.
  expect(requests).toHaveLength(2);

  details.map = {};
  details.status = "loading";
  expect(render().some((node) => node.type === "spinner")).toBe(true);
  details.status = "error";
  expect(
    render().some(
      (node) => node.props.children === "Unable to load trade offer details.",
    ),
  ).toBe(true);
  details.errorMessage = "Offers not found.";
  expect(
    render().some((node) => node.props.children === "Offers not found."),
  ).toBe(true);
  details.status = "idle";
  expect(
    render().some(
      (node) => node.props.children === "Trade offer details are unavailable.",
    ),
  ).toBe(true);
  details.status = "loaded";
  details.map["47810:12464"] = null;
  expect(
    render().some(
      (node) => node.props.children === "No trade offer details found.",
    ),
  ).toBe(true);
  expect(completeButton(render())).toBeUndefined();
  expect(render().find((node) => node.type === "link")?.props.href).toBe(
    "/trading/ad/47810",
  );
  expect(
    normalizeOfferItems([
      { name: "HyperRed Level 5", amount: 1, type: "Hyperchrome" },
      { name: " HyperRed Level 5 ", amount: 1, type: "Hyperchrome" },
      { name: "HyperBlue Level 4", amount: 2, type: "Hyperchrome" },
      { name: "HyperBlue Level 4", amount: 3, type: "Hyperchrome" },
      { name: "HyperRed Level 5", amount: 1, type: "Other" },
      { name: "", amount: 2 },
    ]),
  ).toEqual([
    { name: "HyperRed Level 5", amount: 2, type: "Hyperchrome" },
    { name: "HyperBlue Level 4", amount: 5, type: "Hyperchrome" },
    { name: "HyperRed Level 5", amount: 1, type: "Other" },
  ]);
  expect(
    parseOfferAcceptedMetadata({ ...metadata, trade: "47810", offer: "12464" }),
  ).toEqual(metadata);
  for (const id of [0, -1, 1.5, Infinity, "bad", Number.MAX_SAFE_INTEGER + 1]) {
    expect(parseOfferAcceptedMetadata({ ...metadata, trade: id })).toBeNull();
    expect(parseOfferAcceptedMetadata({ ...metadata, offer: id })).toBeNull();
  }
});

test("accepted trade cards use the message content column and one row timestamp", () => {
  const exports = {} as { MessageRow: (props: unknown) => Node };
  const jsx = (type: unknown, props: Node["props"]): Node => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MessageRow.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: (current: unknown) => ({ current }),
            useEffect: () => {},
          };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => false };
        if (name === "@/utils/messages/parsing")
          return { asId, parseOfferAcceptedMetadata };
        if (name === "@/utils/messages/invites")
          return { parseMessageEmbed: () => null };
        if (name === "@/utils/messages/sorting")
          return { getMessageDomId: (message: { id: string }) => message.id };
        if (name === "@/utils/messages/formatting")
          return {
            formatSystemMessageContent: () => "Accepted offer",
            formatMessageText: (text: string) => text,
          };
        return {
          ChatEvent: "event",
          ChatEventAddon: "addon",
          ChatEventBody: "body",
          ChatEventTitle: "title",
          ChatEventTime: "time",
          OfferAcceptedCard: "offer-card",
          Icon: "icon",
        };
      },
    },
  );
  const metadata = {
    type: "offer_accepted",
    trade: 47810,
    offer: 12464,
    trade_user: "42",
  };
  const row = exports.MessageRow({
    message: {
      id: "accepted-offer",
      type: "system",
      createdAt: 1000,
      metadata,
    },
    currentUser: { id: "42" },
    selectedUser: null,
    offerDetails: { map: {}, status: "loading" },
  });
  const children = row.props.children as Node[];
  expect(row.props.id).toBe("message-accepted-offer");
  expect(children[0].type).toBe("addon");
  expect(children[1].type).toBe("body");
  expect(nodes(children[1]).some((node) => node.type === "offer-card")).toBe(
    true,
  );
  expect(nodes(children[0]).some((node) => node.type === "offer-card")).toBe(
    false,
  );
  expect(nodes(row).filter((node) => node.type === "time")).toHaveLength(1);
});

test("active offer reminders persist through chatting, jump to the right card, deduplicate offers, and disappear on completion", () => {
  const exports = {} as {
    ActiveOfferReminder: (props: unknown) => Node | null;
  };
  const jsx = (type: unknown, props: Node["props"]): Node => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ActiveOfferReminder.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/utils/messages/parsing")
          return { normalizeOfferItems, parseOfferAcceptedMetadata };
        if (name === "@/utils/messages/formatting")
          return { formatOfferItemSummary };
        return {
          Button: "button",
          Icon: "icon",
          DropdownMenu: "menu",
          DropdownMenuTrigger: "trigger",
          DropdownMenuContent: "content",
          DropdownMenuItem: "item",
        };
      },
    },
  );
  const offerMessage: Message = {
    id: "offer-message",
    senderId: "42",
    receiverId: "7",
    content: "",
    metadata: { type: "offer_accepted", trade: 47810, offer: 12464 },
  };
  const otherMessage: Message = {
    ...offerMessage,
    id: "other-offer",
    metadata: { type: "offer_accepted", trade: 40000, offer: 12000 },
  };
  const chatMessage: Message = {
    id: "chat",
    senderId: "42",
    receiverId: "7",
    content: "Still chatting",
  };
  const details = {
    map: {} as Record<string, TradeOfferDetails | null>,
    status: "loaded",
  };
  const jumps: Message[] = [];
  const render = (messages: Message[]) =>
    exports.ActiveOfferReminder({
      messages,
      offerDetails: details,
      onViewOffer: (message: Message) => jumps.push(message),
    });
  expect(render([chatMessage])).toBeNull();
  expect(render([offerMessage])).toBeNull();
  details.map["47810:12464"] = {
    id: 12464,
    trade: 47810,
    status: 1,
    note: null,
    offering: [{ name: "HyperBlue Level 4", type: "Hyperchrome" }],
  };
  const single = nodes(
    render([offerMessage, chatMessage, { ...chatMessage, id: "chat-2" }]),
  );
  const button = single.find((node) => node.type === "button")!;
  expect(button.props.children).toBe("View offer");
  (button.props.onClick as () => void)();
  expect(jumps).toEqual([offerMessage]);
  const duplicate = { ...offerMessage, id: "duplicate" };
  const deduplicated = nodes(render([offerMessage, duplicate, chatMessage]));
  expect(deduplicated.some((node) => node.type === "menu")).toBe(false);
  (
    deduplicated.find((node) => node.type === "button")!.props
      .onClick as () => void
  )();
  expect(jumps.at(-1)).toBe(duplicate);
  details.map["40000:12000"] = {
    id: 12000,
    trade: 40000,
    status: 1,
    note: null,
  };
  const multiple = nodes(render([offerMessage, otherMessage, chatMessage]));
  const choices = multiple.filter((node) => node.type === "item");
  expect(choices).toHaveLength(2);
  (choices[0].props.onSelect as () => void)();
  expect(jumps.at(-1)).toBe(otherMessage);
  (choices[1].props.onSelect as () => void)();
  expect(jumps.at(-1)).toBe(offerMessage);
  details.map["47810:12464"]!.status = 3;
  expect(
    nodes(render([offerMessage, otherMessage])).some(
      (node) => node.type === "menu",
    ),
  ).toBe(false);
  details.map["40000:12000"]!.status = 3;
  expect(render([offerMessage, otherMessage, chatMessage])).toBeNull();
});

test("completion updates a newer batch and cancels stale fetches without changing unrelated offers", async () => {
  type Details = Record<string, TradeOfferDetails | null>;
  const client = new QueryClient();
  const exports = {} as {
    useOfferDetailsBatch: (
      events: unknown[],
    ) => ReturnType<typeof useOfferDetailsBatch>;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../../../hooks/useOfferDetailsBatch.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.test" } },
      require: (name: string) => {
        if (name === "react")
          return {
            useMemo: (fn: () => unknown) => fn(),
            useCallback: (fn: unknown) => fn,
          };
        if (name === "@tanstack/react-query")
          return { useQuery: () => ({}), useQueryClient: () => client };
        if (
          name === "@/utils/api/apiDevToken" ||
          name === "@/utils/api/parseJsonWithLargeIds" ||
          name === "@/utils/api/api"
        )
          return {};
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const oldKey = ["offer-details-batch", "[[47810,12464]]"];
  const newKey = ["offer-details-batch", "[[47810,12464],[40000,12000]]"];
  const unrelatedKey = ["offer-details-batch", "[[40000,12000]]"];
  const offer: TradeOfferDetails = {
    id: 12464,
    trade: 47810,
    status: 1,
    note: null,
  };
  const otherOffer: TradeOfferDetails = {
    id: 12000,
    trade: 40000,
    status: 1,
    note: null,
  };
  client.setQueryData(oldKey, { "47810:12464": offer });
  const oldBatch = exports.useOfferDetailsBatch([
    { trade: 47810, offer: 12464 },
  ]);
  client.setQueryData(newKey, {
    "47810:12464": offer,
    "40000:12000": otherOffer,
  });
  client.setQueryData(unrelatedKey, { "40000:12000": otherOffer });
  const unrelated = client.getQueryData<Details>(unrelatedKey);
  let release: (value: Details) => void = () => {};
  let staleSignal: AbortSignal | undefined;
  const staleFetch = client
    .fetchQuery<Details>({
      queryKey: newKey,
      queryFn: ({ signal }) => {
        staleSignal = signal;
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    })
    .catch(() => null);
  await oldBatch.markCompleted(offer);
  expect(staleSignal?.aborted).toBe(true);
  expect(client.getQueryData<Details>(oldKey)?.["47810:12464"]?.status).toBe(3);
  expect(client.getQueryData<Details>(newKey)?.["47810:12464"]?.status).toBe(3);
  expect(client.getQueryData<Details>(newKey)?.["40000:12000"]).toBe(
    otherOffer,
  );
  expect(client.getQueryData<Details>(unrelatedKey)).toBe(unrelated);
  expect(client.getQueryState(newKey)?.isInvalidated).toBe(true);
  release({ "47810:12464": offer, "40000:12000": otherOffer });
  await staleFetch;
  expect(client.getQueryData<Details>(newKey)?.["47810:12464"]?.status).toBe(3);
  expect(offer.status).toBe(1);

  // A newly started batch may not have any data yet when completion succeeds.
  const loadingKey = ["offer-details-batch", "[[47810,12464],[50000,13000]]"];
  const loadingFetch = client
    .fetchQuery<Details>({
      queryKey: loadingKey,
      queryFn: () => new Promise(() => {}),
    })
    .catch(() => null);
  await oldBatch.markCompleted(offer);
  expect(
    client.getQueryData<Details>(loadingKey)?.["47810:12464"]?.status,
  ).toBe(3);
  await loadingFetch;
  client.clear();
});

test("batch offer details retain accepted and completed offers and preserve backend error messages", async () => {
  let queryFn: () => Promise<
    Record<string, TradeOfferDetails | null>
  > = async () => ({});
  const exports = {} as {
    useOfferDetailsBatch: (events: unknown[]) => unknown;
  };
  const records = [
    { trade: 47810, id: 12464, status: 1 },
    { trade: 40000, id: 12000, status: 3 },
    { trade: 30000, id: 11000, status: 2 },
  ];
  let responseStatus = 200;
  let errorBody: unknown = null;
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../../../hooks/useOfferDetailsBatch.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.test" } },
      fetch: async () => ({
        ok: responseStatus === 200,
        status: responseStatus,
        text: async () =>
          JSON.stringify(responseStatus === 200 ? records : errorBody),
      }),
      require: (name: string) => {
        if (name === "react")
          return {
            useMemo: (fn: () => unknown) => fn(),
            useCallback: (fn: unknown) => fn,
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: {
              queryFn: (context: {
                signal: undefined;
              }) => Promise<Record<string, TradeOfferDetails | null>>;
            }) => {
              queryFn = () => options.queryFn({ signal: undefined });
              return {};
            },
            useQueryClient: () => ({}),
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: () => ({
              url: "https://api.example.test/v2/trades/offers/batch",
              headers: {},
            }),
          };
        if (name === "@/utils/api/parseJsonWithLargeIds")
          return { parseJsonWithLargeIds: JSON.parse };
        if (name === "@/utils/api/api") return { getResponseErrorMessage };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  exports.useOfferDetailsBatch([
    { trade: 47810, offer: 12464 },
    { trade: 40000, offer: 12000 },
    { trade: 30000, offer: 11000 },
    { trade: 20000, offer: 10000 },
  ]);
  const result = await queryFn();
  expect(result["47810:12464"]?.status).toBe(1);
  expect(result["40000:12000"]?.status).toBe(3);
  expect(result["30000:11000"]).toBeNull();
  expect(result["20000:10000"]).toBeNull();
  responseStatus = 404;
  errorBody = { error: "offers_not_found", message: "Offers not found." };
  await expect(queryFn()).rejects.toThrow("Offers not found.");
  responseStatus = 401;
  errorBody = { detail: "Unauthorized" };
  await expect(queryFn()).rejects.toThrow("Unauthorized");
  responseStatus = 403;
  errorBody = { detail: "Forbidden" };
  await expect(queryFn()).rejects.toThrow("Forbidden");
  responseStatus = 422;
  errorBody = { detail: [{ msg: "Input should be a valid list" }] };
  await expect(queryFn()).rejects.toThrow("Input should be a valid list");
  responseStatus = 429;
  errorBody = { detail: "Too many requests" };
  await expect(queryFn()).rejects.toThrow(
    "Too many requests. Please try again shortly.",
  );
  responseStatus = 500;
  errorBody = {};
  await expect(queryFn()).rejects.toThrow(
    "Unable to load trade offer details.",
  );
});
