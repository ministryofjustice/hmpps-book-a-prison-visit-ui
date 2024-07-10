import logger from '../../logger'
import { BookingJourney } from '../@types/bapv'
import { RestClientBuilder, OrchestrationApiClient, HmppsAuthClient } from '../data'
import { ApplicationDto, OrchestrationVisitDto, VisitDto } from '../data/orchestrationApiTypes'

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

    const application = await orchestrationApiClient.createVisitApplication({
      prisonerId: bookingJourney.prisoner.prisonerNumber,
      sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
      sessionDate: bookingJourney.selectedVisitSession.sessionDate,
      applicationRestriction: bookingJourney.selectedVisitSession.sessionRestriction,
      visitorIds,
      bookerReference,
    })

    logger.info(`Visit application '${application.reference}' created for booker '${bookerReference}'`)
    return application
  }

  async changeVisitApplication({ bookingJourney }: { bookingJourney: BookingJourney }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const contact = bookingJourney.mainContact?.contact
    const phoneNumber = bookingJourney.mainContact?.phoneNumber

    const visitContact = bookingJourney.mainContact
      ? {
          name: typeof contact === 'string' ? contact : `${contact.firstName} ${contact.lastName}`,
          ...(phoneNumber && { telephone: phoneNumber }),
        }
      : undefined

    const visitors = bookingJourney.selectedVisitors.map(visitor => {
      return {
        nomisPersonId: visitor.visitorId,
        visitContact: typeof contact === 'object' ? contact.visitorId === visitor.visitorId : false,
      }
    })

    const visitorSupport = bookingJourney.visitorSupport ? { description: bookingJourney.visitorSupport } : undefined

    const application = orchestrationApiClient.changeVisitApplication({
      applicationReference: bookingJourney.applicationReference,
      applicationRestriction: bookingJourney.selectedVisitSession.sessionRestriction,
      sessionTemplateReference: bookingJourney.selectedVisitSession.sessionTemplateReference,
      sessionDate: bookingJourney.selectedVisitSession.sessionDate,
      visitContact,
      visitors,
      visitorSupport,
    })
    logger.info(`Visit application '${bookingJourney.applicationReference}' changed`)
    return application
  }

  async bookVisit({
    applicationReference,
    actionedBy,
  }: {
    applicationReference: string
    actionedBy: string
  }): Promise<VisitDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = orchestrationApiClient.bookVisit({ applicationReference, actionedBy })

    logger.info(`Visit application '${applicationReference}' booked as visit '${(await visit).reference}'`)
    return visit
  }

  async getFuturePublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visits = await orchestrationApiClient.getFuturePublicVisits(bookerReference)

    logger.info(`Visits for booker reference ${bookerReference} retrieved`)
    return visits
  }
}
