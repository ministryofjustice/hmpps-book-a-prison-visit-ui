import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBookerService, createMockPrisonService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { FlashData } from '../../@types/bapv'

let app: Express

const bookerService = createMockBookerService()
const prisonService = createMockPrisonService()
let sessionData: SessionData

const url = '/book-a-visit/select-additional-support'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisonerInfoDto()
const prison = TestData.prisonDto()
const visitors = [
  TestData.visitorInfoDto({ personId: 1, firstName: 'Visitor', lastName: 'One', dateOfBirth: '1980-02-03' }),
  TestData.visitorInfoDto({ personId: 2, firstName: 'Visitor', lastName: 'Two', dateOfBirth: '1990-09-03' }),
  TestData.visitorInfoDto({ personId: 3, firstName: 'Visitor', lastName: 'Three', dateOfBirth: '2024-03-01' }),
]

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Select additional support page', () => {
  let flashData: FlashData

  describe(`GET ${url}`, () => {
    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: { allVisitors: visitors, selectedVisitors: visitors, prisoner, prison },
      } as SessionData

      app = appWithAllRoutes({ services: { bookerService, prisonService }, sessionData })
    })

    it('should render additional support page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Any additional support needs\? -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/')
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
    beforeEach(() => {
      sessionData = {
        booker: {
          reference: bookerReference,
          prisoners: [prisoner],
        },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: visitors,
          selectedVisitors: [visitors[0], visitors[2]],
        },
      } as SessionData

      app = appWithAllRoutes({ sessionData })
    })

    it('should should save entered additional support to session and redirect to main contact page', () => {
      return request(app)
        .post(url)
        .send({ additionalSupportRequired: 'yes', additionalSupport: 'Wheelchair access' })
        .expect(302)
        .expect('Location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
              selectedVisitors: [visitors[0], visitors[2]],
              visitorSupport: 'Wheelchair access',
            },
          } as SessionData)
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

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: visitors,
              selectedVisitors: [visitors[0], visitors[2]],
            },
          } as SessionData)
        })
    })
  })
})
