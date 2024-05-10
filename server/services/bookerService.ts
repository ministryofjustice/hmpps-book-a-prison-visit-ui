import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, PrisonerInfoDto, VisitorInfoDto } from '../data/orchestrationApiTypes'

export default class BookerService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const bookerReference = (await orchestrationApiClient.getBookerReference(authDetailDto)).value

    logger.info(`Booker reference ${bookerReference} retrieved`)
    return bookerReference
  }

  async getPrisoners(bookerReference: string): Promise<PrisonerInfoDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getPrisoners(bookerReference)
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<VisitorInfoDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitors(bookerReference, prisonerNumber)
  }
}
