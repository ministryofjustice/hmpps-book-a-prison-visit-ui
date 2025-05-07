import type { RedisClient } from '../redisClient'

import logger from '../../../logger'
import { TokenStore, TokenStorePrefix } from './tokenStore'

export default class RedisTokenStore implements TokenStore {
  constructor(
    private readonly client: RedisClient,
    private readonly prefix: TokenStorePrefix,
  ) {
    client.on('error', error => {
      logger.error(error, `Redis error`)
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(`${this.prefix}:${key}`, token, { EX: durationSeconds })
  }

  public async getToken(key: string): Promise<string> {
    await this.ensureConnected()
    const result = await this.client.get(`${this.prefix}:${key}`)
    return Buffer.isBuffer(result) ? result.toString() : result
  }

  public async incrementCount(key: string, windowSeconds: number): Promise<number> {
    await this.ensureConnected()
    const prefixedKey = `${this.prefix}:${key}`
    const count = await this.client.incr(prefixedKey)
    await this.client.expire(prefixedKey, windowSeconds)
    return typeof count === 'number' ? count : parseInt(count, 10)
  }
}
