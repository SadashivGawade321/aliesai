import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: any;

  constructor() {
    // require() avoids ESM/CJS default-export resolution issues with node-cache
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NC = require('node-cache');
    const Ctor = NC.default ?? NC;
    this.cache = new Ctor({ stdTTL: 300, checkperiod: 60 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any, ttl?: number): boolean {
    return ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOrSet<T = any>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
}
