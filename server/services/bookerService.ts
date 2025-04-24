import { randomUUID } from 'crypto'
import { TooManyRequests } from 'http-errors'
import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import {
  AuthDetailDto,
  BookerPrisonerValidationErrorResponse,
  ConvictedStatus,
  RegisterPrisonerForBookerDto,
  VisitorInfoDto,
} from '../data/orchestrationApiTypes'
import { isAdult } from '../utils/utils'
import { SanitisedError } from '../sanitisedError'
import RateLimitService from './rateLimitService'

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
  convictedStatus?: ConvictedStatus
}
export interface Visitor extends VisitorInfoDto {
  visitorDisplayId: string
  adult: boolean
}

export default class BookerService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly bookerRateLimit: RateLimitService,
    private readonly prisonerRateLimit: RateLimitService,
  ) {}

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const bookerReference = (await orchestrationApiClient.getBookerReference(authDetailDto)).value

    logger.info(`Booker reference ${bookerReference} retrieved`)
    return bookerReference
  }

  async registerPrisoner(bookerReference: string, prisoner: RegisterPrisonerForBookerDto): Promise<boolean> {
    const [withinBookerLimit, withinPrisonerLimit] = await Promise.all([
      this.bookerRateLimit.incrementAndCheckLimit(bookerReference),
      this.prisonerRateLimit.incrementAndCheckLimit(prisoner.prisonerId),
    ])

    if (!withinBookerLimit || !withinPrisonerLimit) {
      if (!withinBookerLimit) {
        logger.info(`Rate limit exceeded for booker ${bookerReference}`)
      }

      if (!withinPrisonerLimit) {
        logger.info(`Rate limit exceeded for prisoner ${prisoner.prisonerId}`)
      }
      throw new TooManyRequests()
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const result = await orchestrationApiClient.registerPrisoner(bookerReference, prisoner)

    const logMessage = result ? 'Registered' : 'Failed to register'
    logger.info(`${logMessage} prisoner ${prisoner.prisonerId} for booker ${bookerReference}`)
    return result
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
        convictedStatus: prisoner.convictedStatus,
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
}
