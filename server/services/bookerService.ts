import { randomUUID } from 'crypto'
import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { AuthDetailDto, BookerPrisonerValidationErrorResponse, VisitorInfoDto } from '../data/orchestrationApiTypes'
import { isAdult } from '../utils/utils'
import { SanitisedError } from '../sanitisedError'

export type Prisoner = {
  prisonerDisplayId: string
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  prisonName: string
  registeredPrisonId: string
  registeredPrisonName: string
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

    return prisoners.map(bookerPrisonerInfo => {
      const { prisoner, availableVos, nextAvailableVoDate, registeredPrison } = bookerPrisonerInfo
      return {
        prisonerDisplayId: randomUUID(),
        prisonerNumber: prisoner.prisonerNumber,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
        registeredPrisonId: registeredPrison.prisonCode,
        registeredPrisonName: registeredPrison.prisonName,
        availableVos,
        nextAvailableVoDate,
      }
    })
  }

  async validatePrisoner(
    bookerReference: string,
    prisonerNumber: string,
  ): Promise<true | BookerPrisonerValidationErrorResponse['validationError']> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    try {
      await orchestrationApiClient.validatePrisoner(bookerReference, prisonerNumber)
      return true
    } catch (error) {
      if (
        error.status === 422 &&
        typeof (error as SanitisedError<BookerPrisonerValidationErrorResponse>)?.data?.validationError === 'string'
      ) {
        return error.data.validationError
      }
      throw error
    }
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

  // returned from reverted commit, commented out
  // assuming this will be required in some capacity in the future
  // async isPrisonerTransferredOrReleased(bookerReference: string, prisonerNumber: string): Promise<boolean> {
  //   const validationResult = await this.validatePrisoner(bookerReference, prisonerNumber)
  //   if (
  //     validationResult === 'PRISONER_RELEASED' ||
  //     validationResult === 'PRISONER_TRANSFERRED_SUPPORTED_PRISON' ||
  //     validationResult === 'PRISONER_TRANSFERRED_UNSUPPORTED_PRISON'
  //   ) {
  //     return true
  //   }
  //   return false
  // }
}
