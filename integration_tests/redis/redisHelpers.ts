/* eslint-disable no-await-in-loop */
import logger from '../../logger'
import { createRedisClient } from '../../server/data/redisClient'

const rateLimitKeyPattern = 'rateLimit:*'

const clearRateLimits = async () => {
  const client = createRedisClient()
  await client.connect()

  const keys = await client.keys(rateLimitKeyPattern)

  if (keys.length > 0) {
    await client.del(keys)
    logger.info('Rate limits cleared')
  }

  await client.quit()
  return Promise.resolve(null)
}

const waitUntilRateLimitsExpire = async () => {
  const maxRetries = 20
  const retryInterval = 500 // ms

  const client = createRedisClient()
  await client.connect()

  let retries = 0
  while (retries < maxRetries) {
    const keys = await client.keys(rateLimitKeyPattern)

    if (keys.length === 0) {
      logger.info('Rate limits expired')
      break
    }

    await new Promise(resolve => {
      setTimeout(resolve, retryInterval)
    })

    retries += 1
    logger.info(`Waiting for rate limits to expire: retry ${retries}`)
  }

  await client.quit()
  return null
}

export default { clearRateLimits, waitUntilRateLimitsExpire }
