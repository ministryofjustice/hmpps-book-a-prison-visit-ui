import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { AuthDetailDto, BookerReference, PrisonerInfoDto, VisitorInfoDto } from './orchestrationApiTypes'

export default class OrchestrationApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('orchestrationApiClient', config.apis.orchestration as ApiConfig, token)
  }

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
}
