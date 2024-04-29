import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto } from '../data/orchestrationApiTypes'

export interface UserDetails {
  bookerReference: string
}

// 'User' is the 'Booker' - TODO should we rename to BookerService?
export default class UserService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  // TODO add tests!
  async getBookerReference(authDetailDto: AuthDetailDto): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    // TODO try/catch for non-200 and log user out
    const bookerReference = await (await orchestrationApiClient.getBookerReference(authDetailDto)).value

    logger.info(`Booker reference ${bookerReference} retrieved`)
    return bookerReference
  }
}
