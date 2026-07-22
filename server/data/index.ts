import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import OrchestrationApiClient from './orchestrationApiClient'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import config from '../config'
import { createRedisClient } from './redisClient'
import { DataCache } from './dataCache/dataCache'
import InMemoryDataCache from './dataCache/inMemoryDataCache'
import RedisDataCache from './dataCache/redisDataCache'
import InMemoryRateLimitStore from './rateLimitStore/inMemoryRateLimitStore'
import RedisRateLimitStore from './rateLimitStore/redisRateLimitStore'
import applicationInfoSupplier from '../applicationInfo'
import logger from '../../logger'

const applicationInfo = applicationInfoSupplier()
const redisClient = config.redis.enabled ? createRedisClient() : null
const hmppsAuthClient = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)

export const dataAccess = () => ({
  applicationInfo,
  dataCache: config.redis.enabled ? new RedisDataCache(redisClient!) : new InMemoryDataCache(),
  hmppsAuthClient,
  orchestrationApiClient: new OrchestrationApiClient(hmppsAuthClient),
  prisonRegisterApiClient: new PrisonRegisterApiClient(hmppsAuthClient),
  rateLimitStore: config.redis.enabled ? new RedisRateLimitStore(redisClient!) : new InMemoryRateLimitStore(),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { type DataCache, AuthenticationClient, OrchestrationApiClient, PrisonRegisterApiClient }
