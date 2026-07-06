import { RedisClient } from '../redisClient'
import RateLimitStore from './redisRateLimitStore'

const redisClient = {
  incr: jest.fn(),
  expire: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  isOpen: true,
} as unknown as jest.Mocked<RedisClient>

describe('redisRateLimitStore', () => {
  let rateLimitStore: RateLimitStore

  beforeEach(() => {
    rateLimitStore = new RateLimitStore(redisClient as unknown as RedisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('increment count', () => {
    it('Can increment count', async () => {
      await rateLimitStore.incrementCount('key-1', 60)

      expect(redisClient.incr).toHaveBeenCalledWith('rateLimit:key-1')
      expect(redisClient.expire).toHaveBeenCalledWith('rateLimit:key-1', 60)
    })

    it('Connects when no connection calling increment count', async () => {
      ;(redisClient as unknown as Record<string, boolean>).isOpen = false

      await rateLimitStore.incrementCount('key-1', 60)

      expect(redisClient.connect).toHaveBeenCalledWith()
    })
  })
})
