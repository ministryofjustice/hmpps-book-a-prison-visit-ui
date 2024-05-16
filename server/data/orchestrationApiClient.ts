import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  AuthDetailDto,
  AvailableVisitSessionDto,
  BookerReference,
  PrisonDto,
  PrisonerInfoDto,
  VisitorInfoDto,
} from './orchestrationApiTypes'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

  // public-booker-controller

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<BookerReference> {
    return this.restClient.put({
      path: '/public/booker/register/auth',
      data: { ...authDetailDto },
    })
  }

  async getPrisoners(bookerReference: string): Promise<PrisonerInfoDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/prisoners` })
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<VisitorInfoDto[]> {
    return this.restClient.get({ path: `/public/booker/${bookerReference}/prisoners/${prisonerNumber}/visitors` })
  }

  // orchestration-prisons-config-controller

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    return this.restClient.get({ path: `/config/prisons/prison/${prisonCode}` })
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
}
