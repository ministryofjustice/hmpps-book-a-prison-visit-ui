import SupportedPrisonsService from './supportedPrisonsService'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import TestData from '../routes/testutils/testData'

const token = 'some token'

describe('Supported prisons service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()
  const orchestrationApiClient = createMockOrchestrationApiClient()

  let supportedPrisonsService: SupportedPrisonsService

  const OrchestrationApiClientFactory = jest.fn()

  const supportedPrisonIds = TestData.supportedPrisonIds()

  beforeEach(() => {
    OrchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    supportedPrisonsService = new SupportedPrisonsService(OrchestrationApiClientFactory, hmppsAuthClient)

    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSupportedPrisonIds', () => {
    it('should return an array of supported prison IDs', async () => {
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(supportedPrisonIds)

      const results = await supportedPrisonsService.getSupportedPrisonIds()

      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(supportedPrisonIds)
    })
  })
})
