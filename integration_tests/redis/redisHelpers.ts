/* eslint-disable no-await-in-loop */
import { createRedisClient } from '../../server/data/redisClient'

const rateLimitKeyPattern = 'rateLimit:*'

const clearRateLimits = async () => {
  const client = createRedisClient()
  await client.connect()

  const keys = await client.keys(rateLimitKeyPattern)

  if (keys.length > 0) {
    await client.del(keys)
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
      break
    }

    await new Promise(resolve => {
      setTimeout(resolve, retryInterval)
    })

    retries += 1
  }

  await client.quit()
  return null
}

export default { clearRateLimits, waitUntilRateLimitsExpire }
