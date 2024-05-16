import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitSessionsService from './visitSessionsService'
import { AvailableVisitSessionDto } from '../data/orchestrationApiTypes'

const token = 'some token'

describe('Visit sessions service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const orchestrationApiClient = createMockOrchestrationApiClient()
  const orchestrationApiClientFactory = jest.fn()

  let visitSessionsService: VisitSessionsService

  beforeEach(() => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    visitSessionsService = new VisitSessionsService(orchestrationApiClientFactory, hmppsAuthClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVisitSessions', () => {
    it('should return available visit sessions for prison / prisoner / visitors', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const visitSessions: AvailableVisitSessionDto[] = [TestData.availableVisitSessionDto()]
      orchestrationApiClient.getVisitSessions.mockResolvedValue(visitSessions)

      const results = await visitSessionsService.getVisitSessions(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
      )

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
      )
      expect(results).toStrictEqual(visitSessions)
    })
  })
})
