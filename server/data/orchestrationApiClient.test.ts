import nock from 'nock'
import config from '../config'
import OrchestrationApiClient from './orchestrationApiClient'
import TestData from '../routes/testutils/testData'
import {
  ApplicationDto,
  AvailableVisitSessionDto,
  BookingOrchestrationRequestDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  VisitDto,
} from './orchestrationApiTypes'
import { SessionRestriction } from '../services/visitSessionsService'

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

      const result = { reference: 'ab-cd-ef-gh' } as Partial<VisitDto>

      fakeOrchestrationApi
        .put(`/visits/${applicationReference}/book`, <BookingOrchestrationRequestDto>{
          applicationMethodType: 'WEBSITE',
          allowOverBooking: false,
          actionedBy: bookerReference.value,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const output = await orchestrationApiClient.bookVisit({ applicationReference, actionedBy: bookerReference.value })

      expect(output).toStrictEqual(result)
    })
  })

  describe('getFuturePublicVisits', () => {
    it('should retrieve all future visits associated with a booker', async () => {
      const visits = [TestData.visitDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/visits/booked/future`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visits)

      const result = await orchestrationApiClient.getFuturePublicVisits(bookerReference.value)

      expect(result).toEqual(visits)
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

      const result = { reference: 'aaa-bbb-ccc' } as ApplicationDto

      fakeOrchestrationApi
        .put(`/visits/application/${applicationReference}/slot/change`, <ChangeApplicationDto>{
          applicationRestriction,
          sessionTemplateReference,
          sessionDate,
          visitContact,
          visitors,
          visitorSupport,
          allowOverBooking: false,
        })
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

      const result = { reference: 'aaa-bbb-ccc' } as ApplicationDto

      fakeOrchestrationApi
        .post('/visits/application/slot/reserve', <CreateApplicationDto>{
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
        })
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

  describe('getbookerReference', () => {
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

  describe('getPrisoners', () => {
    it('should retrieve prisoners associated with a booker', async () => {
      const prisoners = [TestData.prisonerInfoDto()]

      fakeOrchestrationApi
        .get(`/public/booker/${bookerReference.value}/permitted/prisoners`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, prisoners)

      const result = await orchestrationApiClient.getPrisoners(bookerReference.value)

      expect(result).toStrictEqual(prisoners)
    })
  })

  describe('getVisitors', () => {
    it('should retrieve visitors associated with a booker and prisoner', async () => {
      const { prisonerNumber } = TestData.prisonerInfoDto()
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
    it('should get available visit sessions for prison / prisoner / visitors', async () => {
      const prisoner = TestData.prisonerInfoDto()
      const visitorIds = [1, 2]
      const visitSessions: AvailableVisitSessionDto[] = [TestData.availableVisitSessionDto()]
      const excludedApplicationReference = 'aaa-bbb-ccc'

      fakeOrchestrationApi
        .get('/visit-sessions/available')
        .query({
          prisonId: prisoner.prisonCode,
          prisonerId: prisoner.prisonerNumber,
          visitors: visitorIds.join(','),
          excludedApplicationReference,
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, visitSessions)

      const result = await orchestrationApiClient.getVisitSessions({
        prisonId: prisoner.prisonCode,
        prisonerId: prisoner.prisonerNumber,
        visitorIds,
        excludedApplicationReference,
      })

      expect(result).toStrictEqual(visitSessions)
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
