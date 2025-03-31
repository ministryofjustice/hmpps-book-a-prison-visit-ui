import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ApplicationDto,
  AuthDetailDto,
  AvailableVisitSessionDto,
  BookerReference,
  BookingOrchestrationRequestDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  OrchestrationVisitDto,
  PrisonDto,
  BookerPrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
  AvailableVisitSessionRestrictionDto,
  CancelVisitOrchestrationDto,
  PrisonRegisterPrisonDto,
  RegisterPrisonerForBookerDto,
} from './orchestrationApiTypes'
import { SanitisedError } from '../sanitisedError'

export type SessionRestriction = AvailableVisitSessionDto['sessionRestriction']

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // orchestration-visits-controller

  async bookVisit({
    applicationReference,
    actionedBy,
  }: {
    applicationReference: string
    actionedBy: string
  }): Promise<VisitDto> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/book`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: 'WEBSITE',
        allowOverBooking: false,
        actionedBy,
        userType: 'PUBLIC',
      },
    })
  }

  async cancelVisit({
    applicationReference,
    actionedBy,
  }: {
    applicationReference: string
    actionedBy: string
  }): Promise<void> {
    await this.restClient.put({
      path: `/visits/${applicationReference}/cancel`,
      data: <CancelVisitOrchestrationDto>{
        cancelOutcome: {
          outcomeStatus: 'BOOKER_CANCELLED',
        },
        applicationMethodType: 'WEBSITE',
        actionedBy,
        userType: 'PUBLIC',
      },
    })
  }

  async getFuturePublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/visits/booked/future` })
  }

  async getPastPublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/visits/booked/past` })
  }

  async getCancelledPublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/visits/cancelled` })
  }

  // orchestration-applications-controller

  async changeVisitApplication({
    applicationReference,
    applicationRestriction,
    sessionTemplateReference,
    sessionDate,
    visitContact,
    visitors,
    visitorSupport,
  }: {
    applicationReference: string
    applicationRestriction: SessionRestriction
    sessionTemplateReference: string
    sessionDate: string
    visitContact: ChangeApplicationDto['visitContact']
    visitors: ChangeApplicationDto['visitors']
    visitorSupport: ChangeApplicationDto['visitorSupport']
  }): Promise<ApplicationDto> {
    return this.restClient.put({
      path: `/visits/application/${applicationReference}/slot/change`,
      data: <ChangeApplicationDto>{
        applicationRestriction,
        sessionTemplateReference,
        sessionDate,
        visitContact,
        visitors,
        visitorSupport,
        allowOverBooking: false,
      },
    })
  }

  async createVisitApplication({
    prisonerId,
    sessionTemplateReference,
    sessionDate,
    applicationRestriction,
    visitorIds,
    bookerReference,
  }: {
    prisonerId: string
    sessionTemplateReference: string
    sessionDate: string
    applicationRestriction: SessionRestriction
    visitorIds: number[]
    bookerReference: string
  }): Promise<ApplicationDto> {
    return this.restClient.post({
      path: '/visits/application/slot/reserve',
      data: <CreateApplicationDto>{
        prisonerId,
        sessionTemplateReference,
        sessionDate,
        applicationRestriction,
        visitors: visitorIds.map(id => {
          return {
            nomisPersonId: id,
          }
        }),
        userType: 'PUBLIC',
        actionedBy: bookerReference,
        allowOverBooking: false,
      },
    })
  }

  // public-booker-controller

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<BookerReference> {
    return this.restClient.put({
      path: '/public/booker/register/auth',
      data: { ...authDetailDto },
    })
  }

  async registerPrisoner(bookerReference: string, prisoner: RegisterPrisonerForBookerDto): Promise<boolean> {
    try {
      await this.restClient.post({
        path: `/public/booker/${bookerReference}/permitted/prisoners/register`,
        data: { ...prisoner },
        raw: true, // needed because no JSON response body: an HTTP 200 is true
      })
      return true
    } catch (error) {
      if ((<SanitisedError>error)?.status === 422) {
        return false
      }
      throw error
    }
  }

  async getPrisoners(bookerReference: string): Promise<BookerPrisonerInfoDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/permitted/prisoners` })
  }

  async validatePrisoner(bookerReference: string, prisonerNumber: string): Promise<true> {
    await this.restClient.get({
      path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerNumber}/validate`,
      raw: true, // needed because no JSON response body: an HTTP 200 is true
    })
    return true // API will return HTTP 422 for invalid prisoner, which will be caught in service layer
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<VisitorInfoDto[]> {
    return this.restClient.get({
      path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerNumber}/permitted/visitors`,
    })
  }

  // orchestration-sessions-controller

  async getVisitSessions({
    prisonId,
    prisonerId,
    visitorIds,
    excludedApplicationReference,
    bookerReference,
  }: {
    prisonId: string
    prisonerId: string
    visitorIds: number[]
    excludedApplicationReference?: string
    bookerReference: string
  }): Promise<AvailableVisitSessionDto[]> {
    return this.restClient.get({
      path: '/visit-sessions/available',
      query: new URLSearchParams({
        prisonId,
        prisonerId,
        visitors: visitorIds.join(','),
        username: bookerReference,
        ...(excludedApplicationReference && { excludedApplicationReference }),
      }).toString(),
    })
  }

  async getSessionRestriction({
    prisonerId,
    visitorIds,
  }: {
    prisonerId: string
    visitorIds: number[]
  }): Promise<SessionRestriction> {
    const { sessionRestriction } = await this.restClient.get<AvailableVisitSessionRestrictionDto>({
      path: '/visit-sessions/available/restriction',
      query: new URLSearchParams({
        prisonerId,
        visitors: visitorIds.join(','),
      }).toString(),
    })
    return sessionRestriction
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisons(): Promise<PrisonRegisterPrisonDto[]> {
    return this.restClient.get({ path: '/config/prisons/user-type/PUBLIC/supported/detailed' })
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    return this.restClient.get({ path: `/config/prisons/prison/${prisonCode}` })
  }
}
