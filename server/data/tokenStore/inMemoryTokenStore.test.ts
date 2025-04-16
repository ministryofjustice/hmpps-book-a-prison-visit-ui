import TokenStore from './inMemoryTokenStore'

describe('inMemoryTokenStore', () => {
  let tokenStore: TokenStore

  beforeEach(() => {
    tokenStore = new TokenStore()
  })

  it('Can store and retrieve token', async () => {
    await tokenStore.setToken('user-1', 'token-1', 10)
    expect(await tokenStore.getToken('user-1')).toBe('token-1')
  })

  it('Expires token', async () => {
    await tokenStore.setToken('user-2', 'token-2', -1)
    expect(await tokenStore.getToken('user-2')).toBe(null)
  })

  it('Increments counter and returns count', async () => {
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(1)
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(2)
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(3)
  })

  it('Expires counter', async () => {
    jest.useFakeTimers()
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(1)
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(2)

    // after 10 seconds, counter should have reset
    jest.advanceTimersByTime(10001)
    expect(await tokenStore.incrementCount('key-1', 10)).toBe(1)
    jest.useRealTimers()
  })
})
