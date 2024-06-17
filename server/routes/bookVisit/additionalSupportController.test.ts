import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, FlashErrors, FlashFormValues, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'

let app: Express

let sessionData: SessionData

const url = '/book-visit/additional-support'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()

const visitSession = TestData.availableVisitSessionDto({ sessionDate: '2024-05-30', sessionTemplateReference: 'a' })

afterEach(() => {
  jest.resetAllMocks()
})

describe('Additional support needs', () => {
  describe(`GET ${url}`, () => {
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
          allVisitSessionIds: ['2024-05-30_a'],
          allVisitSessions: [visitSession],
          selectedVisitSession: visitSession,
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should render additional support page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Any additional support needs\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/book-visit/choose-visit-time')
          expect($('h1').text()).toBe('Is additional support needed for any of the visitors?')

          expect($('[data-test=prison-name]').text().trim()).toContain('Hewell (HMP)')

          expect($('form[method=POST]').attr('action')).toBe('/book-visit/additional-support')
          expect($('input[name=additionalSupportRequired]:checked').length).toBe(0)
          expect($('input[name=additionalSupport]').val()).toBe(undefined)

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should pre-populate with data in session (no support)', () => {
      sessionData.bookingJourney.visitorSupport = ''

      return request(app)
        .get(url)
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
        .get(url)
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
        .get(url)
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
        .get(url)
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

  describe(`POST ${url}`, () => {
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
        .post(url)
        .send({ additionalSupportRequired: 'yes', additionalSupport: 'Wheelchair access' })
        .expect(302)
        .expect('Location', '/book-visit/main-contact')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney.visitorSupport).toBe('Wheelchair access')
        })
    })

    it('should should save no additional support choice to session and redirect to main contact page', () => {
      return request(app)
        .post(url)
        .send({ additionalSupportRequired: 'no' })
        .expect(302)
        .expect('Location', '/book-visit/main-contact')
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
          .post(url)
          .send({ unexpected: 'data' })
          .expect(302)
          .expect('Location', url)
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
          .post(url)
          .expect(302)
          .expect('Location', url)
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
          .post(url)
          .send({ additionalSupportRequired: 'yes', additionalSupport: 'ab' })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
            expect(sessionData.bookingJourney.visitorSupport).toBe(undefined)
          })
      })
    })
  })
})
