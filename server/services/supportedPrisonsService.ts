import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'

export default class SupportedPrisonsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getSupportedPrisonIds(): Promise<string[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    return orchestrationApiClient.getSupportedPrisonIds()
  }
}
