import { BadRequest } from 'http-errors'
import BookerService, { Prisoner, Visitor } from './bookerService'
import TestData from '../routes/testutils/testData'
import { createMockHmppsAuthClient, createMockOrchestrationApiClient } from '../data/testutils/mocks'
import { PrisonerValidationErrorResponse } from '../data/orchestrationApiTypes'
import { SanitisedError } from '../sanitisedError'

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

  beforeEach(() => {
    uuidCount = 0
    hmppsAuthClient.getSystemClientToken.mockResolvedValue(token)

    orchestrationApiClientFactory.mockReturnValue(orchestrationApiClient)
    bookerService = new BookerService(orchestrationApiClientFactory, hmppsAuthClient)
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

  describe('getPrisoners', () => {
    it('should return prisoners for the given booker reference, with UUID display IDs added', async () => {
      const bookerReference = TestData.bookerReference()
      const prisoner1 = {
        prisonerNumber: 'A',
        firstName: 'F1',
        lastName: 'L1',
        prisonId: 'P1',
        prisonName: 'P1 (HMP)',
        registeredPrisonId: 'RP1',
        registeredPrisonName: 'RP1 (HMP)',
        availableVos: 1,
        nextAvailableVoDate: '2024-06-01',
      }
      const prisoner2 = {
        prisonerNumber: 'B',
        firstName: 'F2',
        lastName: 'L2',
        prisonId: 'P2',
        prisonName: 'P2 (HMP)',
        registeredPrisonId: 'RP2',
        registeredPrisonName: 'RP2 (HMP)',
        availableVos: 2,
        nextAvailableVoDate: '2024-06-02',
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
      const prisonerReleasedException: SanitisedError<PrisonerValidationErrorResponse> = {
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

  describe('getEligibleVisitors', () => {
    it('should return eligible visitors (those having no restrictions) for the given booker reference and prisoner number', async () => {
      const bookerReference = TestData.bookerReference()
      const { prisonerNumber } = TestData.bookerPrisonerInfoDto().prisoner
      const visitorInfoDtos = [
        TestData.visitorInfoDto({ visitorId: 100 }),
        TestData.visitorInfoDto({ visitorId: 200, visitorRestrictions: [{ restrictionType: 'BAN' }] }),
      ]
      const expectedVisitors: Visitor[] = [{ ...visitorInfoDtos[0], visitorDisplayId: 'uuidv4-1', adult: true }]

      orchestrationApiClient.getVisitors.mockResolvedValue(visitorInfoDtos)

      const results = await bookerService.getEligibleVisitors(bookerReference.value, prisonerNumber)

      expect(orchestrationApiClient.getVisitors).toHaveBeenCalledWith(bookerReference.value, prisonerNumber)
      expect(results).toStrictEqual(expectedVisitors)
    })
  })
})
