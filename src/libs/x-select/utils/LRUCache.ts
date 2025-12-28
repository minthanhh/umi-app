/**
 * LRU Cache - Least Recently Used Cache
 *
 * A simple LRU cache implementation with max size limit.
 * When the cache exceeds maxSize, the least recently used entries are evicted.
 */

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('LRU Cache maxSize must be positive');
    }
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache.
   * Moves the key to the end (most recently used).
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set a value in the cache.
   * If the key exists, it's moved to the end.
   * If cache is full, the oldest entry is evicted.
   */
  set(key: K, value: V): void {
    // If key exists, delete it first (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  /**
   * Check if a key exists in the cache.
   * Does NOT update the access order.
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache (oldest to newest).
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all values in the cache (oldest to newest).
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Get all entries in the cache (oldest to newest).
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}

/**
 * Stable JSON stringify that sorts object keys.
 * Ensures consistent cache keys regardless of property order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }

  // Sort object keys for consistent output
  const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`
  );
  return '{' + pairs.join(',') + '}';
}
