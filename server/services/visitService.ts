import { BookingJourneyData } from '../@types/bapv'
import { RestClientBuilder, OrchestrationApiClient, HmppsAuthClient } from '../data'
import { ApplicationDto } from '../data/orchestrationApiTypes'

export default class VisitService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async createVisitApplication({
    bookerReference,
    bookingJourney,
  }: {
    bookerReference: string
    bookingJourney: BookingJourneyData
  }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitorIds = bookingJourney.selectedVisitors.map(visitor => visitor.visitorId)

    return orchestrationApiClient.createVisitApplication({
      prisonerId: bookingJourney.prison.code,
      sessionTemplateReference: bookingJourney.selectedSessionTemplateReference,
      sessionDate: bookingJourney.selectedSessionDate,
      applicationRestriction: bookingJourney.sessionRestriction,
      visitorIds,
      bookerReference,
    })
  }
}
