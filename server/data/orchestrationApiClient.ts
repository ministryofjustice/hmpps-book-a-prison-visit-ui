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
  PrisonDto,
  PrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
} from './orchestrationApiTypes'
import { type SessionRestriction } from '../services/visitSessionsService'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // orchestration-visits-controller

  async bookVisit({ applicationReference }: { applicationReference: string }): Promise<VisitDto> {
    return this.restClient.put({
      path: `/visits/${applicationReference}/book`,
      data: <BookingOrchestrationRequestDto>{
        applicationMethodType: 'WEBSITE', // TODO - check this is correct
        allowOverBooking: false,
      },
    })
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

  async getPrisoners(bookerReference: string): Promise<PrisonerInfoDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/permitted/prisoners` })
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<VisitorInfoDto[]> {
    return this.restClient.get({
      path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerNumber}/permitted/visitors`,
    })
  }

  // orchestration-sessions-controller

  async getVisitSessions(
    prisonId: string,
    prisonerId: string,
    visitorIds: number[],
  ): Promise<AvailableVisitSessionDto[]> {
    return this.restClient.get({
      path: '/visit-sessions/available',
      query: new URLSearchParams({ prisonId, prisonerId, visitors: visitorIds.join(',') }).toString(),
    })
  }

  // orchestration-prisons-config-controller

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    return this.restClient.get({ path: `/config/prisons/prison/${prisonCode}` })
  }
}
