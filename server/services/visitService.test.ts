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

  describe('Booking journey', () => {
    const bookerReference = TestData.bookerReference().value
    const visitorOne = TestData.visitor({ visitorId: 100 })
    const visitorTwo = TestData.visitor({ visitorId: 200 })
    const visitorThree = TestData.visitor({ visitorId: 300 })

    const application = TestData.applicationDto()
    const visit = TestData.visitDto()
    const orchestrationVisitDto = TestData.orchestrationVisitDto()
    const cancelledVisit = TestData.orchestrationVisitDto({
      outcomeStatus: 'ADMINISTRATIVE_CANCELLATION',
      visitStatus: 'CANCELLED',
    })
    const pastVisit = TestData.orchestrationVisitDto({
      startTimestamp: '2023-05-30T10:00:00',
      endTimestamp: '2023-05-30T11:30:00',
    })
    const visitSession = TestData.availableVisitSessionDto()

    let bookingJourney: BookingJourney

    beforeEach(() => {
      bookingJourney = {
        prisoner: TestData.prisoner(),
        prison: TestData.prisonDto(),
        allVisitors: [visitorOne, visitorTwo, visitorThree],
        selectedVisitors: [visitorOne, visitorTwo],
        allVisitSessionIds: ['2024-05-30_a'],
        allVisitSessions: [visitSession],
        selectedVisitSession: visitSession,
        applicationReference: application.reference,
        visitorSupport: 'wheelchair access',
        mainContact: { contact: visitorOne, phoneNumber: '01234 567 890' },
      }
    })

    describe('createVisitApplication', () => {
      it('should create and return a visit application from booking journey data', async () => {
        orchestrationApiClient.createVisitApplication.mockResolvedValue(application)

        const results = await visitService.createVisitApplication({ bookingJourney, bookerReference })

        expect(orchestrationApiClient.createVisitApplication).toHaveBeenCalledWith({
          prisonerId: bookingJourney.prisoner.prisonerNumber,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookingJourney.selectedVisitSession.sessionDate,
          visitorIds: [100, 200],
          bookerReference,
        })
        expect(results).toStrictEqual(application)
      })
    })

    describe('changeVisitApplication', () => {
      it('should change an existing visit application to update it with booking journey data', async () => {
        const visitContact = { name: 'Joan Phillips', telephone: '01234 567 890' }
        const visitors = [
          { nomisPersonId: 100, visitContact: true },
          { nomisPersonId: 200, visitContact: false },
        ]
        const visitorSupport = { description: 'wheelchair access' }

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookingJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookingJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookingJourney.selectedVisitSession.sessionDate,
          visitContact,
          visitors,
          visitorSupport,
        })
        expect(results).toStrictEqual(application)
      })

      it('should should handle a custom main contact and no phone number', async () => {
        bookingJourney.mainContact = { contact: 'Someone Else' }

        const visitContact = { name: 'Someone Else' }
        const visitors = [
          { nomisPersonId: 100, visitContact: false },
          { nomisPersonId: 200, visitContact: false },
        ]
        const visitorSupport = { description: 'wheelchair access' }

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookingJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookingJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookingJourney.selectedVisitSession.sessionDate,
          visitContact,
          visitors,
          visitorSupport,
        })
        expect(results).toStrictEqual(application)
      })

      it('should handle minimal available session data', async () => {
        bookingJourney.visitorSupport = undefined
        bookingJourney.mainContact = undefined

        const visitors = [
          { nomisPersonId: 100, visitContact: false },
          { nomisPersonId: 200, visitContact: false },
        ]

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookingJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookingJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookingJourney.selectedVisitSession.sessionDate,
          visitContact: undefined,
          visitors,
          visitorSupport: undefined,
        })
        expect(results).toStrictEqual(application)
      })
    })

    describe('bookVisit', () => {
      it('should book a visit from an application', async () => {
        orchestrationApiClient.bookVisit.mockResolvedValue(visit)

        const results = await visitService.bookVisit({
          applicationReference: bookingJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })

        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledWith({
          applicationReference: bookingJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })
        expect(results).toStrictEqual(visit)
      })
    })

    describe('getFuturePublicVisits', () => {
      it('should retrieve all future visits for a booker', async () => {
        orchestrationApiClient.getFuturePublicVisits.mockResolvedValue([orchestrationVisitDto])

        const results = await visitService.getFuturePublicVisits(bookerReference)

        expect(orchestrationApiClient.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([orchestrationVisitDto])
      })
    })

    describe('getCancelledPublicVisits', () => {
      it('should retrieve all cancelled visits for a booker', async () => {
        orchestrationApiClient.getCancelledPublicVisits.mockResolvedValue([cancelledVisit])

        const results = await visitService.getCancelledPublicVisits(bookerReference)

        expect(orchestrationApiClient.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([cancelledVisit])
      })
    })

    describe('getPastPublicVisits', () => {
      it('should retrieve all past visits for a booker', async () => {
        orchestrationApiClient.getPastPublicVisits.mockResolvedValue([pastVisit])

        const results = await visitService.getPastPublicVisits(bookerReference)

        expect(orchestrationApiClient.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([pastVisit])
      })
    })
  })
})
