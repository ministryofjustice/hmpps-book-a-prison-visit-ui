import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, VisitorInfoDto } from '../data/orchestrationApiTypes'
import { isAdult } from '../utils/utils'

export type Prisoner = {
  prisonerDisplayId: number
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  availableVos: number
  nextAvailableVoDate: string
}
export interface Visitor extends VisitorInfoDto {
  visitorDisplayId: number
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
    return prisoners.map((prisoner, index) => {
      return {
        prisonerDisplayId: index + 1,
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

    return visitors.map((visitor, index) => {
      return { ...visitor, visitorDisplayId: index + 1, adult: isAdult(visitor.dateOfBirth) }
    })
  }
}
