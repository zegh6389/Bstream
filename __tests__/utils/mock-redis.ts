export interface MockRedis {
  store: Map<string, { value: any; expires?: number }>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  set(key: string, value: any, options?: { EX?: number }): Promise<string>;
  get(key: string): Promise<any>;
  del(key: string): Promise<number>;
  flushall(): Promise<string>;
  incr(key: string): Promise<number>;
}

export const redis: MockRedis = {
  store: new Map<string, { value: any; expires?: number }>(),
  async connect() {
    return Promise.resolve()
  },
  async disconnect() {
    this.store.clear()
    return Promise.resolve()
  },
  async set(key: string, value: any, options?: { EX?: number }) {
    if (options?.EX) {
      this.store.set(key, { 
        value, 
        expires: Date.now() + (options.EX * 1000)
      })
    } else {
      this.store.set(key, { value })
    }
    return Promise.resolve("OK")
  },
  async get(key: string) {
    const stored = this.store.get(key)
    if (!stored) return null
    if (stored.expires && stored.expires < Date.now()) {
      this.store.delete(key)
      return null
    }
    return Promise.resolve(stored.value)
  },
  async del(key: string) {
    return Promise.resolve(this.store.delete(key) ? 1 : 0)
  },
  async flushall() {
    this.store.clear()
    return Promise.resolve("OK")
  },
  async incr(key: string) {
    const stored = await this.get(key)
    const currentValue = parseInt(stored) || 0
    const newValue = currentValue + 1
    await this.set(key, newValue)
    return Promise.resolve(newValue)
  }
}
