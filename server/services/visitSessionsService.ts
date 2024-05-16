import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AvailableVisitSessionDto } from '../data/orchestrationApiTypes'

export default class VisitSessionsService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getVisitSessions(
    prisonId: string,
    prisonerId: string,
    visitorIds: number[],
  ): Promise<AvailableVisitSessionDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitSessions(prisonId, prisonerId, visitorIds)
  }
}
