import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitSessionsService, { VisitSessionsCalendar } from './visitSessionsService'
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

  describe('getVisitSessionsCalendar', () => {
    const fakeDate = new Date('2024-05-28')

    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return a VisitSessionsCalendar with visit sessions for prison / prisoner / visitors', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const daysAhead = 6 // the booking window 'policyNoticeDaysMax' for the prison
      const visitSessions: AvailableVisitSessionDto[] = [
        // first session after the fake start date to check we get empty dates at start
        TestData.availableVisitSessionDto({
          sessionDate: '2024-05-30',
          sessionTemplateReference: 'a',
          sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
        }),
        TestData.availableVisitSessionDto({
          sessionDate: '2024-05-31',
          sessionTemplateReference: 'b',
          sessionTimeSlot: { startTime: '09:00', endTime: '09:45' },
        }),
        TestData.availableVisitSessionDto({
          sessionDate: '2024-05-31', // second session on same day
          sessionTemplateReference: 'c',
          sessionTimeSlot: { startTime: '14:00', endTime: '15:00' },
        }),
        // next month - testing multiple months
        TestData.availableVisitSessionDto({
          sessionDate: '2024-06-02',
          sessionTemplateReference: 'd',
          sessionTimeSlot: { startTime: '09:00', endTime: '11:00' },
        }),
      ]
      orchestrationApiClient.getVisitSessions.mockResolvedValue(visitSessions)

      const expectedFirstSessionDate = '2024-05-30'
      const expectedCalendar: VisitSessionsCalendar = {
        '2024-05': {
          '2024-05-28': [],
          '2024-05-29': [],
          '2024-05-30': [{ reference: 'a', startTime: '10:00', endTime: '11:30' }],
          '2024-05-31': [
            { reference: 'b', startTime: '09:00', endTime: '09:45' },
            { reference: 'c', startTime: '14:00', endTime: '15:00' },
          ],
        },
        '2024-06': {
          '2024-06-01': [],
          '2024-06-02': [{ reference: 'd', startTime: '09:00', endTime: '11:00' }],
          '2024-06-03': [],
        },
      }

      const results = await visitSessionsService.getVisitSessionsCalendar(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
        daysAhead,
      )

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
      )
      expect(results).toStrictEqual({ calendar: expectedCalendar, firstSessionDate: expectedFirstSessionDate })
    })

    it('should return an empty VisitSessionsCalendar if no available visit sessions', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const visitSessions: AvailableVisitSessionDto[] = []
      orchestrationApiClient.getVisitSessions.mockResolvedValue(visitSessions)

      const expectedFirstSessionDate = ''
      const expectedCalendar: VisitSessionsCalendar = {}

      const results = await visitSessionsService.getVisitSessionsCalendar(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
        28,
      )

      expect(orchestrationApiClient.getVisitSessions).toHaveBeenCalledWith(
        prisoner.prisonCode,
        prisoner.prisonerNumber,
        visitorIds,
      )
      expect(results).toStrictEqual({ calendar: expectedCalendar, firstSessionDate: expectedFirstSessionDate })
    })
  })
})
