import nock from 'nock'
import config from '../config'
import BookerRegistryApiClient from './bookerRegistryApiClient'
import TestData from '../routes/testutils/testData'

describe('bookerRegistryApiClient', () => {
  let fakeBookerRegistryApi: nock.Scope
  let bookerRegistryApiClient: BookerRegistryApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakeBookerRegistryApi = nock(config.apis.bookerRegistry.url)
    bookerRegistryApiClient = new BookerRegistryApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getBookerReference', () => {
    it('should send details from One Login and receive BookerReference', async () => {
      const authDetailDto = TestData.authDetailDto()
      const bookerReference = TestData.bookerReference()

      fakeBookerRegistryApi
        .put('/register/auth', authDetailDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, bookerReference)

      const result = await bookerRegistryApiClient.getBookerReference(authDetailDto)

      expect(result).toStrictEqual(bookerReference)
    })
  })
})
