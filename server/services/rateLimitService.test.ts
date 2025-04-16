import { TokenStore } from '../data/tokenStore/tokenStore'
import RateLimitService from './rateLimitService'
import logger from '../../logger'
import { RateLimitConfig } from '../config'

jest.mock('../../logger')

let rateLimitService: RateLimitService

const rateLimitStore = {
  incrementCount: jest.fn(),
} as unknown as jest.Mocked<TokenStore>

const rateLimitConfig: RateLimitConfig = {
  keyPrefix: 'prisoner',
  maxRequests: 5,
  windowSeconds: 30,
}

describe('Rate limit service', () => {
  beforeEach(() => {
    rateLimitService = new RateLimitService(rateLimitStore, rateLimitConfig)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should call store to increment count and return true if within limit', async () => {
    rateLimitStore.incrementCount.mockResolvedValue(rateLimitConfig.maxRequests)

    const result = await rateLimitService.incrementAndCheckLimit('key-1')

    expect(result).toBe(true)
    expect(rateLimitStore.incrementCount).toHaveBeenCalledWith('prisoner:key-1', 30)
    expect(logger.info).toHaveBeenCalledWith('Rate limit count for prisoner key-1 is 5')
  })

  it('should call store to increment count and return false if limit exceeded', async () => {
    rateLimitStore.incrementCount.mockResolvedValue(rateLimitConfig.maxRequests + 1)

    const result = await rateLimitService.incrementAndCheckLimit('key-1')

    expect(result).toBe(false)
    expect(rateLimitStore.incrementCount).toHaveBeenCalledWith('prisoner:key-1', 30)
    expect(logger.info).toHaveBeenCalledWith('Rate limit count for prisoner key-1 is 6')
  })
})
