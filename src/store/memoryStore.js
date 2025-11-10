class MemoryStore {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
  }
  set(key, value, ttl = null) {
    this.store.set(key, value);
    if (ttl !== null) {
      const expirationTime = Date.now() + ttl;
      this.expirations.set(key, expirationTime);
    }
  }
  get(key) {
    if (this.expirations.has(key)) {
      const expirationTime = this.expirations.get(key);
      if (Date.now() > expirationTime) {
        this.store.delete(key);
        this.expirations.delete(key);
        return null;
      }
    }
    return this.store.get(key);
  }
  delete(key) {
    this.store.delete(key);
    this.expirations.delete(key);
  }
  expireCycle() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expirationTime] of this.expirations.entries()) {
        if (now > expirationTime) {
          this.store.delete(key);
          this.expirations.delete(key);
        }
      }
    }, 1000);
  }
}
export const memoryStore = new MemoryStore();
memoryStore.expireCycle();