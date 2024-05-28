import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, PrisonerInfoDto, VisitorInfoDto } from '../data/orchestrationApiTypes'

export interface Prisoner extends PrisonerInfoDto {
  prisonerDisplayId: number
}
export interface Visitor extends VisitorInfoDto {
  visitorDisplayId: number
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
      return { ...prisoner, prisonerDisplayId: index + 1 }
    })
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<Visitor[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const visitors = await orchestrationApiClient.getVisitors(bookerReference, prisonerNumber)

    return visitors.map((visitor, index) => {
      return { ...visitor, visitorDisplayId: index + 1 }
    })
  }
}
