import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { Prisoner } from '../../services/bookerService'
import { createMockBookerService, createMockPrisonService } from '../../services/testutils/mocks'
import { BookerPrisonerValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { CannotBookReason } from '../../@types/bapv'

jest.mock('../../../logger')

let app: Express
const bookerService = createMockBookerService()
const prisonService = createMockPrisonService()
let sessionData: SessionData

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select prisoner', () => {
  const bookerReference = TestData.bookerReference().value
  const prison = TestData.prisonDto()
  const prisoner = TestData.prisoner()
  const bookingConfirmed = TestData.bookingConfirmed()

  beforeEach(() => {
    prisonService.getPrison.mockResolvedValue(prison)
  })

  it('should use the session validation middleware', () => {
    sessionData = {
      booker: { reference: bookerReference },
    } as SessionData

    app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .expect(302)
      .expect('Location', paths.HOME)
      .expect(() => {
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
      })
  })

  it('should clear any exiting bookingJourney session data, populate new data and redirect to select visitors page', () => {
    bookerService.validatePrisoner.mockResolvedValue(true)

    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisoner] },
      bookingJourney: { prisoner: { prisonerNumber: 'OLD JOURNEY DATA' } as Prisoner },
      bookingConfirmed,
    } as SessionData

    app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .send({ prisonerDisplayId: prisoner.prisonerDisplayId.toString() })
      .expect(302)
      .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
      .expect(() => {
        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookingJourney: {
            prisoner,
            prison,
          },
        } as SessionData)

        expect(bookerService.validatePrisoner).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
        expect(prisonService.getPrison).toHaveBeenCalledWith(prisoner.prisonId)
      })
  })

  it('should reject an invalid prisoner number', () => {
    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisoner] },
    } as SessionData

    app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

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
            prisoners: [prisoner],
          },
        } as SessionData)
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

        app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

        return request(app)
          .post(paths.BOOK_VISIT.SELECT_PRISONER)
          .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId.toString() })
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
          .expect(() => {
            expect(sessionData).toStrictEqual({
              booker: {
                reference: bookerReference,
                prisoners: [prisonerWithNoVos],
              },
              bookingJourney: {
                prisoner: prisonerWithNoVos,
                prison,
                cannotBookReason,
              },
            } as SessionData)
          })
      },
    )

    it('should redirect to cannot book page with code NO_VO_BALANCE if prisoner has no VOs', () => {
      bookerService.validatePrisoner.mockResolvedValue(true)

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisonerWithNoVos] },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId.toString() })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisonerWithNoVos],
            },
            bookingJourney: {
              prisoner: prisonerWithNoVos,
              prison,
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

      app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })

      return request(app)
        .post(paths.BOOK_VISIT.SELECT_PRISONER)
        .send({ prisonerDisplayId: remandPrisoner.prisonerDisplayId.toString() })
        .expect(302)
        .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [remandPrisoner],
            },
            bookingJourney: {
              prisoner: remandPrisoner,
              prison,
            },
          } as SessionData)
        })
    })
  })
})
