import config from '../../config'
import { createRedisClient } from '../redisClient'
import InMemoryTokenStore from './inMemoryTokenStore'
import RedisTokenStore from './redisTokenStore'
import { TokenStore, TokenStorePrefix } from './tokenStore'

const tokenStoreFactory = (prefix: TokenStorePrefix): TokenStore => {
  if (config.redis.enabled) {
    return new RedisTokenStore(createRedisClient(), prefix)
  }

  return new InMemoryTokenStore()
}

export default tokenStoreFactory
