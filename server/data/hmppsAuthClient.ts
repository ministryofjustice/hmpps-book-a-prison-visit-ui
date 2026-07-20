import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import type TokenStore from './tokenStore/tokenStore'
import logger from '../../logger'
import config from '../config'

export default class HmppsAuthClient {
  private readonly authenticationClient: AuthenticationClient

  constructor(tokenStore: TokenStore) {
    this.authenticationClient = new AuthenticationClient(config.apis.hmppsAuth, logger, tokenStore)
  }

  async getSystemClientToken(): Promise<string> {
    return this.authenticationClient.getToken()
  }
}
