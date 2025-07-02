import config from '../../config'
import { createRedisClient, RedisClient } from '../redisClient'
import InMemoryTokenStore from './inMemoryTokenStore'
import RedisTokenStore from './redisTokenStore'
import { TokenStore, TokenStorePrefix } from './tokenStore'

let redisClient: RedisClient

const tokenStoreFactory = (prefix: TokenStorePrefix): TokenStore => {
  if (config.redis.enabled) {
    if (!redisClient) {
      redisClient = createRedisClient()
    }
    return new RedisTokenStore(redisClient, prefix)
  }

  return new InMemoryTokenStore()
}

export default tokenStoreFactory
