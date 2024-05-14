import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonDto } from '../data/orchestrationApiTypes'

export default class PrisonService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getPrison(prisonCode)
  }
}
