import logger from '../../logger'
import { RateLimitConfig } from '../config'
import RateLimitStore from '../data/rateLimitStore/rateLimitStore'

export default class RateLimitService {
  constructor(
    private readonly rateLimitStore: RateLimitStore,
    private readonly config: RateLimitConfig,
  ) {}

  // Increment counter for key and return true if within limit; false if exceeded
  async incrementAndCheckLimit(key: string): Promise<boolean> {
    const { keyPrefix, maxRequests, windowSeconds } = this.config

    const count = await this.rateLimitStore.incrementCount(`${keyPrefix}:${key}`, windowSeconds)
    logger.info(`Rate limit count for ${keyPrefix} ${key} is ${count}`)

    return count <= maxRequests
  }
}
