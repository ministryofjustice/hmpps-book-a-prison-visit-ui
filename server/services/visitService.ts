import { BookingJourney } from '../@types/bapv'
import { RestClientBuilder, OrchestrationApiClient, HmppsAuthClient } from '../data'
import { ApplicationDto, VisitDto } from '../data/orchestrationApiTypes'

export default class VisitService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async createVisitApplication({
    bookingJourney,
    bookerReference,
  }: {
    bookingJourney: BookingJourney
    bookerReference: string
  }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitorIds = bookingJourney.selectedVisitors.map(visitor => visitor.visitorId)

    return orchestrationApiClient.createVisitApplication({
      prisonerId: bookingJourney.prisoner.prisonerNumber,
      sessionTemplateReference: bookingJourney.selectedSessionTemplateReference,
      sessionDate: bookingJourney.selectedSessionDate,
      applicationRestriction: bookingJourney.sessionRestriction,
      visitorIds,
      bookerReference,
    })
  }

  async changeVisitApplication({ bookingJourney }: { bookingJourney: BookingJourney }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const { contact, phoneNumber } = bookingJourney.mainContact
    const visitContact = {
      name: typeof contact === 'string' ? contact : `${contact.firstName} ${contact.lastName}`,
      ...(phoneNumber && { telephone: phoneNumber }),
    }

    const visitors = bookingJourney.selectedVisitors.map(visitor => {
      return {
        nomisPersonId: visitor.visitorId,
        visitContact: typeof contact === 'object' ? contact.visitorId === visitor.visitorId : false,
      }
    })

    return orchestrationApiClient.changeVisitApplication({
      applicationReference: bookingJourney.applicationReference,
      applicationRestriction: bookingJourney.sessionRestriction,
      sessionTemplateReference: bookingJourney.selectedSessionTemplateReference,
      sessionDate: bookingJourney.selectedSessionDate,
      visitContact,
      visitors,
      visitorSupport: { description: bookingJourney.visitorSupport },
    })
  }

  async bookVisit({ applicationReference }: { applicationReference: string }): Promise<VisitDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.bookVisit({ applicationReference })
  }
}
