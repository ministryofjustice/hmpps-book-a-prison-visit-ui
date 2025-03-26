import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import PrisonService from './prisonService'

const token = 'some token'

describe('Prison service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const orchestrationApiClient = createMockOrchestrationApiClient()
  const orchestrationApiClientFactory = jest.fn()

  let prisonService: PrisonService

  beforeEach(() => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    prisonService = new PrisonService(orchestrationApiClientFactory, hmppsAuthClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSupportedPrisons', () => {
    it('should return list of supported prisons', async () => {
      const prisons = [TestData.prisonRegisterPrisonDto()]
      orchestrationApiClient.getSupportedPrisons.mockResolvedValue(prisons)

      const results = await prisonService.getSupportedPrisons()

      expect(orchestrationApiClient.getSupportedPrisons).toHaveBeenCalled()
      expect(results).toStrictEqual(prisons)
    })
  })

  describe('getPrison', () => {
    it('should return prison config for given prison code', async () => {
      const prison = TestData.prisonDto()
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      const results = await prisonService.getPrison(prison.code)

      expect(orchestrationApiClient.getPrison).toHaveBeenCalledWith(prison.code)
      expect(results).toStrictEqual(prison)
    })
  })
})
