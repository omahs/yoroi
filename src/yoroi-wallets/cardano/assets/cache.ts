export interface CachedStorage {
  read: <T>() => Promise<Array<[string, T]>>
  write: <T>(update: Array<[string, T]>) => Promise<boolean>
}

export type CachedRecord<T> = {
  _updatedAt: number
  record: T
}

export class CacheService<T> {
  public static readonly Errors = Object.freeze({
    RequiresWarmUp: 'CacheService requires to warm up',
  })

  public static readonly defaultTtl = 5 * 24 * 3600 * 1000

  private _ready: boolean
  private _cache: Map<string, CachedRecord<T>>

  constructor(
    private readonly _storage: CachedStorage, //
    public readonly ttl: number = CacheService.defaultTtl,
  ) {
    this._cache = new Map()
    this._ready = false
  }

  get ready() {
    return this._ready
  }

  private _check() {
    if (!this._ready) throw new Error(CacheService.Errors.RequiresWarmUp)
  }

  public warmUp() {
    return this._storage.read<CachedRecord<T>>().then((assets) => {
      this._cache = new Map(Array.from(assets))
      this._ready = true
    })
  }

  public dump() {
    this._check()
    return this._storage.write(Array.from(this._cache))
  }

  public getByKey(key: string): {record: T | null; expired: boolean} {
    this._check()
    const cachedValue = this._cache.get(key)
    if (!cachedValue) return {record: null, expired: false}
    return {record: cachedValue.record, expired: expired(cachedValue._updatedAt, this.ttl)}
  }

  public wipe() {
    this._check()
    this._cache.clear()
  }

  public clearByKey(key: string) {
    this._check()
    this._cache.delete(key)
  }

  public setByKey(key: string, value: Readonly<T>) {
    this._check()
    const cachedValue = {record: value, _updatedAt: new Date().getTime()}
    this._cache.set(key, cachedValue)
  }

  public hasByKey(key: string) {
    this._check()
    if (!this.getByKey(key).record) return false
    return true
  }

  get size() {
    return this._cache.size
  }
}

function expired(lastUpdate: number, ttl: number): boolean {
  return new Date().getTime() - lastUpdate >= ttl
}
