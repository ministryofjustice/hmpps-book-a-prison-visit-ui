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
    it('should send details received from One Login to retrieve BookerReference', async () => {
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

  describe('getPrisoners', () => {
    it('should retrieve prisoners associated with a booker', async () => {
      const bookerReference = TestData.bookerReference()
      const prisoners = [TestData.prisonerInfoDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/prisoners`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisoners)

      const result = await orchestrationApiClient.getPrisoners(bookerReference.value)

      expect(result).toStrictEqual(prisoners)
    })
  })

  describe('getVisitors', () => {
    it('should retrieve visitors associated with a booker and prisoner', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.prisonerInfoDto()
      const visitors = [TestData.visitorInfoDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/prisoners/${prisonerNumber}/visitors`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitors)

      const result = await orchestrationApiClient.getVisitors(bookerReference.value, prisonerNumber)

      expect(result).toStrictEqual(visitors)
    })
  })
})
