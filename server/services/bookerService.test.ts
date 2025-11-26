import { BadRequest, TooManyRequests } from 'http-errors'
import BookerService, { Prisoner, Visitor } from './bookerService'
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

  describe('getActiveVisitorRequests', () => {
    it('should active visitor requests for provided booker reference', async () => {
      const activeVisitorRequests = [TestData.activeVisitorRequest()]
      const bookerReference = TestData.bookerReference()
      orchestrationApiClient.getActiveVisitorRequests.mockResolvedValue(activeVisitorRequests)

      const result = await bookerService.getActiveVisitorRequests(bookerReference.value)

      expect(orchestrationApiClient.getActiveVisitorRequests).toHaveBeenCalledWith(bookerReference.value)
      expect(result).toBe(activeVisitorRequests)
    })
  })

  describe('addVisitorRequest', () => {
    const bookerReference = 'aaaa-bbbb-cccc'
    const prisonerId = 'A1234BC'
    const addVisitorRequest = TestData.addVisitorRequest()

    it('should send a request to add a visitor and return true', async () => {
      orchestrationApiClient.addVisitorRequest.mockResolvedValue(true)

      const result = await bookerService.addVisitorRequest({ bookerReference, prisonerId, addVisitorRequest })

      expect(result).toBe(true)
      expect(orchestrationApiClient.addVisitorRequest).toHaveBeenCalledWith({
        bookerReference,
        prisonerId,
        addVisitorRequest,
      })
      expect(logger.info).toHaveBeenCalledWith(
        `Requested adding visitor to prisoner ${prisonerId} for booker ${bookerReference}`,
      )
    })

    it('should send a request to add a visitor and return validation error if it fails', async () => {
      orchestrationApiClient.addVisitorRequest.mockResolvedValue('REQUEST_ALREADY_EXISTS')

      const result = await bookerService.addVisitorRequest({ bookerReference, prisonerId, addVisitorRequest })

      expect(result).toBe('REQUEST_ALREADY_EXISTS')
      expect(orchestrationApiClient.addVisitorRequest).toHaveBeenCalledWith({
        bookerReference,
        prisonerId,
        addVisitorRequest,
      })
      expect(logger.info).toHaveBeenCalledWith(
        `Failed (REQUEST_ALREADY_EXISTS) adding visitor to prisoner ${prisonerId} for booker ${bookerReference}`,
      )
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
    it('should return visitors for the given booker reference and prisoner number, with sequential display ID', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner

      const visitorInfoDtos = [
        TestData.visitorInfoDto({ visitorId: 1, dateOfBirth: '2000-01-01' }), // an adult
        TestData.visitorInfoDto({ visitorId: 2, dateOfBirth: `${new Date().getFullYear() - 2}-01-01` }), // a child
        // with a ban with expiry date
        TestData.visitorInfoDto({
          visitorId: 3,
          dateOfBirth: '2000-01-01',
          visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: '2025-07-01' }],
        }),
        // with a ban with no expiry date
        TestData.visitorInfoDto({
          visitorId: 4,
          dateOfBirth: '2000-01-01',
          visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: undefined }],
        }),
      ]
      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const expectedVisitors: Visitor[] = [
        {
          ...TestData.visitor(visitorInfoDtos[0]),
          visitorDisplayId: 'uuidv4-1',
          adult: true,
          banned: false,
        },
        {
          ...TestData.visitor(visitorInfoDtos[1]),
          visitorDisplayId: 'uuidv4-2',
          adult: false,
          banned: false,
        },
        {
          ...TestData.visitor(visitorInfoDtos[2]),
          visitorDisplayId: 'uuidv4-3',
          adult: true,
          banned: true,
          banExpiryDate: '2025-07-01',
        },
        {
          ...TestData.visitor(visitorInfoDtos[3]),
          visitorDisplayId: 'uuidv4-4',
          adult: true,
          banned: true,
        },
      ]

      const results = await bookerService.getVisitors(bookerReference.value, prisonerNumber)

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
      expect(results).toStrictEqual(expectedVisitors)
    })
  })

  describe('getVisitorsByEligibility', () => {
    const fakeDate = new Date('2025-01-01T09:00:00')
    const policyNoticeDaysMax = 28

    beforeEach(() => {
      jest.useFakeTimers({ now: fakeDate })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return visitors split by eligibility for booking (determined by BAN dates and booking window)', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner

      const visitorInfoDtos = [
        // No ban (eligible)
        TestData.visitorInfoDto({ firstName: 'Visitor', lastName: 'One', dateOfBirth: '2000-08-01' }),
        // Indefinite ban (ineligible)
        TestData.visitorInfoDto({
          firstName: 'Visitor',
          lastName: 'Two',
          dateOfBirth: '2000-08-02',
          visitorRestrictions: [{ restrictionType: 'BAN' }],
        }),
        // Ban with an expiry date WITHIN booking window (eligible)
        TestData.visitorInfoDto({
          firstName: 'Visitor',
          lastName: 'Three',
          dateOfBirth: '2000-08-03',
          visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: '2025-01-29' }], // expires on last day of booking window
        }),
        // Ban with an expiry date BEYOND booking window (ineligible)
        TestData.visitorInfoDto({
          firstName: 'Visitor',
          lastName: 'Four',
          dateOfBirth: '2000-08-04',
          visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: '2025-01-30' }], // expires day after booking window
        }),
      ]
      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const results = await bookerService.getVisitorsByEligibility(
        bookerReference.value,
        prisonerNumber,
        policyNoticeDaysMax,
      )

      expect(results.eligibleVisitors.length).toBe(2)
      expect(results.ineligibleVisitors.length).toBe(2)

      expect(results.eligibleVisitors[0].lastName).toBe('One')
      expect(results.eligibleVisitors[1].lastName).toBe('Three')
      expect(results.ineligibleVisitors[0].lastName).toBe('Two')
      expect(results.ineligibleVisitors[1].lastName).toBe('Four')

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
    })
  })
})
