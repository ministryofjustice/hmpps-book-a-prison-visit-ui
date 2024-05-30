import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { BookingJourneyData, FlashData } from '../../@types/bapv'

let app: Express

let sessionData: SessionData

const url = '/book-a-visit/select-additional-support'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select additional support page', () => {
  let flashData: FlashData

  describe(`GET ${url}`, () => {
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
          selectedSessionDate: '2024-05-30',
          selectedSessionTemplateReference: 'a',
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
          expect($('[data-test="back-link"]').attr('href')).toBe('/book-a-visit/select-date-and-time')
          expect($('h1').text()).toBe('Is additional support needed for any of the visitors?')

          expect($('[data-test=prison-name]').text().trim()).toContain('Hewell (HMP)')

          expect($('form[method=POST]').attr('action')).toBe('/book-a-visit/select-additional-support')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
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

      flashData = { errors: [validationError], formValues: { visitorIds: [] } }

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
    let expectedBookingJourney: BookingJourneyData

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
          selectedSessionDate: '2024-05-30',
          selectedSessionTemplateReference: 'a',
          applicationReference: TestData.applicationDto().reference,
        },
      } as SessionData

      expectedBookingJourney = {
        prisoner,
        prison,
        allVisitors: [visitor],
        selectedVisitors: [visitor],
        allVisitSessionIds: ['2024-05-30_a'],
        selectedSessionDate: '2024-05-30',
        selectedSessionTemplateReference: 'a',
        applicationReference: TestData.applicationDto().reference,
      }

      app = appWithAllRoutes({ sessionData })
    })

    it('should should save entered additional support to session and redirect to main contact page', () => {
      return request(app)
        .post(url)
        .send({ additionalSupportRequired: 'yes', additionalSupport: 'Wheelchair access' })
        .expect(302)
        .expect('Location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney).toStrictEqual({
            ...expectedBookingJourney,
            visitorSupport: 'Wheelchair access',
          })
        })
    })

    it('should should save no additional support choice to session and redirect to main contact page', () => {
      return request(app)
        .post(url)
        .send({ additionalSupportRequired: 'no' })
        .expect(302)
        .expect('Location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.bookingJourney).toStrictEqual({
            ...expectedBookingJourney,
            visitorSupport: '',
          })
        })
    })

    it('should set a validation error and redirect to original page when no options selected', () => {
      const expectedFlashData: FlashData = {
        errors: [
          {
            type: 'field',
            location: 'body',
            path: 'additionalSupportRequired',
            value: undefined,
            msg: 'No answer selected',
          },
        ],
        formValues: { additionalSupport: '' },
      }

      return request(app)
        .post(url)
        .expect(302)
        .expect('Location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
          expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)

          expect(sessionData.bookingJourney).toStrictEqual(expectedBookingJourney)
        })
    })

    it('should set a validation error and redirect to original page when text length validation fails', () => {
      const expectedFlashData: FlashData = {
        errors: [
          {
            type: 'field',
            location: 'body',
            path: 'additionalSupport',
            value: 'ab',
            msg: 'Please enter at least 3 and no more than 512 characters',
          },
        ],
        formValues: { additionalSupportRequired: 'yes', additionalSupport: 'ab' },
      }

      return request(app)
        .post(url)
        .send({ additionalSupportRequired: 'yes', additionalSupport: 'ab' })
        .expect(302)
        .expect('Location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
          expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)

          expect(sessionData.bookingJourney).toStrictEqual(expectedBookingJourney)
        })
    })
  })
})