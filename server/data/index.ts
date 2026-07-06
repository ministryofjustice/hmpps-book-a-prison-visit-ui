import HmppsAuthClient from './hmppsAuthClient'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import config from '../config'
import { createRedisClient } from './redisClient'
import { DataCache } from './dataCache/dataCache'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import InMemoryDataCache from './dataCache/inMemoryDataCache'
import RedisDataCache from './dataCache/redisDataCache'
import InMemoryRateLimitStore from './rateLimitStore/inMemoryRateLimitStore'
import RedisRateLimitStore from './rateLimitStore/redisRateLimitStore'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

type RestClientBuilder<T> = (token: string) => T

const redisClient = config.redis.enabled ? createRedisClient() : null

export const dataAccess = () => ({
  applicationInfo,
  dataCache: config.redis.enabled ? new RedisDataCache(redisClient!) : new InMemoryDataCache(),
  hmppsAuthClient: new HmppsAuthClient(
    config.redis.enabled ? new RedisTokenStore(redisClient!) : new InMemoryTokenStore(),
  ),
  orchestrationApiClientBuilder: ((token: string) =>
    new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
  prisonRegisterApiClientBuilder: ((token: string) =>
    new PrisonRegisterApiClient(token)) as RestClientBuilder<PrisonRegisterApiClient>,
  rateLimitStore: config.redis.enabled ? new RedisRateLimitStore(redisClient!) : new InMemoryRateLimitStore(),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { type DataCache, HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, type RestClientBuilder }
