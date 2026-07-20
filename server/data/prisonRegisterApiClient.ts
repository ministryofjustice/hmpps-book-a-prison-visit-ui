import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'
import config from '../config'
import { PrisonNameDto } from './prisonRegisterApiTypes'

export default class PrisonRegisterApiClient {
  private restClient: RestClient

  constructor(private readonly token: string) {
    this.restClient = new RestClient('prisonRegisterApiClient', config.apis.prisonRegister, logger)
  }

  async getPrisonNames(): Promise<PrisonNameDto[]> {
    return this.restClient.get(
      { path: '/prisons/names', query: new URLSearchParams({ active: 'true' }).toString() },
      asUser(this.token),
    )
  }
}
