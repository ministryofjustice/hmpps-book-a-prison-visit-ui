import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { AuthDetailDto, BookerReference } from './bookerRegistryApiTypes'

export default class BookerRegistryApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('bookerRegistryApiClient', config.apis.bookerRegistry as ApiConfig, token)
  }

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<BookerReference> {
    return this.restClient.put({
      path: '/register/auth',
      data: { ...authDetailDto },
    })
  }
}
