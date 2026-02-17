import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import VisitService from './visitService'
import { BookVisitJourney } from '../@types/bapv'
import { Visitor } from './bookerService'

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

  describe('Book visit journey', () => {
    const bookerReference = TestData.bookerReference().value
    const visitorOne = TestData.visitor({ visitorId: 100 })
    const visitorTwo = TestData.visitor({ visitorId: 200 })
    const visitorThree = TestData.visitor({ visitorId: 300 })

    const application = TestData.applicationDto()
    const visit = TestData.visitDto()
    const visitSession = TestData.availableVisitSessionDto()

    let bookVisitJourney: BookVisitJourney

    beforeEach(() => {
      bookVisitJourney = {
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
        mainContactPhone: '07712 000 000',
      }
    })

    describe('createVisitApplication', () => {
      it('should create and return a visit application from book visit journey data', async () => {
        orchestrationApiClient.createVisitApplication.mockResolvedValue(application)

        const results = await visitService.createVisitApplication({ bookVisitJourney, bookerReference })

        expect(orchestrationApiClient.createVisitApplication).toHaveBeenCalledWith({
          prisonerId: bookVisitJourney.prisoner.prisonerNumber,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookVisitJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookVisitJourney.selectedVisitSession.sessionDate,
          visitorIds: [100, 200],
          bookerReference,
        })
        expect(results).toStrictEqual(application)
      })
    })

    describe('changeVisitApplication', () => {
      it('should change an existing visit application to update it with book visit journey data', async () => {
        const visitContact = { name: 'Joan Phillips', telephone: '07712 000 000', email: 'user@example.com' }
        const visitors = [
          { nomisPersonId: 100, visitContact: true },
          { nomisPersonId: 200, visitContact: false },
        ]
        const visitorSupport = { description: 'wheelchair access' }

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookVisitJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookVisitJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookVisitJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookVisitJourney.selectedVisitSession.sessionDate,
          visitContact,
          visitors,
          visitorSupport,
        })
        expect(results).toStrictEqual(application)
      })

      it('should should handle a custom main contact and no phone number or email', async () => {
        bookVisitJourney.mainContact = 'Someone Else'
        bookVisitJourney.mainContactEmail = undefined
        bookVisitJourney.mainContactPhone = undefined

        const visitContact = { name: 'Someone Else' }
        const visitors = [
          { nomisPersonId: 100, visitContact: false },
          { nomisPersonId: 200, visitContact: false },
        ]
        const visitorSupport = { description: 'wheelchair access' }

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookVisitJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookVisitJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookVisitJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookVisitJourney.selectedVisitSession.sessionDate,
          visitContact,
          visitors,
          visitorSupport,
        })
        expect(results).toStrictEqual(application)
      })

      it('should handle minimal available session data', async () => {
        bookVisitJourney.visitorSupport = undefined
        bookVisitJourney.mainContact = undefined
        bookVisitJourney.mainContactEmail = undefined
        bookVisitJourney.mainContactPhone = undefined

        const visitors = [
          { nomisPersonId: 100, visitContact: false },
          { nomisPersonId: 200, visitContact: false },
        ]

        orchestrationApiClient.changeVisitApplication.mockResolvedValue(application)

        const results = await visitService.changeVisitApplication({ bookVisitJourney })

        expect(orchestrationApiClient.changeVisitApplication).toHaveBeenCalledWith({
          applicationReference: bookVisitJourney.applicationReference,
          applicationRestriction: 'OPEN',
          sessionTemplateReference: bookVisitJourney.selectedVisitSession.sessionTemplateReference,
          sessionDate: bookVisitJourney.selectedVisitSession.sessionDate,
          visitContact: undefined,
          visitors,
          visitorSupport: undefined,
        })
        expect(results).toStrictEqual(application)
      })
    })

    describe('bookVisit', () => {
      it('should book a visit from an application, including visitor ages data', async () => {
        const fakeDate = new Date('2025-10-05T09:00:00')
        jest.useFakeTimers({ now: fakeDate })

        const visitors: Visitor[] = [
          { visitorId: 1, dateOfBirth: '2025-07-01' }, // infant; age 0 years
          { visitorId: 2, dateOfBirth: '2020-10-01' }, // child; age 5 years
          { visitorId: 3, dateOfBirth: '2000-01-01' }, // adult; age 25 years
          { visitorId: 4, dateOfBirth: '' }, // missing DoB
          { visitorId: 5, dateOfBirth: null }, // missing DoB
          { visitorId: 6, dateOfBirth: undefined }, // missing DoB
        ] as Visitor[]

        orchestrationApiClient.bookVisit.mockResolvedValue(visit)

        const results = await visitService.bookVisit({
          applicationReference: bookVisitJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
          isRequestBooking: false,
          visitors,
        })

        expect(orchestrationApiClient.bookVisit).toHaveBeenCalledWith({
          applicationReference: bookVisitJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
          isRequestBooking: false,
          visitorDetails: [
            { visitorId: 1, visitorAge: 0 },
            { visitorId: 2, visitorAge: 5 },
            { visitorId: 3, visitorAge: 25 },
            { visitorId: 4, visitorAge: null },
            { visitorId: 5, visitorAge: null },
            { visitorId: 6, visitorAge: null },
          ],
        })
        expect(results).toStrictEqual(visit)

        jest.useRealTimers()
      })
    })

    describe('cancelVisit', () => {
      it('should cancel a visit for the booker', async () => {
        orchestrationApiClient.cancelVisit.mockResolvedValue()

        await visitService.cancelVisit({
          applicationReference: bookVisitJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })

        expect(orchestrationApiClient.cancelVisit).toHaveBeenCalledWith({
          applicationReference: bookVisitJourney.applicationReference,
          actionedBy: 'aaaa-bbbb-cccc',
        })
      })
    })
  })

  describe('Visit listings', () => {
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
