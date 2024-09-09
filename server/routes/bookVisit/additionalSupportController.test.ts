import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, FlashErrors, FlashFormValues, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import config from '../../config'
import { SessionRestriction } from '../../data/orchestrationApiClient'

jest.mock('../../../logger')

let app: Express

let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()
const sessionRestriction: SessionRestriction = 'OPEN'
const visitSession = TestData.availableVisitSessionDto()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Additional support needs', () => {
  describe(`GET ${paths.BOOK_VISIT.ADDITIONAL_SUPPORT}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: [visitor],
          selectedVisitors: [visitor],
          sessionRestriction,
          allVisitSessionIds: ['2024-05-30_a'],
          allVisitSessions: [visitSession],
          selectedVisitSession: visitSession,
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })
    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render additional support page', () => {
      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Is additional support needed for any of the visitors?\? -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.CHOOSE_TIME)
          expect($('h1').text()).toBe('Is additional support needed for any of the visitors?')

          expect($('[data-test=prison-name]').text().trim()).toContain('Hewell (HMP)')

          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          expect($('input[name=additionalSupportRequired]:checked').length).toBe(0)
          expect($('input[name=additionalSupport]').val()).toBe(undefined)

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should add application reference as a test data attribute in dev', () => {
      const replacedProp = jest.replaceProperty(config, 'environmentName', 'DEV')
      app = appWithAllRoutes({ sessionData })

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test-app-ref]').attr('data-test-app-ref')).toBe(
            sessionData.bookingJourney.applicationReference,
          )
          replacedProp.replaceValue('environmentName')
        })
    })

    it('should not add application reference as a test data attribute in production', () => {
      const replacedProp = jest.replaceProperty(config, 'environmentName', 'PRODUCTION')
      app = appWithAllRoutes({ sessionData })

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test-app-ref]').attr('data-test-app-ref')).toBe('')
          replacedProp.replaceValue('environmentName')
        })
    })

    it('should pre-populate with data in session (no support)', () => {
      sessionData.bookingJourney.visitorSupport = ''

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=additionalSupportRequired][value=no]').prop('checked')).toBe(true)
          expect($('input[name=additionalSupport]').val()).toBe('')
        })
    })

    it('should pre-populate with data in session (support required)', () => {
      sessionData.bookingJourney.visitorSupport = 'Wheelchair access'

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=additionalSupportRequired][value=yes]').prop('checked')).toBe(true)
          expect($('input[name=additionalSupport]').val()).toBe('Wheelchair access')
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.bookingJourney.visitorSupport = 'Wheelchair access'
      const formValues = { additionalSupportRequired: 'no', additionalSupport: '' }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=additionalSupportRequired][value=no]').prop('checked')).toBe(true)
          expect($('input[name=additionalSupport]').val()).toBe('')
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'additionalSupport',
        value: [],
        msg: 'Enter details of the request',
      }
      const formValues = { additionalSupportRequired: 'yes' }
      flashData = { errors: [validationError], formValues: [formValues] }

      return request(app)
        .get(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#additionalSupport-error"]').text()).toBe(
            'Enter details of the request',
          )
          expect($('#additionalSupport-error').text()).toContain('Enter details of the request')
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.ADDITIONAL_SUPPORT}`, () => {
    beforeEach(() => {
      sessionData = {
        booker: {
          reference: bookerReference,
          prisoners: [prisoner],
        },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: [visitor],
          selectedVisitors: [visitor],
          sessionRestriction,
          allVisitSessionIds: ['2024-05-30_a'],
          allVisitSessions: [visitSession],
          selectedVisitSession: visitSession,
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should should save entered additional support to session and redirect to main contact page', () => {
      return request(app)
        .post(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .send({ additionalSupportRequired: 'yes', additionalSupport: 'Wheelchair access' })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.visitorSupport).toBe('Wheelchair access')
        })
    })

    it('should should save no additional support choice to session and redirect to main contact page', () => {
      return request(app)
        .post(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .send({ additionalSupportRequired: 'no' })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.MAIN_CONTACT)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.visitorSupport).toBe('')
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FlashErrors
      let expectedFlashFormValues: FlashFormValues

      it('should discard any unexpected form data', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'additionalSupportRequired',
            value: undefined,
            msg: 'No answer selected',
          },
        ]
        expectedFlashFormValues = { additionalSupport: '' }

        return request(app)
          .post(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .send({ unexpected: 'data' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.visitorSupport).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when no options selected', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'additionalSupportRequired',
            value: undefined,
            msg: 'No answer selected',
          },
        ]
        expectedFlashFormValues = { additionalSupport: '' }

        return request(app)
          .post(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.visitorSupport).toBe(undefined)
          })
      })

      it('should set a validation error and redirect to original page when text length validation fails', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'additionalSupport',
            value: 'ab',
            msg: 'Please enter at least 3 and no more than 512 characters',
          },
        ]
        expectedFlashFormValues = { additionalSupportRequired: 'yes', additionalSupport: 'ab' }

        return request(app)
          .post(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .send({ additionalSupportRequired: 'yes', additionalSupport: 'ab' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.visitorSupport).toBe(undefined)
          })
      })
    })
  })
})
