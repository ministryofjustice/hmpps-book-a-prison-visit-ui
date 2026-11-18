import RateLimitStore from './inMemoryRateLimitStore'

describe('inMemoryRateLimitStore', () => {
  let rateLimitStore: RateLimitStore

  beforeEach(() => {
    rateLimitStore = new RateLimitStore()
  })

  it('Increments counter and returns count', async () => {
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(1)
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(2)
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(3)
  })

  it('Expires counter', async () => {
    jest.useFakeTimers()
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(1)
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(2)

    // after 10 seconds, counter should have reset
    jest.advanceTimersByTime(10001)
    expect(await rateLimitStore.incrementCount('key-1', 10)).toBe(1)
    jest.useRealTimers()
  })
})
