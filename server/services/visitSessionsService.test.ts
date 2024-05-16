import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitSessionsService from './visitSessionsService'
import { AvailableVisitSessionDto } from '../data/orchestrationApiTypes'
import { VisitSessionsCalendar } from '../@types/bapv'

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
    const fakeDate = new Date('2024-05-25')

    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return a VisitSessionsCalendar with visit sessions for prison / prisoner / visitors', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const daysAhead = 10 // the booking window 'policyNoticeDaysMax' for the prison
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
          sessionDate: '2024-06-03',
          sessionTemplateReference: 'd',
          sessionTimeSlot: { startTime: '09:00', endTime: '11:00' },
        }),
      ]
      orchestrationApiClient.getVisitSessions.mockResolvedValue(visitSessions)

      const expectedVisitSessionsCalendar: VisitSessionsCalendar = {
        selectedDate: '2024-05-30',
        months: {
          'May 2024': {
            startDayColumn: 6, // first day is a Saturday; sixth calendar day column
            dates: {
              '2024-05-25': [],
              '2024-05-26': [],
              '2024-05-27': [],
              '2024-05-28': [],
              '2024-05-29': [],
              '2024-05-30': [{ reference: 'a', time: '10am to 11:30am', duration: '1 hour and 30 minutes' }],
              '2024-05-31': [
                { reference: 'b', time: '9am to 9:45am', duration: '45 minutes' },
                { reference: 'c', time: '2pm to 3pm', duration: '1 hour' },
              ],
            },
          },
          'June 2024': {
            startDayColumn: 6,
            dates: {
              '2024-06-01': [],
              '2024-06-02': [],
              '2024-06-03': [{ reference: 'd', time: '9am to 11am', duration: '2 hours' }],
              '2024-06-04': [],
            },
          },
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
      expect(results).toStrictEqual(expectedVisitSessionsCalendar)
    })

    // TODO add tests to cover different startDayColumn values (mon / sun) and year boundary

    it('should return an empty VisitSessionsCalendar if no available visit sessions', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const visitSessions: AvailableVisitSessionDto[] = []
      orchestrationApiClient.getVisitSessions.mockResolvedValue(visitSessions)

      const expectedVisitSessionsCalendar: VisitSessionsCalendar = {
        selectedDate: '',
        months: {},
      }

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
      expect(results).toStrictEqual(expectedVisitSessionsCalendar)
    })
  })
})
