import { randomUUID } from 'crypto'
import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, VisitorInfoDto } from '../data/orchestrationApiTypes'
import { isAdult } from '../utils/utils'

export type Prisoner = {
  prisonerDisplayId: string
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  availableVos: number
  nextAvailableVoDate: string
}
export interface Visitor extends VisitorInfoDto {
  visitorDisplayId: string
  adult: boolean
}

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

  async getPrisoners(bookerReference: string): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const prisoners = await orchestrationApiClient.getPrisoners(bookerReference)
    return prisoners.map(prisoner => {
      return {
        prisonerDisplayId: randomUUID(),
        prisonerNumber: prisoner.prisoner.prisonerNumber,
        firstName: prisoner.prisoner.firstName,
        lastName: prisoner.prisoner.lastName,
        prisonId: prisoner.prisoner.prisonId,
        availableVos: prisoner.availableVos,
        nextAvailableVoDate: prisoner.nextAvailableVoDate,
      }
    })
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<Visitor[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const visitors = await orchestrationApiClient.getVisitors(bookerReference, prisonerNumber)

    return visitors.map(visitor => {
      return { ...visitor, visitorDisplayId: randomUUID(), adult: isAdult(visitor.dateOfBirth) }
    })
  }

  async getEligibleVisitors(bookerReference: string, prisonerNumber: string): Promise<Visitor[]> {
    const allVisitors = await this.getVisitors(bookerReference, prisonerNumber)
    return allVisitors.filter(visitor => visitor.visitorRestrictions.length === 0)
  }
}
