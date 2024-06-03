import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitService from './visitService'
import { BookingJourney } from '../@types/bapv'

const token = 'some token'

describe('Visit service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const orchestrationApiClient = createMockOrchestrationApiClient()
  const orchestrationApiClientFactory = jest.fn()

  let visitService: VisitService

  beforeEach(() => {
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    visitService = new VisitService(orchestrationApiClientFactory, hmppsAuthClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createVisitApplication', () => {
    const bookerReference = TestData.bookerReference().value
    const visitorOne = TestData.visitor({ visitorId: 100 })
    const visitorTwo = TestData.visitor({ visitorId: 200 })
    const bookingJourney: BookingJourney = {
      prisoner: TestData.prisoner(),
      prison: TestData.prisonDto(),
      allVisitors: [visitorOne, visitorTwo],
      selectedVisitors: [visitorOne, visitorTwo],
      allVisitSessionIds: ['2024-05-30_a'],
      sessionRestriction: 'OPEN',
      selectedSessionDate: '2024-05-30',
      selectedSessionTemplateReference: 'a',
    }

    it('should create and return a visit application from booking journey data', async () => {
      const application = TestData.applicationDto()
      orchestrationApiClient.createVisitApplication.mockResolvedValue(application)

      const results = await visitService.createVisitApplication({ bookingJourney, bookerReference })

      expect(orchestrationApiClient.createVisitApplication).toHaveBeenCalledWith({
        prisonerId: bookingJourney.prisoner.prisonerNumber,
        sessionTemplateReference: bookingJourney.selectedSessionTemplateReference,
        sessionDate: bookingJourney.selectedSessionDate,
        applicationRestriction: bookingJourney.sessionRestriction,
        visitorIds: [100, 200],
        bookerReference,
      })
      expect(results).toStrictEqual(application)
    })
  })
})
