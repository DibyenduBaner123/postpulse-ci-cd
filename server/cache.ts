interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

class RedisCacheSimulator {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    writes: 0,
  };

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds = 300): void {
    this.stats.writes++;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 0,
      createdAt: Date.now(),
    });
  }

  // Emulate Spring @CacheEvict(value = "...", allEntries = true / by pattern)
  public evict(pattern: string): number {
    let evicted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
        evicted++;
      }
    }
    this.stats.evictions += evicted;
    return evicted;
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) : '100.0';
    return {
      totalKeys: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      evictions: this.stats.evictions,
      writes: this.stats.writes,
      cachedKeys: Array.from(this.cache.keys()),
    };
  }
}

export const redisCache = new RedisCacheSimulator();
