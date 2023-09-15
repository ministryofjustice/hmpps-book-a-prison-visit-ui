import nock from 'nock'
import config from '../config'
import OrchestrationApiClient from './orchestrationApiClient'

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

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      const results = ['HEI', 'BLI']

      fakeOrchestrationApi
        .get('/config/prisons/supported')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await orchestrationApiClient.getSupportedPrisonIds()

      expect(output).toEqual(results)
    })
  })
})
