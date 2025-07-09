import RestClient from './restClient'
import config from '../config'
import { PrisonNameDto } from './prisonRegisterApiTypes'

export default class PrisonRegisterApiClient {
  private restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('prisonRegisterApiClient', config.apis.prisonRegister, token)
  }

  async getPrisonNames(): Promise<PrisonNameDto[]> {
    return this.restClient.get({ path: '/prisons/names', query: new URLSearchParams({ active: 'true' }).toString() })
  }
}
