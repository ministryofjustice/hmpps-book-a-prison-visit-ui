import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { PrisonDto, PrisonRegisterPrisonDto } from '../data/orchestrationApiTypes'

export default class PrisonService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getSupportedPrisons(): Promise<PrisonRegisterPrisonDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getSupportedPrisons()
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getPrison(prisonCode)
  }
}
