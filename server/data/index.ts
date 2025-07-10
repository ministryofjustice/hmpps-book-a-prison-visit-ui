/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import OrchestrationApiClient from './orchestrationApiClient'
import tokenStoreFactory from './tokenStore/tokenStoreFactory'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import config from '../config'
import { createRedisClient, RedisClient } from './redisClient'
import { DataCache } from './dataCache/dataCache'
import InMemoryDataCache from './dataCache/inMemoryDataCache'
import RedisDataCache from './dataCache/redisDataCache'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => {
  let redisClient: RedisClient
  if (config.redis.enabled) {
    redisClient = createRedisClient()
  }
  const dataCache = config.redis.enabled ? new RedisDataCache(redisClient) : new InMemoryDataCache()

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
