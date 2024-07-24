import config from '../../config'
import { createRedisClient } from '../redisClient'
import InMemoryTokenStore from './inMemoryTokenStore'
import RedisTokenStore from './redisTokenStore'
import TokenStore from './tokenStore'

let inMemoryTokenStore: InMemoryTokenStore

const tokenStoreFactory = (prefix: string): TokenStore => {
  if (config.redis.enabled) {
    return new RedisTokenStore(createRedisClient(), prefix)
  }

  inMemoryTokenStore = new InMemoryTokenStore()
  return inMemoryTokenStore
}

export default tokenStoreFactory
