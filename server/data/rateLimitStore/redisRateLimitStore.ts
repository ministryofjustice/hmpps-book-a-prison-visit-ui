import type { RedisClient } from '../redisClient'

import logger from '../../../logger'
import RateLimitStore from './rateLimitStore'

export default class RedisRateLimitStore implements RateLimitStore {
  private readonly prefix = 'rateLimit:'

  constructor(private readonly client: RedisClient) {
    client.on('error', error => {
      logger.error(error, `Redis error`)
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async incrementCount(key: string, windowSeconds: number): Promise<number> {
    await this.ensureConnected()
    const prefixedKey = `${this.prefix}${key}`
    const count = await this.client.incr(prefixedKey)
    await this.client.expire(prefixedKey, windowSeconds)
    return count
  }
}
