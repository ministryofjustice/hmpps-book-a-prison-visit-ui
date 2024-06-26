import BookerService, { Visitor } from './bookerService'
import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'

const token = 'some token'

describe('Booker service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const orchestrationApiClient = createMockOrchestrationApiClient()
  const orchestrationApiClientFactory = jest.fn()

  let bookerService: BookerService

  beforeEach(() => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    bookerService = new BookerService(orchestrationApiClientFactory, hmppsAuthClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getBookerReference', () => {
    it('should return booker reference for given AuthDetailDto', async () => {
      const authDetailDto = TestData.authDetailDto()
      const bookerReference = TestData.bookerReference()
      orchestrationApiClient.getBookerReference.mockResolvedValue(bookerReference)

      const result = await bookerService.getBookerReference(authDetailDto)

      expect(orchestrationApiClient.getBookerReference).toHaveBeenCalledWith(authDetailDto)
      expect(result).toBe(bookerReference.value)
    })
  })

  describe('getPrisoners', () => {
    it('should return prisoners for the given booker reference, with sequential display ID added', async () => {
      const bookerReference = TestData.bookerReference()
      const prisonerInfoDtos = [TestData.prisonerInfoDto(), TestData.prisonerInfoDto({ prisonerNumber: 'A9999AB' })]
      const prisoners = [TestData.prisoner(), TestData.prisoner({ prisonerNumber: 'A9999AB', prisonerDisplayId: 2 })]

      orchestrationApiClient.getPrisoners.mockResolvedValue(prisonerInfoDtos)

      const results = await bookerService.getPrisoners(bookerReference.value)

      expect(orchestrationApiClient.getPrisoners).toHaveBeenCalledWith(bookerReference.value)
      expect(results).toStrictEqual(prisoners)
    })
  })

  describe('getVisitors', () => {
    it('should return visitors for the given booker reference and prisoner number, with sequential display ID and adult (boolean) added', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.prisonerInfoDto()
      const visitorInfoDtos = [
        TestData.visitorInfoDto({ visitorId: 100, dateOfBirth: '2000-01-01' }), // an adult
        TestData.visitorInfoDto({ visitorId: 200, dateOfBirth: `${new Date().getFullYear() - 2}-01-01` }), // a child
      ]
      const visitors: Visitor[] = [
        { ...visitorInfoDtos[0], visitorDisplayId: 1, adult: true },
        { ...visitorInfoDtos[1], visitorDisplayId: 2, adult: false },
      ]

      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const results = await bookerService.getVisitors(bookerReference.value, prisonerNumber)

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
      expect(results).toStrictEqual(visitors)
    })
  })
})
