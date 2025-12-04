import { encodeRESP } from "../protocol/encodeRESP";
import { type RedisStoredValue, type BlockedClient, resp, type Transaction } from "../utils/types";

class MemoryStore {
  private store: Map<string, RedisStoredValue>;
  private expirations: Map<string, number>;
  private blockedClients: Map<string, BlockedClient[]>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.store = new Map();
    this.expirations = new Map();
    this.blockedClients = new Map();
    this.transactions = new Map();
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
            if (!expiredClients.some(c => c.id === client.id)) {
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

  getTransaction(socketId: string): Transaction | undefined {
    return this.transactions.get(socketId);
  }

  setTransaction(socketId: string, client: Transaction): void {
    this.transactions.set(socketId, client);
  }

  deleteTransaction(socketId: string): void {
    this.transactions.delete(socketId);
  }
}

export const memoryStore = new MemoryStore();
memoryStore.expireCycle();
memoryStore.blockedClientCycle();
