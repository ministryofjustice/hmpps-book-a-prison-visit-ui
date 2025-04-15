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
    return this.client.get(`${this.prefix}:${key}`)
  }
}
