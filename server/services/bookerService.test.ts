import { BadRequest, TooManyRequests } from 'http-errors'
import BookerService, { Prisoner, Visitor, VisitorsByStatus } from './bookerService'
import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import { BookerPrisonerValidationErrorResponse } from '../data/orchestrationApiTypes'
import { SanitisedError } from '../sanitisedError'
import logger from '../../logger'
import { createMockRateLimitService } from './testutils/mocks'

jest.mock('../../logger')

const token = 'some token'

let uuidCount: number
jest.mock('crypto', () => {
  return {
    randomUUID: () => {
      uuidCount += 1
      return `uuidv4-${uuidCount}`
    },
  }
})

describe('Booker service', () => {
  const hmppsAuthClient = createMockHmppsAuthClient()

  const orchestrationApiClient = createMockOrchestrationApiClient()
  const orchestrationApiClientFactory = jest.fn()

  let bookerService: BookerService
  const bookerRateLimit = createMockRateLimitService()
  const prisonerRateLimit = createMockRateLimitService()

  beforeEach(() => {
    uuidCount = 0
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    bookerService = new BookerService(
      orchestrationApiClientFactory,
      hmppsAuthClient,
      bookerRateLimit,
      prisonerRateLimit,
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getBookerReference', () => {
    it('should return booker reference for given AuthDetailDto', async () => {
      const authDetailDto = TestData.authDetailDto()
      const bookerReference = TestData.bookerReference()
      orchestrationApiClient.getBookerReference.mockResolvedValue(bookerReference)

      const result = await bookerService.getBookerReference(authDetailDto)

      expect(orchestrationApiClient.getBookerReference).toHaveBeenCalledWith(authDetailDto)
      expect(result).toBe(bookerReference.value)
    })
  })

  describe('registerPrisoner', () => {
    const bookerReference = TestData.bookerReference().value
    const registerPrisonerForBookerDto = TestData.registerPrisonerForBookerDto()

    beforeEach(() => {
      bookerRateLimit.incrementAndCheckLimit.mockResolvedValue(true)
      prisonerRateLimit.incrementAndCheckLimit.mockResolvedValue(true)
    })

    it('should attempt to register a prisoner and log success', async () => {
      orchestrationApiClient.registerPrisoner.mockResolvedValue(true)

      const result = await bookerService.registerPrisoner(bookerReference, registerPrisonerForBookerDto)

      expect(result).toBe(true)
      expect(orchestrationApiClient.registerPrisoner).toHaveBeenCalledWith(
        bookerReference,
        registerPrisonerForBookerDto,
      )
      expect(logger.info).toHaveBeenCalledWith(
        `Registered prisoner ${registerPrisonerForBookerDto.prisonerId} for booker ${bookerReference}`,
      )
    })

    it('should attempt to register a prisoner and log failure', async () => {
      orchestrationApiClient.registerPrisoner.mockResolvedValue(false)

      const result = await bookerService.registerPrisoner(bookerReference, registerPrisonerForBookerDto)

      expect(result).toBe(false)
      expect(orchestrationApiClient.registerPrisoner).toHaveBeenCalledWith(
        bookerReference,
        registerPrisonerForBookerDto,
      )
      expect(logger.info).toHaveBeenCalledWith(
        `Failed to register prisoner ${registerPrisonerForBookerDto.prisonerId} for booker ${bookerReference}`,
      )
    })

    describe('Rate limiting', () => {
      it('should throw a Too Many Requests error if booker rate limit exceeded', async () => {
        bookerRateLimit.incrementAndCheckLimit.mockResolvedValue(false)

        await expect(bookerService.registerPrisoner(bookerReference, registerPrisonerForBookerDto)).rejects.toThrow(
          TooManyRequests,
        )

        expect(logger.info).toHaveBeenCalledWith('Rate limit exceeded for booker aaaa-bbbb-cccc')
        expect(orchestrationApiClient.registerPrisoner).not.toHaveBeenCalled()
      })

      it('should throw a Too Many Requests error if prisoner rate limit exceeded', async () => {
        prisonerRateLimit.incrementAndCheckLimit.mockResolvedValue(false)

        await expect(bookerService.registerPrisoner(bookerReference, registerPrisonerForBookerDto)).rejects.toThrow(
          TooManyRequests,
        )

        expect(logger.info).toHaveBeenCalledWith('Rate limit exceeded for prisoner A1234BC')
        expect(orchestrationApiClient.registerPrisoner).not.toHaveBeenCalled()
      })

      it('should throw a Too Many Requests error if both booker and prisoner rate limit exceeded', async () => {
        bookerRateLimit.incrementAndCheckLimit.mockResolvedValue(false)
        prisonerRateLimit.incrementAndCheckLimit.mockResolvedValue(false)

        await expect(bookerService.registerPrisoner(bookerReference, registerPrisonerForBookerDto)).rejects.toThrow(
          TooManyRequests,
        )

        expect(logger.info).toHaveBeenCalledWith('Rate limit exceeded for booker aaaa-bbbb-cccc')
        expect(logger.info).toHaveBeenCalledWith('Rate limit exceeded for prisoner A1234BC')
        expect(orchestrationApiClient.registerPrisoner).not.toHaveBeenCalled()
      })
    })
  })

  describe('getPrisoners', () => {
    it('should return prisoners for the given booker reference, with UUID display IDs added', async () => {
      const bookerReference = TestData.bookerReference()
      const prisoner1: Omit<Prisoner, 'prisonerDisplayId'> = {
        prisonerNumber: 'A',
        firstName: 'F1',
        lastName: 'L1',
        prisonId: 'P1',
        prisonName: 'P1 (HMP)',
        registeredPrisonId: 'RP1',
        registeredPrisonName: 'RP1 (HMP)',
        availableVos: 1,
        nextAvailableVoDate: '2024-06-01',
        convictedStatus: 'Convicted',
      }
      const prisoner2: Omit<Prisoner, 'prisonerDisplayId'> = {
        prisonerNumber: 'B',
        firstName: 'F2',
        lastName: 'L2',
        prisonId: 'P2',
        prisonName: 'P2 (HMP)',
        registeredPrisonId: 'RP2',
        registeredPrisonName: 'RP2 (HMP)',
        availableVos: 2,
        nextAvailableVoDate: '2024-06-02',
        convictedStatus: 'Convicted',
      }
      const bookerPrisonerInfoDtos = [
        TestData.bookerPrisonerInfoDto(prisoner1),
        TestData.bookerPrisonerInfoDto(prisoner2),
      ]

      const expectedPrisoners: Prisoner[] = [
        { prisonerDisplayId: 'uuidv4-1', ...prisoner1 },
        { prisonerDisplayId: 'uuidv4-2', ...prisoner2 },
      ]

      orchestrationApiClient.getPrisoners.mockResolvedValue(bookerPrisonerInfoDtos)

      const results = await bookerService.getPrisoners(bookerReference.value)

      expect(orchestrationApiClient.getPrisoners).toHaveBeenCalledWith(bookerReference.value)
      expect(results).toStrictEqual(expectedPrisoners)
    })
  })

  describe('validatePrisoner', () => {
    const bookerReference = TestData.bookerReference()
    const { prisoner } = TestData.bookerPrisonerInfoDto()

    it('should return true if given booker/prisoner validates', async () => {
      orchestrationApiClient.validatePrisoner.mockResolvedValue(true)

      const result = await bookerService.validatePrisoner(bookerReference.value, prisoner.prisonerNumber)

      expect(result).toBe(true)
      expect(orchestrationApiClient.validatePrisoner).toHaveBeenCalledWith(
        bookerReference.value,
        prisoner.prisonerNumber,
      )
    })

    it('should return validationError if API returns an HTTP 422 response', async () => {
      const prisonerReleasedException: SanitisedError<BookerPrisonerValidationErrorResponse> = {
        name: 'Error',
        status: 422,
        message: '',
        stack: '',
        data: { status: 422, validationError: 'PRISONER_RELEASED' },
      }
      orchestrationApiClient.validatePrisoner.mockRejectedValue(prisonerReleasedException)

      const result = await bookerService.validatePrisoner(bookerReference.value, prisoner.prisonerNumber)

      expect(result).toBe('PRISONER_RELEASED')
      expect(orchestrationApiClient.validatePrisoner).toHaveBeenCalledWith(
        bookerReference.value,
        prisoner.prisonerNumber,
      )
    })

    it('should throw any other API error', async () => {
      const apiError = new BadRequest('API error')
      orchestrationApiClient.validatePrisoner.mockRejectedValue(apiError)

      await expect(
        bookerService.validatePrisoner(bookerReference.value, prisoner.prisonerNumber),
      ).rejects.toStrictEqual(apiError)

      expect(orchestrationApiClient.validatePrisoner).toHaveBeenCalledWith(
        bookerReference.value,
        prisoner.prisonerNumber,
      )
    })
  })

  describe('getVisitors', () => {
    it('should return visitors for the given booker reference and prisoner number, with sequential display ID and adult (boolean) added', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner
      const visitorInfoDtos = [
        TestData.visitorInfoDto({ visitorId: 100, dateOfBirth: '2000-01-01' }), // an adult
        TestData.visitorInfoDto({ visitorId: 200, dateOfBirth: `${new Date().getFullYear() - 2}-01-01` }), // a child
      ]
      const expectedVisitors: Visitor[] = [
        { ...visitorInfoDtos[0], visitorDisplayId: 'uuidv4-1', adult: true },
        { ...visitorInfoDtos[1], visitorDisplayId: 'uuidv4-2', adult: false },
      ]

      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const results = await bookerService.getVisitors(bookerReference.value, prisonerNumber)

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
      expect(results).toStrictEqual(expectedVisitors)
    })
  })

  describe('getVisitorsByStatus', () => {
    it('should return two visitor arrays (eligibile and ineligible) for the given bookerReference, prisonerNumber and policyNoticeDaysMax (maximum booking window for prison)', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner
      const visitorInfoDtos = [
        TestData.visitorInfoDto({ visitorId: 100 }),
        TestData.visitorInfoDto({ visitorId: 200, visitorRestrictions: [{ restrictionType: 'BAN' }] }),
      ]

      const visitorArrays: VisitorsByStatus = {
        eligibleVisitors: [
          {
            ...visitorInfoDtos[0],
            visitorDisplayId: 'uuidv4-1',
            adult: true,
            eligible: true,
            banned: false,
            banExpiryDate: undefined,
          },
        ],
        ineligibleVisitors: [
          {
            ...visitorInfoDtos[1],
            visitorDisplayId: 'uuidv4-2',
            adult: true,
            eligible: false,
            banned: true,
            banExpiryDate: undefined,
          },
        ],
      }

      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const results = await bookerService.getVisitorsByStatus(bookerReference.value, prisonerNumber, 60)

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
      expect(results).toStrictEqual(visitorArrays)
    })
  })
})
