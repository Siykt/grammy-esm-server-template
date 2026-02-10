/**
 * Generic Collection Interface
 * Provides a consistent API for managing collections of domain entities
 */
export interface ICollection<T, K = string> {
  /** Add an item to the collection */
  add: (item: T) => void

  /** Remove an item by ID */
  remove: (id: K) => boolean

  /** Get an item by ID */
  get: (id: K) => T | undefined

  /** Find first item matching predicate */
  find: (predicate: (item: T) => boolean) => T | undefined

  /** Filter items matching predicate */
  filter: (predicate: (item: T) => boolean) => T[]

  /** Map items to new values */
  map: <U>(fn: (item: T) => U) => U[]

  /** Convert to array */
  toArray: () => T[]

  /** Get collection size */
  size: () => number

  /** Clear all items */
  clear: () => void

  /** Check if item exists */
  has: (id: K) => boolean

  /** Subscribe to changes */
  onChange: (callback: (items: T[]) => void) => () => void
}

/**
 * Base Collection Implementation
 */
export abstract class BaseCollection<T extends { id: string }> implements ICollection<T, string> {
  protected items: Map<string, T> = new Map()
  protected listeners: Set<(items: T[]) => void> = new Set()

  add(item: T): void {
    this.items.set(item.id, item)
    this.notifyListeners()
  }

  addMany(items: T[]): void {
    items.forEach(item => this.items.set(item.id, item))
    this.notifyListeners()
  }

  remove(id: string): boolean {
    const deleted = this.items.delete(id)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  removeMany(ids: string[]): number {
    let count = 0
    ids.forEach((id) => {
      if (this.items.delete(id)) {
        count++
      }
    })
    if (count > 0) {
      this.notifyListeners()
    }
    return count
  }

  get(id: string): T | undefined {
    return this.items.get(id)
  }

  find(predicate: (item: T) => boolean): T | undefined {
    for (const item of this.items.values()) {
      if (predicate(item)) {
        return item
      }
    }
    return undefined
  }

  filter(predicate: (item: T) => boolean): T[] {
    return Array.from(this.items.values()).filter(predicate)
  }

  map<U>(fn: (item: T) => U): U[] {
    return Array.from(this.items.values()).map(fn)
  }

  toArray(): T[] {
    return Array.from(this.items.values())
  }

  size(): number {
    return this.items.size
  }

  clear(): void {
    this.items.clear()
    this.notifyListeners()
  }

  has(id: string): boolean {
    return this.items.has(id)
  }

  onChange(callback: (items: T[]) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  protected notifyListeners(): void {
    const items = this.toArray()
    this.listeners.forEach(listener => listener(items))
  }

  /**
   * Update an existing item
   */
  update(id: string, updater: (item: T) => T): boolean {
    const item = this.items.get(id)
    if (!item)
      return false

    const updated = updater(item)
    this.items.set(id, updated)
    this.notifyListeners()
    return true
  }

  /**
   * Sort items by a key
   */
  sortBy<K>(keyFn: (item: T) => K, descending: boolean = false): T[] {
    const items = this.toArray()
    return items.sort((a, b) => {
      const aKey = keyFn(a)
      const bKey = keyFn(b)
      const comparison = aKey < bKey ? -1 : aKey > bKey ? 1 : 0
      return descending ? -comparison : comparison
    })
  }

  /**
   * Group items by a key
   */
  groupBy<K extends string>(keyFn: (item: T) => K): Map<K, T[]> {
    const groups = new Map<K, T[]>()
    for (const item of this.items.values()) {
      const key = keyFn(item)
      const group = groups.get(key) ?? []
      group.push(item)
      groups.set(key, group)
    }
    return groups
  }

  /**
   * Get first N items
   */
  take(n: number): T[] {
    return this.toArray().slice(0, n)
  }

  /**
   * Check if any item matches predicate
   */
  some(predicate: (item: T) => boolean): boolean {
    return this.toArray().some(predicate)
  }

  /**
   * Check if all items match predicate
   */
  every(predicate: (item: T) => boolean): boolean {
    return this.toArray().every(predicate)
  }

  /**
   * Reduce items to a single value
   */
  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.toArray().reduce(fn, initial)
  }
}
