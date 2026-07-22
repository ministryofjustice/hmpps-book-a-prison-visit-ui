import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { PrisonNameDto } from './prisonRegisterApiTypes'

export default class PrisonRegisterApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonRegisterApiClient', config.apis.prisonRegister, logger, authenticationClient)
  }

  async getPrisonNames(): Promise<PrisonNameDto[]> {
    return this.get({ path: '/prisons/names', query: new URLSearchParams({ active: 'true' }).toString() }, asSystem())
  }
}
