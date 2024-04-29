import nock from 'nock'
import config from '../config'
import OrchestrationApiClient from './orchestrationApiClient'
import TestData from '../routes/testutils/testData'

describe('orchestrationApiClient', () => {
  let fakeOrchestrationApi: nock.Scope
  let orchestrationApiClient: OrchestrationApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakeOrchestrationApi = nock(config.apis.orchestration.url)
    orchestrationApiClient = new OrchestrationApiClient(token)
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

      fakeOrchestrationApi
        .put('/public/booker/register/auth', authDetailDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, bookerReference)

      const result = await orchestrationApiClient.getBookerReference(authDetailDto)

      expect(result).toStrictEqual(bookerReference)
    })
  })
})
