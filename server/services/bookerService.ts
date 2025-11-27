import { randomUUID } from 'crypto'
import { TooManyRequests } from 'http-errors'
import { differenceInDays } from 'date-fns'
import logger from '../../logger'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import {
  AddVisitorToBookerPrisonerRequestDto,
  AuthDetailDto,
  BookerPrisonerValidationErrorResponse,
  BookerPrisonerVisitorRequestDto,
  BookerVisitorRequestValidationErrorResponse,
  ConvictedStatus,
  RegisterPrisonerForBookerDto,
} from '../data/orchestrationApiTypes'
import { SanitisedError } from '../sanitisedError'
import RateLimitService from './rateLimitService'

import { isAdult } from '../utils/utils'

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

export type Visitor = {
  visitorDisplayId: string
  visitorId: number
  firstName: string
  lastName: string
  dateOfBirth: string
  adult: boolean
  banned: boolean
  banExpiryDate?: string
}

export type VisitorsByEligibility = {
  eligibleVisitors?: Visitor[]
  ineligibleVisitors?: Visitor[]
}

export default class BookerService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly bookerRateLimit: RateLimitService,
    private readonly prisonerRateLimit: RateLimitService,
    private readonly visitorRateLimit: RateLimitService,
  ) {}

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const bookerReference = (await orchestrationApiClient.getBookerReference(authDetailDto)).value

    logger.info(`Booker reference ${bookerReference} retrieved`)
    return bookerReference
  }

  async getActiveVisitorRequests(bookerReference: string): Promise<BookerPrisonerVisitorRequestDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getActiveVisitorRequests(bookerReference)
  }

  async addVisitorRequest({
    bookerReference,
    prisonerId,
    addVisitorRequest,
  }: {
    bookerReference: string
    prisonerId: string
    addVisitorRequest: AddVisitorToBookerPrisonerRequestDto
  }): Promise<true | BookerVisitorRequestValidationErrorResponse['validationError']> {
    const withinVisitorRequestLimit = await this.visitorRateLimit.incrementAndCheckLimit(bookerReference)

    if (!withinVisitorRequestLimit) {
      logger.info(`Rate limit exceeded for visitor requests for booker ${bookerReference}`)
      throw new TooManyRequests()
    }

    const token = await this.hmppsAuthClient.getSystemClientToken()
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const result = await orchestrationApiClient.addVisitorRequest({ bookerReference, prisonerId, addVisitorRequest })

    const logMessage = result === true ? 'Requested' : `Failed (${result})`
    logger.info(`${logMessage} adding visitor to prisoner ${prisonerId} for booker ${bookerReference}`)
    return result
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
      return {
        visitorDisplayId: randomUUID(),
        visitorId: visitor.visitorId,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        dateOfBirth: visitor.dateOfBirth ?? '',
        adult: isAdult(visitor.dateOfBirth),
        // API only returns single BAN with furthest expiry date (or null for indefinite) - so no need to handle overlapping BANs
        banned: visitor.visitorRestrictions.some(restriction => restriction.restrictionType === 'BAN'),
        banExpiryDate: visitor.visitorRestrictions.find(restriction => restriction.restrictionType === 'BAN')
          ?.expiryDate,
      }
    })
  }

  async getVisitorsByEligibility(
    bookerReference: string,
    prisonerNumber: string,
    policyNoticeDaysMax: number,
  ): Promise<VisitorsByEligibility> {
    const eligibleVisitors: Visitor[] = []
    const ineligibleVisitors: Visitor[] = []

    const visitors = await this.getVisitors(bookerReference, prisonerNumber)

    const today = new Date()
    visitors.forEach(visitor => {
      let eligible = !visitor.banned

      if (visitor.banned && visitor.banExpiryDate) {
        const daysUntilBanExpires = differenceInDays(visitor.banExpiryDate, today)
        eligible = daysUntilBanExpires < policyNoticeDaysMax
      }

      if (eligible) {
        eligibleVisitors.push(visitor)
      } else {
        ineligibleVisitors.push(visitor)
      }
    })

    return { eligibleVisitors, ineligibleVisitors }
  }
}
