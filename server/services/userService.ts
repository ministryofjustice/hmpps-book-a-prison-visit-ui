import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, PrisonerBasicInfoDto, VisitorBasicInfoDto } from '../data/orchestrationApiTypes'

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

  // TODO add tests!
  async getPrisoner(bookerReference: string): Promise<PrisonerBasicInfoDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const prisoners = await orchestrationApiClient.getPrisoners(bookerReference)

    // TODO handle empty prisoner array
    return prisoners[0]
  }

  // TODO add tests!
  async getVisitors(bookerReference: string, prisonNumber: string): Promise<VisitorBasicInfoDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitors(bookerReference, prisonNumber)
  }
}
