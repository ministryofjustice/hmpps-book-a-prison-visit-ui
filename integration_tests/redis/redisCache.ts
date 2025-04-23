import { createRedisClient } from '../../server/data/redisClient'

const clearRateLimits = async () => {
  const client = createRedisClient()
  await client.connect()

  const keys = await client.keys('rateLimit:*')

  if (keys.length > 0) {
    await client.del(keys)
  }

  await client.quit()
  return Promise.resolve(null)
}

export default { clearRateLimits }
