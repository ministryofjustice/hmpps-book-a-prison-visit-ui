import { randomUUID } from 'crypto'
import logger from '../../logger'
import { BookingJourney } from '../@types/bapv'
import { RestClientBuilder, OrchestrationApiClient, HmppsAuthClient } from '../data'
import { ApplicationDto, OrchestrationVisitDto, VisitDto } from '../data/orchestrationApiTypes'
import { getMainContactName } from '../utils/utils'

export interface VisitDetails extends OrchestrationVisitDto {
  visitDisplayId: string
}
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

    const { mainContact } = bookingJourney
    const { mainContactEmail, mainContactPhone } = bookingJourney

    const visitContact = mainContact
      ? {
          ...(mainContact && { name: getMainContactName(mainContact) }),
          ...(mainContactPhone && { telephone: mainContactPhone }),
          ...(mainContactEmail && { email: mainContactEmail }),
        }
      : undefined

    const visitors = bookingJourney.selectedVisitors.map(visitor => {
      return {
        nomisPersonId: visitor.visitorId,
        visitContact: typeof mainContact === 'object' ? mainContact.visitorId === visitor.visitorId : false,
      }
    })

    const visitorSupport = bookingJourney.visitorSupport ? { description: bookingJourney.visitorSupport } : undefined

    const application = await orchestrationApiClient.changeVisitApplication({
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
    isRequestBooking,
  }: {
    applicationReference: string
    actionedBy: string
    isRequestBooking: boolean
  }): Promise<VisitDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = await orchestrationApiClient.bookVisit({ applicationReference, actionedBy, isRequestBooking })

    logger.info(
      `Visit application '${applicationReference}' booked as visit '${visit.reference}' (${visit.visitSubStatus})`,
    )
    return visit
  }

  async cancelVisit({
    applicationReference,
    actionedBy,
  }: {
    applicationReference: string
    actionedBy: string
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    await orchestrationApiClient.cancelVisit({ applicationReference, actionedBy })

    logger.info(`Visit '${applicationReference}' has been cancelled by booker '${actionedBy}`)
  }

  async getFuturePublicVisits(bookerReference: string): Promise<VisitDetails[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visits = await orchestrationApiClient.getFuturePublicVisits(bookerReference)

    return this.addVisitDisplayIds(visits)
  }

  async getPastPublicVisits(bookerReference: string): Promise<VisitDetails[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visits = await orchestrationApiClient.getPastPublicVisits(bookerReference)

    return this.addVisitDisplayIds(visits)
  }

  async getCancelledPublicVisits(bookerReference: string): Promise<VisitDetails[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visits = await orchestrationApiClient.getCancelledPublicVisits(bookerReference)

    return this.addVisitDisplayIds(visits)
  }

  private addVisitDisplayIds(visits: OrchestrationVisitDto[]): VisitDetails[] {
    return visits.map(visit => ({ ...visit, visitDisplayId: randomUUID() }))
  }
}
