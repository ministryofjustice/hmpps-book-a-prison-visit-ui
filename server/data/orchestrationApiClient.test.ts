import nock from 'nock'
import config from '../config'
import OrchestrationApiClient, { SessionRestriction } from './orchestrationApiClient'
import TestData from '../routes/testutils/testData'
import {
  ApplicationDto,
  AvailableVisitSessionDto,
  AvailableVisitSessionRestrictionDto,
  BookerVisitorRequestValidationErrorResponse,
  BookingOrchestrationRequestDto,
  CancelVisitOrchestrationDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  VisitDto,
} from './orchestrationApiTypes'

describe('orchestrationApiClient', () => {
  let fakeOrchestrationApi: nock.Scope
  let orchestrationApiClient: OrchestrationApiClient
  const token = 'token-1'
  const bookerReference = TestData.bookerReference()

  beforeEach(() => {
    fakeOrchestrationApi = nock(config.apis.orchestration.url)
    orchestrationApiClient = new OrchestrationApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('bookVisit', () => {
    it('should book a visit from an application', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const requestBody: BookingOrchestrationRequestDto = {
        applicationMethodType: 'WEBSITE',
        allowOverBooking: false,
        actionedBy: bookerReference.value,
        userType: 'PUBLIC',
        isRequestBooking: false,
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
      }

      const result = { reference: 'ab-cd-ef-gh' } as Partial<VisitDto>

      fakeOrchestrationApi
        .put(`/visits/${applicationReference}/book`, requestBody)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.bookVisit({
        applicationReference,
        actionedBy: bookerReference.value,
        isRequestBooking: false,
        visitorDetails: [{ visitorId: 1, visitorAge: 18 }],
      })

      expect(output).toStrictEqual(result)
    })
  })

  describe('cancelVisit', () => {
    it('should cancel a visit for the booker', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const requestBody: CancelVisitOrchestrationDto = {
        cancelOutcome: {
          outcomeStatus: 'BOOKER_CANCELLED',
        },
        applicationMethodType: 'WEBSITE',
        actionedBy: bookerReference.value,
        userType: 'PUBLIC',
      }

      fakeOrchestrationApi
        .put(`/visits/${applicationReference}/cancel`, requestBody)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      await orchestrationApiClient.cancelVisit({
        applicationReference,
        actionedBy: bookerReference.value,
      })

      expect(fakeOrchestrationApi.isDone()).toBe(true)
    })
  })

  describe('getFuturePublicVisits', () => {
    it('should retrieve all future visits associated with a booker', async () => {
      const visits = [TestData.orchestrationVisitDto({ outcomeStatus: null })]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/visits/booked/future`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visits)

      const result = await orchestrationApiClient.getFuturePublicVisits(bookerReference.value)

      expect(result).toStrictEqual(visits)
    })
  })

  describe('getCancelledPublicVisits', () => {
    it('should retrieve all cancelled visits associated with a booker', async () => {
      const visits = [TestData.orchestrationVisitDto({ outcomeStatus: null })]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/visits/cancelled`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visits)

      const result = await orchestrationApiClient.getCancelledPublicVisits(bookerReference.value)

      expect(result).toStrictEqual(visits)
    })
  })

  describe('getPastPublicVisits', () => {
    it('should retrieve all past visits associated with a booker', async () => {
      const visits = [TestData.orchestrationVisitDto({ outcomeStatus: null })]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/visits/booked/past`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visits)

      const result = await orchestrationApiClient.getPastPublicVisits(bookerReference.value)

      expect(result).toStrictEqual(visits)
    })
  })

  describe('changeVisitApplication', () => {
    it('should update an incomplete Visit Application', async () => {
      const applicationReference = 'aaa-bbb-ccc'
      const applicationRestriction: SessionRestriction = 'OPEN'
      const sessionTemplateReference = 'v9d.7ed.7u'
      const sessionDate = '2024-05-01'
      const visitContact = { name: 'Visit Contact' }
      const visitors = [
        { nomisPersonId: 1, visitContact: true },
        { nomisPersonId: 2, visitContact: false },
      ]
      const visitorSupport = { description: 'wheelchair' }

      const requestBody: ChangeApplicationDto = {
        applicationRestriction,
        sessionTemplateReference,
        sessionDate,
        visitContact,
        visitors,
        visitorSupport,
        allowOverBooking: false,
      }

      const result = { reference: 'aaa-bbb-ccc' } as ApplicationDto

      fakeOrchestrationApi
        .put(`/visits/application/${applicationReference}/slot/change`, requestBody)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.changeVisitApplication({
        applicationReference,
        applicationRestriction,
        sessionTemplateReference,
        sessionDate,
        visitContact,
        visitors,
        visitorSupport,
      })

      expect(output).toStrictEqual(result)
    })
  })

  describe('createVisitApplication', () => {
    it('should return a new Visit Application', async () => {
      const prisonerId = 'A1234BC'
      const sessionTemplateReference = 'v9d.7ed.7u'
      const sessionDate = '2024-05-01'
      const applicationRestriction: SessionRestriction = 'OPEN'
      const visitorIds = [1234, 2345]

      const requestBody: CreateApplicationDto = {
        prisonerId,
        sessionTemplateReference,
        sessionDate,
        applicationRestriction,
        visitors: visitorIds.map(id => {
          return { nomisPersonId: id }
        }),
        userType: 'PUBLIC',
        actionedBy: bookerReference.value,
        allowOverBooking: false,
      }

      const result = { reference: 'aaa-bbb-ccc' } as ApplicationDto

      fakeOrchestrationApi
        .post('/visits/application/slot/reserve', requestBody)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, result)

      const output = await orchestrationApiClient.createVisitApplication({
        prisonerId,
        sessionTemplateReference,
        sessionDate,
        applicationRestriction,
        visitorIds,
        bookerReference: bookerReference.value,
      })

      expect(output).toStrictEqual(result)
    })
  })

  describe('getBookerReference', () => {
    it('should send details received from One Login to retrieve bookerReference', async () => {
      const authDetailDto = TestData.authDetailDto()

      fakeOrchestrationApi
        .put('/public/booker/register/auth', authDetailDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, bookerReference)

      const result = await orchestrationApiClient.getBookerReference(authDetailDto)

      expect(result).toStrictEqual(bookerReference)
    })
  })

  describe('addVisitorRequest', () => {
    const addVisitorRequest = TestData.addVisitorRequest()
    const prisonerId = 'A1234BC'

    it('should send a request to add a visitor and return true for a 201 API response', async () => {
      fakeOrchestrationApi
        .post(
          `/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
          addVisitorRequest,
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(201, bookerReference)

      const result = await orchestrationApiClient.addVisitorRequest({
        bookerReference: bookerReference.value,
        prisonerId,
        addVisitorRequest,
      })

      expect(result).toBe(true)
    })

    it('should try to send an add visitor request and return validation error code for a 422 API response', async () => {
      fakeOrchestrationApi
        .post(
          `/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
          addVisitorRequest,
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(422, <BookerVisitorRequestValidationErrorResponse>{
          status: 422,
          validationError: 'VISITOR_ALREADY_EXISTS',
        })

      const result = await orchestrationApiClient.addVisitorRequest({
        bookerReference: bookerReference.value,
        prisonerId,
        addVisitorRequest,
      })

      expect(result).toBe('VISITOR_ALREADY_EXISTS')
    })

    it('should try to send an add visitor request and throw other API error responses', async () => {
      fakeOrchestrationApi
        .post(
          `/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
          addVisitorRequest,
        )
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      await expect(
        orchestrationApiClient.addVisitorRequest({
          bookerReference: bookerReference.value,
          prisonerId,
          addVisitorRequest,
        }),
      ).rejects.toThrow('Bad Request')
    })
  })

  describe('registerPrisoner', () => {
    it('should try to register a prisoner and return true for a 200 API response', async () => {
      const registerPrisonerForBookerDto = TestData.registerPrisonerForBookerDto()

      fakeOrchestrationApi
        .post(`/public/booker/${bookerReference.value}/permitted/prisoners/register`, registerPrisonerForBookerDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      const result = await orchestrationApiClient.registerPrisoner(bookerReference.value, registerPrisonerForBookerDto)

      expect(result).toBe(true)
    })

    it('should try to register a prisoner and return false for a 422 API response', async () => {
      const registerPrisonerForBookerDto = TestData.registerPrisonerForBookerDto()

      fakeOrchestrationApi
        .post(`/public/booker/${bookerReference.value}/permitted/prisoners/register`, registerPrisonerForBookerDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(422)

      const result = await orchestrationApiClient.registerPrisoner(bookerReference.value, registerPrisonerForBookerDto)

      expect(result).toBe(false)
    })

    it('should try to register a prisoner and throw API errors', async () => {
      const registerPrisonerForBookerDto = TestData.registerPrisonerForBookerDto()

      fakeOrchestrationApi
        .post(`/public/booker/${bookerReference.value}/permitted/prisoners/register`, registerPrisonerForBookerDto)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(400)

      await expect(
        orchestrationApiClient.registerPrisoner(bookerReference.value, registerPrisonerForBookerDto),
      ).rejects.toThrow('Bad Request')
    })
  })

  describe('getPrisoners', () => {
    it('should retrieve prisoners associated with a booker', async () => {
      const { prisoner } = TestData.bookerPrisonerInfoDto()

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/permitted/prisoners/${prisoner.prisonerNumber}/validate`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200)

      const result = await orchestrationApiClient.validatePrisoner(bookerReference.value, prisoner.prisonerNumber)

      expect(result).toBe(true)
    })
  })

  describe('validatePrisoner', () => {
    it('should call validate endpoint for given prisoner and booker reference', async () => {
      const prisoners = [TestData.bookerPrisonerInfoDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/permitted/prisoners`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisoners)

      const result = await orchestrationApiClient.getPrisoners(bookerReference.value)

      expect(result).toEqual(prisoners)
    })
  })

  describe('getVisitors', () => {
    it('should retrieve visitors associated with a booker and prisoner', async () => {
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner
      const visitors = [TestData.visitorInfoDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/permitted/prisoners/${prisonerNumber}/permitted/visitors`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitors)

      const result = await orchestrationApiClient.getVisitors(bookerReference.value, prisonerNumber)

      expect(result).toStrictEqual(visitors)
    })
  })

  describe('getVisitSessions', () => {
    const { prisoner } = TestData.bookerPrisonerInfoDto()
    const visitorIds = [1, 2]
    const visitSessions: AvailableVisitSessionDto[] = [TestData.availableVisitSessionDto()]
    const excludedApplicationReference = 'aaa-bbb-ccc'

    it('should get available visit sessions for prison / prisoner / visitors', async () => {
      orchestrationApiClient = new OrchestrationApiClient(token)
      fakeOrchestrationApi
        .get('/visit-sessions/public/available')
        .query({
          prisonId: prisoner.prisonId,
          prisonerId: prisoner.prisonerNumber,
          visitors: visitorIds.join(','),
          username: bookerReference.value,
          excludedApplicationReference,
          userType: 'PUBLIC',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitSessions)

      const result = await orchestrationApiClient.getVisitSessions({
        prisonId: prisoner.prisonId,
        prisonerId: prisoner.prisonerNumber,
        visitorIds,
        bookerReference: bookerReference.value,
        excludedApplicationReference,
      })

      expect(result).toStrictEqual(visitSessions)
    })
  })

  describe('getSessionRestriction', () => {
    it('should get session restriction for prisoner and visitors', async () => {
      const { prisoner } = TestData.bookerPrisonerInfoDto()
      const visitorIds = [1, 2]

      const availableVisitSessionRestrictionDto: AvailableVisitSessionRestrictionDto = { sessionRestriction: 'OPEN' }

      fakeOrchestrationApi
        .get('/visit-sessions/available/restriction')
        .query({
          prisonerId: prisoner.prisonerNumber,
          visitors: visitorIds.join(','),
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, availableVisitSessionRestrictionDto)

      const result = await orchestrationApiClient.getSessionRestriction({
        prisonerId: prisoner.prisonerNumber,
        visitorIds,
      })

      expect(result).toBe(availableVisitSessionRestrictionDto.sessionRestriction)
    })
  })

  describe('getSupportedPrisonIds', () => {
    it('should get list of supported prison IDs', async () => {
      const prisonIds = ['HEI']

      fakeOrchestrationApi
        .get('/config/prisons/user-type/PUBLIC/supported')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisonIds)

      const result = await orchestrationApiClient.getSupportedPrisonIds()

      expect(result).toStrictEqual(prisonIds)
    })
  })

  describe('getSupportedPrisons', () => {
    it('should get list of supported prisons', async () => {
      const prisons = [TestData.prisonRegisterPrisonDto()]

      fakeOrchestrationApi
        .get('/config/prisons/user-type/PUBLIC/supported/detailed')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisons)

      const result = await orchestrationApiClient.getSupportedPrisons()

      expect(result).toStrictEqual(prisons)
    })
  })

  describe('getPrison', () => {
    it('should get a prison by prisonCode', async () => {
      const prison = TestData.prisonDto()

      fakeOrchestrationApi
        .get(`/config/prisons/prison/${prison.code}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prison)

      const result = await orchestrationApiClient.getPrison(prison.code)

      expect(result).toStrictEqual(prison)
    })
  })
})
