import { encodeRESP } from "../protocol/encodeRESP.js";
import {
  type RedisStoredValue,
  type BlockedClient,
  resp,
  RedisConnection,
} from "../utils/types.js";

class MemoryStore {
  private store: Map<string, RedisStoredValue>;               // key : value
  private expirations: Map<string, number>;                   // key : expiration timestamp
  private blockedClients: Map<string, BlockedClient[]>;       // key : array of blocked clients
  private subscriptions: Map<string, Set<RedisConnection>>;   // key : set of subscribed clients

  constructor() {
    this.store = new Map();
    this.expirations = new Map();
    this.blockedClients = new Map();
    this.subscriptions = new Map();
  }

  set(key: string, value: RedisStoredValue, ttl: number | null = null): void {
    this.store.set(key, value);
    if (ttl !== null) {
      const expirationTime = Date.now() + ttl;
      this.expirations.set(key, expirationTime);
    }
  }

  get(key: string): RedisStoredValue | undefined {
    if (this.expirations.has(key)) {
      const expirationTime = this.expirations.get(key);
      if (expirationTime && Date.now() > expirationTime) {
        this.store.delete(key);
        this.expirations.delete(key);
        return undefined;
      }
    }
    return this.store.get(key);
  }

  delete(key: string): void {
    this.store.delete(key);
    this.expirations.delete(key);
  }

  expireCycle(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expirationTime] of this.expirations.entries()) {
        if (now > expirationTime) {
          this.store.delete(key);
          this.expirations.delete(key);
        }
      }
    }, 100);
  }

  addBlockedClient(client: BlockedClient): void {
    for (const key of client.keys) {
      const clients = this.blockedClients.get(key) || [];
      clients.push(client);
      this.blockedClients.set(key, clients);
    }
  }

  removeBlockedClient(client: BlockedClient): void {
    for (const key of client.keys) {
      const clients = this.blockedClients.get(key) || [];
      const filtered = clients.filter((c) => c.id !== client.id);
      if (filtered.length === 0) {
        this.blockedClients.delete(key);
      } else {
        this.blockedClients.set(key, filtered);
      }
    }
  }

  removeBlockedClientById(clientId: string): void {
    for (const [key, clients] of this.blockedClients.entries()) {
      const filtered = clients.filter((c) => c.id !== clientId);
      if (filtered.length === 0) {
        this.blockedClients.delete(key);
      } else {
        this.blockedClients.set(key, filtered);
      }
    }
  }

  getBlockedClients(key: string): BlockedClient[] {
    return this.blockedClients.get(key) || [];
  }

  blockedClientCycle(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredClients: BlockedClient[] = [];

      for (const [key, clients] of this.blockedClients.entries()) {
        for (const client of clients) {
          if (client.deadline !== null && now > client.deadline) {
            if (!expiredClients.some((c) => c.id === client.id)) {
              expiredClients.push(client);
              try {
                if (!client.socket.destroyed) {
                  client.socket.write(encodeRESP(resp.array(null)));
                }
              } catch (err) {
                // Socket already closed
              }
            }
          }
        }
      }

      for (const client of expiredClients) {
        this.removeBlockedClient(client);
      }
    }, 100);
  }

  addSubscription(channels: string[], connection: RedisConnection): void {
    for (const channel of channels) {
      const subscribers = this.subscriptions.get(channel) || new Set<RedisConnection>();
      subscribers.add(connection);
      this.subscriptions.set(channel, subscribers);
    }
  }

  getSubscribers(channel: string): Set<RedisConnection> | undefined {
    return this.subscriptions.get(channel);
  }

  removeSubscriptionChannel(channel: string, connection: RedisConnection): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(connection);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      } else {
        this.subscriptions.set(channel, subscribers);
      }
    }
  }

  removeSubscriptionConnection(connection: RedisConnection): void {
    if (connection.pubSub?.channels) {
      for (const channel of connection.pubSub.channels) {
        this.removeSubscriptionChannel(channel, connection);
      }
    }
  }
}

export const memoryStore = new MemoryStore();
memoryStore.expireCycle();
memoryStore.blockedClientCycle();
