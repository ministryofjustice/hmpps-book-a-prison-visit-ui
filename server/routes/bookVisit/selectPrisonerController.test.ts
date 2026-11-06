import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { Prisoner } from '../../services/bookerService'
import { createMockBookerService } from '../../services/testutils/mocks'
import { BookerPrisonerValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { BookVisitJourney, CannotBookReason, FlashFormValues } from '../../@types/bapv'
import { disableFeatureForTest, enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'
import * as utils from '../../utils/utils'

jest.mock('../../../logger')

let app: Express
const bookerService = createMockBookerService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner1 = TestData.prisoner({ prisonerDisplayId: randomUUID() })
const prisoner2 = TestData.prisoner({
  prisonerNumber: 'B2345DC',
  prisonerDisplayId: randomUUID(),
  firstName: 'Bob',
  dateOfBirth: '1990-05-10',
})

beforeEach(() => {
  enableFeatureForTest('multiplePrisoners')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select prisoner', () => {
  describe(`GET ${paths.BOOK_VISIT.SELECT_PRISONER}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [] as Prisoner[] },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should use the session validation middleware', () => {
      sessionData.bookVisitJourney = undefined
      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect(302)
        .expect('Location', paths.VISITS.HOME)
        .expect(() => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render page without radios when booker has only ONE prisoner', () => {
      sessionData.booker!.prisoners = [prisoner1]

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Who are you visiting\? -/)
          expect($('#navigation').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('h1').text()).toBe('Who are you visiting?')

          // Select prisoner form
          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
          expect($('input[type=hidden][name=prisonerDisplayId]').val()).toBe(prisoner1.prisonerDisplayId)
          expect($('input[type=radio]').length).toBe(0)
          expect($('[data-test="prisoner-1"]').text().trim()).toContain('John Smith')
          expect($('[data-test="prisoner-1"]').text().trim()).toContain('(1 February 1980)')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect($('[data-test="link-new-prisoner"]').text()).toBe('Link a new prisoner')
          expect($('[data-test="link-new-prisoner"]').attr('href')).toBe(paths.ADD_PRISONER.LOCATION)
        })
    })

    it('should render page with radios when booker has MULTIPLE prisoners', () => {
      sessionData.booker!.prisoners = [prisoner1, prisoner2]

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          // Select prisoner form
          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
          expect($('input[type=hidden][name=prisonerDisplayId]').length).toBe(0)
          expect($('input[type=radio]').length).toBe(2)
          expect($('input[type=radio]:checked').length).toBe(0)

          expect($('input[data-test="prisoner-1"]').val()).toBe(prisoner1.prisonerDisplayId)
          expect($('input[data-test="prisoner-1"]').next('label').text()).toContain('John Smith')
          expect($('input[data-test="prisoner-1"]').next('label').text()).toContain('(1 February 1980)')

          expect($('input[data-test="prisoner-2"]').val()).toBe(prisoner2.prisonerDisplayId)
          expect($('input[data-test="prisoner-2"]').next('label').text()).toContain('Bob Smith')
          expect($('input[data-test="prisoner-2"]').next('label').text()).toContain('(10 May 1990)')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should pre-populate with data in session (e.g. returning from later journey step)', () => {
      sessionData.booker!.prisoners = [prisoner1, prisoner2]
      sessionData.bookVisitJourney = { prisoner: prisoner2, prisonId: prisoner2.prisonId! }

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          expect($('input[type=hidden][name=prisonerDisplayId]').length).toBe(0)
          expect($('input[type=radio]').length).toBe(2)
          expect($('input[type=radio]:checked').length).toBe(1)
          expect($('input[data-test="prisoner-2"]').prop('checked')).toBe(true)
        })
    })

    it('should render validation errors', () => {
      sessionData.booker!.prisoners = [prisoner1, prisoner2]

      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'prisonerDisplayId',
        value: [],
        msg: 'validation error message',
      }
      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#prisonerDisplayId"]').text()).toBe('validation error message')
          expect($('#prisonerDisplayId-error').text()).toContain('validation error message')
        })
    })

    it('should NOT show link new prisoner button if multiple prisoners feature disabled', () => {
      disableFeatureForTest('multiplePrisoners')
      app = appWithAllRoutes({ sessionData })
      sessionData.booker!.prisoners = [prisoner1]

      return request(app)
        .get(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="link-new-prisoner"]').length).toBe(0)
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.SELECT_PRISONER}`, () => {
    let clearSession: jest.SpyInstance

    beforeEach(() => {
      clearSession = jest.spyOn(utils, 'clearSession')
      sessionData = {} as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should clear session, populate new booking session and redirect to select visitors page - NEW JOURNEY', () => {
      bookerService.validatePrisoner.mockResolvedValue(true)

      // new journey because no 'bookVisitJourney' data
      sessionData.booker = { reference: bookerReference, prisoners: [prisoner1, prisoner2] }

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner2.prisonerDisplayId })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner1, prisoner2],
            },
            bookVisitJourney: {
              prisoner: prisoner2,
              prisonId: prisoner2.prisonId,
            },
          } as SessionData)

          expect(flashProvider).not.toHaveBeenCalled()
          expect(clearSession).toHaveBeenCalled()
          expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner2.prisonerNumber)
        })
    })

    // e.g. user has gone back to select prisoner page but does not change selection
    it('should retain booking session data and redirect to select visitors page - EXISTING JOURNEY FOR SAME PRISONER', () => {
      bookerService.validatePrisoner.mockResolvedValue(true)

      sessionData.booker = { reference: bookerReference, prisoners: [prisoner1, prisoner2] }
      sessionData.bookVisitJourney = {
        prisoner: prisoner2,
        prisonId: prisoner2.prisonId,
        data: 'more existing session data',
      } as BookVisitJourney

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner2.prisonerDisplayId })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner1, prisoner2],
            },
            bookVisitJourney: {
              prisoner: prisoner2,
              prisonId: prisoner2.prisonId,
              data: 'more existing session data',
            } as BookVisitJourney,
          } as SessionData)

          expect(flashProvider).not.toHaveBeenCalled()
          expect(clearSession).not.toHaveBeenCalled()
          expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner2.prisonerNumber)
        })
    })

    // e.g. user starts booking but goes back and now selects a different prisoner
    it('should clear session, populate new booking session and redirect to select visitors page - EXISTING JOURNEY BUT PRISONER CHANGED', () => {
      bookerService.validatePrisoner.mockResolvedValue(true)

      sessionData.booker = { reference: bookerReference, prisoners: [prisoner1, prisoner2] }
      sessionData.bookVisitJourney = {
        prisoner: prisoner2,
        prisonId: prisoner2.prisonId,
        data: 'more existing session data',
      } as BookVisitJourney

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner1.prisonerDisplayId }) // select a different prisoner
        .expect(302)
        .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner1, prisoner2],
            },
            bookVisitJourney: {
              prisoner: prisoner1,
              prisonId: prisoner1.prisonId,
            },
          } as SessionData)

          expect(flashProvider).not.toHaveBeenCalled()
          expect(clearSession).toHaveBeenCalled()
          expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner1.prisonerNumber)
        })
    })

    it('should redirect to confirm location route, if prisoner not in registered prison', () => {
      sessionData.booker = {
        reference: bookerReference,
        prisoners: [{ ...prisoner1, registeredPrisonId: 'DHI' }],
      }

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner1.prisonerDisplayId })
        .expect(302)
        .expect('location', paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(bookerService.validatePrisoner).not.toHaveBeenCalled()
        })
    })

    describe('Prisoner validation', () => {
      // testing all these scenarios with no VO balance as validation failures should take precedence
      const prisonerWithNoVos: Prisoner = { ...prisoner1, availableVos: -1 }
      const remandPrisoner: Prisoner = { ...prisoner1, availableVos: 0, convictedStatus: 'Remand' }

      it.each(<
        { errorCode: BookerPrisonerValidationErrorResponse['validationError']; cannotBookReason: CannotBookReason }[]
      >[
        { errorCode: 'PRISONER_RELEASED', cannotBookReason: 'TRANSFER_OR_RELEASE' },
        { errorCode: 'PRISONER_TRANSFERRED_SUPPORTED_PRISON', cannotBookReason: 'TRANSFER_OR_RELEASE' },
        { errorCode: 'PRISONER_TRANSFERRED_UNSUPPORTED_PRISON', cannotBookReason: 'TRANSFER_OR_RELEASE' },
        { errorCode: 'REGISTERED_PRISON_NOT_SUPPORTED', cannotBookReason: 'UNSUPPORTED_PRISON' },
      ])(
        'if prisoner validation fails with $errorCode, redirect to cannot book with code $cannotBookReason',
        ({ errorCode, cannotBookReason }) => {
          bookerService.validatePrisoner.mockResolvedValue(errorCode)

          sessionData.booker = { reference: bookerReference, prisoners: [prisonerWithNoVos] }

          return request(app)
            .post(paths.BOOK_VISIT.SELECT_PRISONER)
            .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId })
            .expect(302)
            .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
            .expect(() => {
              expect(flashProvider).not.toHaveBeenCalled()
              expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner1.prisonerNumber)

              expect(sessionData).toStrictEqual({
                booker: {
                  reference: bookerReference,
                  prisoners: [prisonerWithNoVos],
                },
                bookVisitJourney: {
                  prisoner: prisonerWithNoVos,
                  cannotBookReason,
                },
              } as SessionData)
            })
        },
      )

      it('should redirect to cannot book page for prisoner in transfer (TRN)', () => {
        bookerService.validatePrisoner.mockResolvedValue('PRISONER_TRANSFERRED_SUPPORTED_PRISON')
        const prisonerInTransfer = { ...prisoner1, prisonId: 'TRN' }

        sessionData.booker = { reference: bookerReference, prisoners: [prisonerInTransfer] }

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: prisonerInTransfer.prisonerDisplayId })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(bookerService.validatePrisoner).toHaveBeenCalledWith(
              bookerReference,
              prisonerInTransfer.prisonerNumber,
            )

            expect(sessionData).toStrictEqual({
              booker: {
                reference: bookerReference,
                prisoners: [prisonerInTransfer],
              },
              bookVisitJourney: {
                prisoner: prisonerInTransfer,
                cannotBookReason: 'TRANSFER_OR_RELEASE',
              },
            } as SessionData)
          })
      })

      it('should redirect to cannot book page for a released prisoner (OUT)', () => {
        bookerService.validatePrisoner.mockResolvedValue('PRISONER_RELEASED')
        const releasedPrisoner = { ...prisoner1, prisonId: 'OUT' }

        sessionData.booker = { reference: bookerReference, prisoners: [releasedPrisoner] }

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: releasedPrisoner.prisonerDisplayId })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(bookerService.validatePrisoner).toHaveBeenCalledWith(
              bookerReference,
              releasedPrisoner.prisonerNumber,
            )

            expect(sessionData).toStrictEqual({
              booker: {
                reference: bookerReference,
                prisoners: [releasedPrisoner],
              },
              bookVisitJourney: {
                prisoner: releasedPrisoner,
                cannotBookReason: 'TRANSFER_OR_RELEASE',
              },
            } as SessionData)
          })
      })

      it('should redirect to cannot book page with code NO_VO_BALANCE if prisoner has no VOs', () => {
        bookerService.validatePrisoner.mockResolvedValue(true)

        sessionData.booker = { reference: bookerReference, prisoners: [prisonerWithNoVos] }

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(bookerService.validatePrisoner).toHaveBeenCalledWith(
              bookerReference,
              prisonerWithNoVos.prisonerNumber,
            )

            expect(sessionData).toStrictEqual({
              booker: {
                reference: bookerReference,
                prisoners: [prisonerWithNoVos],
              },
              bookVisitJourney: {
                prisoner: prisonerWithNoVos,
                cannotBookReason: 'NO_VO_BALANCE',
              },
            } as SessionData)
          })
      })

      it('should allow prisoner on REMAND to book with no VO balance', () => {
        bookerService.validatePrisoner.mockResolvedValue(true)

        sessionData.booker = { reference: bookerReference, prisoners: [remandPrisoner] }

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: remandPrisoner.prisonerDisplayId })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, remandPrisoner.prisonerNumber)

            expect(sessionData).toStrictEqual({
              booker: {
                reference: bookerReference,
                prisoners: [remandPrisoner],
              },
              bookVisitJourney: {
                prisoner: remandPrisoner,
                prisonId: remandPrisoner.prisonId,
              },
            } as SessionData)
          })
      })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]
      let expectedFlashFormValues: FlashFormValues

      beforeEach(() => {
        sessionData.booker = { reference: bookerReference, prisoners: [prisoner1] }

        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'prisonerDisplayId', value: undefined, msg: 'No prisoner selected' },
        ]
        expectedFlashFormValues = { prisonerDisplayId: undefined }
      })

      it('should show a validation error if no prisoner is selected', () => {
        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_PRISONER)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookVisitJourney).toBe(undefined)
          })
      })

      it('should show a validation error if a UUID is not supplied', () => {
        const invalidUUID = 'not-a-uuid!'
        expectedFlashErrors[0].value = invalidUUID
        expectedFlashFormValues.prisonerDisplayId = invalidUUID

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: invalidUUID })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_PRISONER)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookVisitJourney).toBe(undefined)
          })
      })

      it('should show a validation error if prisoner UUID is not found', () => {
        const unknownUUID = randomUUID()
        expectedFlashErrors[0].value = unknownUUID
        expectedFlashFormValues.prisonerDisplayId = unknownUUID

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: unknownUUID })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.SELECT_PRISONER)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookVisitJourney).toBe(undefined)
          })
      })
    })
  })
})
