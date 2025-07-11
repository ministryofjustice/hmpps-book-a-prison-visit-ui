import TestData from '../routes/testutils/testData'
import {
  createMockDataCache,
  createMockHmppsAuthClient,
  createMockOrchestrationApiClient,
  createMockPrisonRegisterApiClient,
} from '../data/testutils/mocks'
import PrisonService from './prisonService'

const token = 'some token'

describe('Prison service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const dataCache = createMockDataCache()
  const orchestrationApiClient = createMockOrchestrationApiClient()
  const prisonRegisterApiClient = createMockPrisonRegisterApiClient()
  const orchestrationApiClientFactory = jest.fn()
  const prisonRegisterApiClientFactory = jest.fn()

  let prisonService: PrisonService

  beforeEach(() => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    prisonRegisterApiClientFactory.mockReturnValue(prisonRegisterApiClient)

    prisonService = new PrisonService(
      orchestrationApiClientFactory,
      prisonRegisterApiClientFactory,
      hmppsAuthClient,
      dataCache,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAllPrisonNames', () => {
    it('should return all prison names if cache hit', async () => {
      const prisonNames = TestData.prisonNameDtos()
      dataCache.get.mockResolvedValue(prisonNames)

      expect(await prisonService.getAllPrisonNames()).toStrictEqual(prisonNames)

      expect(dataCache.get).toHaveBeenCalledWith('prisonNames')
      expect(dataCache.set).not.toHaveBeenCalled()
      expect(prisonRegisterApiClient.getPrisonNames).not.toHaveBeenCalled()
    })

    it('should return all prison names and save to cache if a cache miss', async () => {
      const prisonNames = TestData.prisonNameDtos()
      dataCache.get.mockResolvedValue(null)
      prisonRegisterApiClient.getPrisonNames.mockResolvedValue(prisonNames)

      expect(await prisonService.getAllPrisonNames()).toStrictEqual(prisonNames)

      expect(dataCache.get).toHaveBeenCalledWith('prisonNames')
      expect(dataCache.set).toHaveBeenCalledWith('prisonNames', prisonNames, 86400) // 24 hours
      expect(prisonRegisterApiClient.getPrisonNames).toHaveBeenCalled()
    })
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
    it('should return prison config for given prison code if cache hit', async () => {
      const prison = TestData.prisonDto()
      dataCache.get.mockResolvedValue(prison)

      expect(await prisonService.getPrison(prison.code)).toStrictEqual(prison)

      expect(dataCache.get).toHaveBeenCalledWith(`prison:${prison.code}`)
      expect(dataCache.set).not.toHaveBeenCalled()
      expect(orchestrationApiClient.getPrison).not.toHaveBeenCalled()
    })

    it('should return prison config for given prison code and save to cache if a cache miss', async () => {
      const prison = TestData.prisonDto()
      dataCache.get.mockResolvedValue(null)
      orchestrationApiClient.getPrison.mockResolvedValue(prison)

      expect(await prisonService.getPrison(prison.code)).toStrictEqual(prison)

      expect(dataCache.get).toHaveBeenCalledWith(`prison:${prison.code}`)
      expect(dataCache.set).toHaveBeenCalledWith(`prison:${prison.code}`, prison, 300) // 5 mins
      expect(orchestrationApiClient.getPrison).toHaveBeenCalled()
    })
  })

  describe('isSupportedPrison', () => {
    it('should return if prison is supported if cache hit', async () => {
      const prisonIds = TestData.prisonIds()
      dataCache.get.mockResolvedValue(prisonIds)

      expect(await prisonService.isSupportedPrison('HEI')).toBe(true)
      expect(await prisonService.isSupportedPrison('XYZ')).toBe(false)

      expect(dataCache.get).toHaveBeenCalledWith('supportedPrisonIds')
      expect(dataCache.set).not.toHaveBeenCalled()
      expect(orchestrationApiClient.getSupportedPrisonIds).not.toHaveBeenCalled()
    })

    it('should return if prison is supported and store prison IDs if cache miss', async () => {
      const prisonIds = TestData.prisonIds()
      dataCache.get.mockResolvedValue(null)
      orchestrationApiClient.getSupportedPrisonIds.mockResolvedValue(prisonIds)

      expect(await prisonService.isSupportedPrison('HEI')).toBe(true)
      expect(await prisonService.isSupportedPrison('XYZ')).toBe(false)

      expect(dataCache.get).toHaveBeenCalledWith('supportedPrisonIds')
      expect(dataCache.set).toHaveBeenCalledWith('supportedPrisonIds', prisonIds, 300)
      expect(orchestrationApiClient.getSupportedPrisonIds).toHaveBeenCalled()
    })
  })
})
