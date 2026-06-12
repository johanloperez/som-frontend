import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getToken } from "./auth";
import { API_BASE_URL } from "./client";

export type RealtimeHandler = (payload: unknown) => void;

/** Shape of the payload the backend sends on the "EntityChanged" hub method. */
export interface EntityChangePayload {
  entityType: string;
  entityId: string;
  action: string;
  data?: unknown;
  timestamp: string;
}

export type EntityChangeHandler = (payload: EntityChangePayload) => void;

function hubUrl(): string {
  // Strip a trailing /api (or /api/) to reach the hub root.
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${base}/hubs/notifications`;
}

let connection: HubConnection | null = null;

// Module-level subscriber registry. Components register handlers here; the live
// connection fans every "EntityChanged" message out to them. Keeping the set at
// module scope means it survives reconnects (the handler is re-attached to each
// freshly built connection in getConnection()).
const entityHandlers = new Set<EntityChangeHandler>();

function dispatchEntityChange(payload: EntityChangePayload) {
  for (const handler of entityHandlers) {
    try {
      handler(payload);
    } catch {
      // A faulty subscriber must not break the others.
    }
  }
}

export function getConnection(): HubConnection {
  if (connection) return connection;
  connection = new HubConnectionBuilder()
    .withUrl(hubUrl(), {
      accessTokenFactory: () => getToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    // Real-time is best-effort; a missing hub must not spam the console.
    .configureLogging(LogLevel.None)
    .build();
  // The backend broadcasts every change via a single "EntityChanged" method.
  connection.on("EntityChanged", (payload: EntityChangePayload) => dispatchEntityChange(payload));
  return connection;
}

export async function startConnection(): Promise<HubConnection | null> {
  const conn = getConnection();
  if (conn.state === HubConnectionState.Connected) return conn;
  try {
    if (conn.state === HubConnectionState.Disconnected) {
      await conn.start();
    }
    return conn;
  } catch {
    // A real-time failure must never block the app — warn silently.
    return null;
  }
}

export async function stopConnection(): Promise<void> {
  if (!connection) return;
  try {
    await connection.stop();
  } finally {
    connection = null;
  }
}

/**
 * Subscribe to entity-change events pushed by the server.
 *
 * @param handler called for every change (already filtered by `types` if given).
 * @param types   optional allow-list of entityType values; omit to receive all.
 * @returns an unsubscribe function.
 */
export function onEntityChange(handler: EntityChangeHandler, types?: string[]): () => void {
  // Make sure a connection (and its "EntityChanged" listener) exists.
  getConnection();
  const wrapped: EntityChangeHandler =
    types && types.length > 0
      ? (p) => { if (types.includes(p.entityType)) handler(p); }
      : handler;
  entityHandlers.add(wrapped);
  return () => { entityHandlers.delete(wrapped); };
}

/**
 * @deprecated Back-compat shim for the old `onEntityEvent(event, handler)` API.
 * Filters by entityType and forwards the raw payload.
 */
export function onEntityEvent(event: string, handler: RealtimeHandler): () => void {
  return onEntityChange((p) => handler(p), event ? [event] : undefined);
}
