import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { BookingConfirmed } from '../../@types/bapv'

let app: Express

let sessionData: SessionData

const url = '/book-visit/check-visit-details'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()

beforeEach(() => {
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
      visitorSupport: 'Wheelchair access',
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check visit details', () => {
  describe(`GET ${url}`, () => {
    it('should render check visit details page', () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // expect($('title').text()).toMatch(/^Check the visit details before booking\? -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          // expect($('h1').text()).toBe('Check the visit details before booking')

          // TODO flesh out test for a 'full' visit
        })
    })

    // TODO specific test for no additional support

    // TODO specific test for no phone number
  })

  describe(`POST ${url}`, () => {
    it('should book visit, clear booking journey data, store booking confirmation and redirect to the visit booked page', () => {
      const expectedBookingConfirmed: BookingConfirmed = {
        prisonCode: sessionData.bookingJourney.prison.code,
        prisonName: sessionData.bookingJourney.prison.prisonName,
        visitReference: 'TEST_VISIT_REFERENCE',
      }

      return request(app)
        .post(url)
        .expect(302)
        .expect('location', `/book-visit/visit-booked`)
        .expect(() => {
          expect(sessionData.bookingJourney).toBe(undefined)
          expect(sessionData.bookingConfirmed).toStrictEqual(expectedBookingConfirmed)

          // TODO test for booking API calls
        })
    })

    // TODO test for handling booking error
  })
})
