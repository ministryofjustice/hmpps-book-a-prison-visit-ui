import type { RedisClient } from '../redisClient'

import { DataCache } from './dataCache'

export default class RedisDataCache implements DataCache {
  private readonly prefix = 'dataCache:'

  constructor(private readonly client: RedisClient) {}

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async set<DataType>(key: string, data: DataType, durationSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(`${this.prefix}${key}`, JSON.stringify(data), { EX: durationSeconds })
  }

  public async get<DataType>(key: string): Promise<DataType | null> {
    await this.ensureConnected()
    const result = await this.client.get(`${this.prefix}${key}`)
    try {
      return typeof result === 'string' ? <DataType>JSON.parse(result) : null
    } catch {
      return null
    }
  }
}
