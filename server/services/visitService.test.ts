import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitService from './visitService'
import { BookingJourney } from '../@types/bapv'

const token = 'some token'

jest.mock('crypto', () => {
  return {
    randomUUID: () => 'uuidv4-1',
  }
})

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
    const visitSession = TestData.availableVisitSessionDto()

    let bookingJourney: BookingJourney

    beforeEach(() => {
      bookingJourney = {
        prisoner: TestData.prisoner(),
        prison: TestData.prisonDto(),
        eligibleVisitors: [visitorOne, visitorTwo, visitorThree],
        selectedVisitors: [visitorOne, visitorTwo],
        allVisitSessionIds: ['2024-05-30_a'],
        allVisitSessions: [visitSession],
        selectedVisitSession: visitSession,
        applicationReference: application.reference,
        visitorSupport: 'wheelchair access',
        mainContact: visitorOne,
        mainContactEmail: 'user@example.com',
        mainContactPhone: '07700 900 000',
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
        const visitContact = { name: 'Joan Phillips', telephone: '07700 900 000', email: 'user@example.com' }
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

      it('should should handle a custom main contact and no phone number or email', async () => {
        bookingJourney.mainContact = 'Someone Else'
        bookingJourney.mainContactEmail = undefined
        bookingJourney.mainContactPhone = undefined

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
        bookingJourney.mainContactEmail = undefined
        bookingJourney.mainContactPhone = undefined

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

    describe('cancelVisit', () => {
      it('should cancel a visit for the booker', async () => {
        orchestrationApiClient.cancelVisit.mockResolvedValue()

        await visitService.cancelVisit({
          applicationReference: bookingJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })

        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledWith({
          applicationReference: bookingJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })
      })
    })
  })

  describe('Booking listings', () => {
    const bookerReference = TestData.bookerReference().value

    describe('getFuturePublicVisits', () => {
      it('should retrieve all future visits for a booker', async () => {
        const orchestrationVisitDto = TestData.orchestrationVisitDto()
        const expectedVisitDetails = TestData.visitDetails({ ...orchestrationVisitDto })
        orchestrationApiClient.getFuturePublicVisits.mockResolvedValue([orchestrationVisitDto])

        const results = await visitService.getFuturePublicVisits(bookerReference)

        expect(orchestrationApiClient.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([expectedVisitDetails])
      })
    })

    describe('getPastPublicVisits', () => {
      it('should retrieve all past visits for a booker', async () => {
        const pastVisit = TestData.orchestrationVisitDto()
        const expectedVisitDetails = TestData.visitDetails({ ...pastVisit })
        orchestrationApiClient.getPastPublicVisits.mockResolvedValue([pastVisit])

        const results = await visitService.getPastPublicVisits(bookerReference)

        expect(orchestrationApiClient.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([expectedVisitDetails])
      })
    })

    describe('getCancelledPublicVisits', () => {
      it('should retrieve all cancelled visits for a booker', async () => {
        const cancelledVisit = TestData.orchestrationVisitDto({
          outcomeStatus: 'ADMINISTRATIVE_CANCELLATION',
          visitStatus: 'CANCELLED',
        })
        const expectedVisitDetails = TestData.visitDetails({ ...cancelledVisit })
        orchestrationApiClient.getCancelledPublicVisits.mockResolvedValue([cancelledVisit])

        const results = await visitService.getCancelledPublicVisits(bookerReference)

        expect(orchestrationApiClient.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)
        expect(results).toStrictEqual([expectedVisitDetails])
      })
    })
  })
})
