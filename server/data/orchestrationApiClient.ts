import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { AuthDetailDto, BookerReference } from './orchestrationApiTypes'

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
}
