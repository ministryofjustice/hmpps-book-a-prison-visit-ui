import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { Prisoner } from '../../services/bookerService'
import { createMockBookerService } from '../../services/testutils/mocks'
import { BookerPrisonerValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { CannotBookReason } from '../../@types/bapv'

jest.mock('../../../logger')

let app: Express
const bookerService = createMockBookerService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner1 = TestData.prisoner({ prisonerDisplayId: crypto.randomUUID() })
const prisoner2 = TestData.prisoner({
  prisonerNumber: 'B2345DC',
  prisonerDisplayId: crypto.randomUUID(),
  firstName: 'Bob',
  dateOfBirth: '1990-05-10',
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

          expect($('input#prisoner-1').val()).toBe(prisoner1.prisonerDisplayId)
          expect($('label[for="prisoner-1"]').text().trim()).toContain('John Smith')
          expect($('label[for="prisoner-1"]').text().trim()).toContain('(1 February 1980)')

          expect($('input#prisoner-2').val()).toBe(prisoner2.prisonerDisplayId)
          expect($('label[for="prisoner-2"]').text().trim()).toContain('Bob Smith')
          expect($('label[for="prisoner-2"]').text().trim()).toContain('(10 May 1990)')

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
          expect($('input#prisoner-2').prop('checked')).toBe(true)
        })
    })

    it('should render validation errors', () => {})
  })

  // FIXME un-skip and fix tests!
  describe.skip(`POST ${paths.BOOK_VISIT.SELECT_PRISONER}`, () => {
    const bookVisitConfirmed = TestData.bookVisitConfirmed()

    it('should use the session validation middleware', () => {
      sessionData = {
        booker: { reference: bookerReference },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .expect(302)
        .expect('Location', paths.VISITS.HOME)
        .expect(() => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should clear any exiting bookVisitJourney session data, populate new data and redirect to select visitors page', () => {
      bookerService.validatePrisoner.mockResolvedValue(true)

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner1] },
        bookVisitJourney: { prisoner: { prisonerNumber: 'OLD JOURNEY DATA' } as Prisoner },
        bookVisitConfirmed,
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner1.prisonerDisplayId.toString() })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner1],
            },
            bookVisitJourney: {
              prisoner: prisoner1,
              prisonId: prisoner1.prisonId,
            },
          } as SessionData)

          expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner1.prisonerNumber)
        })
    })

    it('should reject an invalid prisoner number', () => {
      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner1] },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: 1000 })
        .expect(404)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Prisoner not found')
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner1],
            },
          } as SessionData)
        })
    })

    it('should redirect to confirm location route, if prisoner not in registered prison', () => {
      sessionData = {
        booker: {
          reference: bookerReference,
          prisoners: [TestData.prisoner({ prisonId: 'HEI', registeredPrisonId: 'DHI' })],
        },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisoner1.prisonerDisplayId.toString() })
        .expect(302)
        .expect('location', paths.PRISONER_MOVED.CONFIRM_LOCATION)
        .expect(() => {
          expect(bookerService.validatePrisoner).not.toHaveBeenCalled()
        })
    })

    describe('Prisoner validation', () => {
      // testing all these scenarios with no VO balance as validation failures should take precedence
      const prisonerWithNoVos = TestData.prisoner({ availableVos: -1 })
      const remandPrisoner = TestData.prisoner({ availableVos: 0, convictedStatus: 'Remand' })

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

          sessionData = {
            booker: { reference: bookerReference, prisoners: [prisonerWithNoVos] },
          } as SessionData

          app = appWithAllRoutes({ services: { bookerService }, sessionData })

          return request(app)
            .post(paths.BOOK_VISIT.SELECT_PRISONER)
            .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId.toString() })
            .expect(302)
            .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
            .expect(() => {
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
        const prisonerInTransfer = TestData.prisoner({ prisonId: 'TRN' })

        sessionData = {
          booker: { reference: bookerReference, prisoners: [prisonerInTransfer] },
        } as SessionData

        app = appWithAllRoutes({ services: { bookerService }, sessionData })

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: prisonerInTransfer.prisonerDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
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
        const releasedPrisoner = TestData.prisoner({ prisonId: 'OUT' })

        sessionData = {
          booker: { reference: bookerReference, prisoners: [releasedPrisoner] },
        } as SessionData

        app = appWithAllRoutes({ services: { bookerService }, sessionData })

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: releasedPrisoner.prisonerDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
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

        sessionData = {
          booker: { reference: bookerReference, prisoners: [prisonerWithNoVos] },
        } as SessionData

        app = appWithAllRoutes({ services: { bookerService }, sessionData })

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
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

        sessionData = {
          booker: { reference: bookerReference, prisoners: [remandPrisoner] },
        } as SessionData

        app = appWithAllRoutes({ services: { bookerService }, sessionData })

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: remandPrisoner.prisonerDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
          .expect(() => {
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
  })
})
