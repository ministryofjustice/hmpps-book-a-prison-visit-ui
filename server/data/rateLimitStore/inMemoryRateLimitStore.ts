import RateLimitStore from './rateLimitStore'

export default class InMemoryRateLimitStore implements RateLimitStore {
  map = new Map<string, { token: string; expiry: Date }>()

  private async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    this.map.set(key, { token, expiry: new Date(Date.now() + durationSeconds * 1000) })
    return Promise.resolve()
  }

  public async incrementCount(key: string, windowSeconds: number): Promise<number> {
    if (!this.map.has(key) || this.map.get(key)!.expiry.getTime() < Date.now()) {
      await this.setToken(key, '1', windowSeconds)
      return Promise.resolve(1)
    }

    const count = parseInt(this.map.get(key)!.token, 10) + 1
    await this.setToken(key, count.toString(), windowSeconds)
    return count
  }
}
