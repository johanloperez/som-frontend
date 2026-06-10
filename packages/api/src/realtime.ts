import * as signalR from "@microsoft/signalr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://wholesale-platform-api-bkdxfzcjhwb8bef3.spaincentral-01.azurewebsites.net/api/v1";
const HUB_URL = API_BASE.replace("/api/v1", "/hubs/notifications");

type Listener = (data: { entityType: string; entityId: string; action: string; data?: any; timestamp: string }) => void;

class RealtimeClient {
  private connection: signalR.HubConnection | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private started = false;

  connect(token: string) {
    if (this.started) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    this.connection.onreconnecting(() => {
      console.warn("[Realtime] SignalR reconnecting...");
    });
    this.connection.onreconnected(() => {
      console.info("[Realtime] SignalR reconnected");
    });
    this.connection.onclose(() => {
      console.info("[Realtime] SignalR connection closed");
      this.started = false;
    });

    this.connection.on("EntityChanged", (data) => {
      const key = `${data.entityType}:${data.action}`;
      const wildcard = "*:*";
      for (const k of [key, `${data.entityType}:*`, wildcard]) {
        this.listeners.get(k)?.forEach((l) => l(data));
      }
    });

    this.connection.start()
      .then(() => console.info("[Realtime] Connected to", HUB_URL))
      .catch(() => {
        console.warn("[Realtime] Connection failed. Server may be offline.");
      });
    this.started = true;
  }

  disconnect() {
    this.connection?.stop();
    this.started = false;
  }

  on(entityType: string, action: string, listener: Listener): () => void {
    const key = `${entityType}:${action}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => { this.listeners.get(key)?.delete(listener); };
  }
}

export const realtime = new RealtimeClient();
