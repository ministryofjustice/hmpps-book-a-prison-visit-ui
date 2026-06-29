import HmppsAuthClient from './hmppsAuthClient'
import OrchestrationApiClient from './orchestrationApiClient'
import tokenStoreFactory from './tokenStore/tokenStoreFactory'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import config from '../config'
import { createRedisClient } from './redisClient'
import { DataCache } from './dataCache/dataCache'
import InMemoryDataCache from './dataCache/inMemoryDataCache'
import RedisDataCache from './dataCache/redisDataCache'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => {
  const dataCache = config.redis.enabled ? new RedisDataCache(createRedisClient()) : new InMemoryDataCache()

  return {
    applicationInfo,
    dataCache,
    hmppsAuthClient: new HmppsAuthClient(tokenStoreFactory('systemToken')), // TODO refactor to use redis client defined above
    orchestrationApiClientBuilder: ((token: string) =>
      new OrchestrationApiClient(token)) as RestClientBuilder<OrchestrationApiClient>,
    prisonRegisterApiClientBuilder: ((token: string) =>
      new PrisonRegisterApiClient(token)) as RestClientBuilder<PrisonRegisterApiClient>,
    rateLimitStore: tokenStoreFactory('rateLimit'),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export { type DataCache, HmppsAuthClient, OrchestrationApiClient, PrisonRegisterApiClient, type RestClientBuilder }
