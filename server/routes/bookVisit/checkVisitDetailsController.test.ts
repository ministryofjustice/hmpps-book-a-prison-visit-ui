import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { BookingConfirmed } from '../../@types/bapv'
import { createMockVisitService } from '../../services/testutils/mocks'

let app: Express

const visitService = createMockVisitService()
let sessionData: SessionData

const url = '/book-visit/check-visit-details'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()
const application = TestData.applicationDto()
const visitSession = TestData.availableVisitSessionDto()
const mainContact = {
  contact: 'Mary Magdeline',
  phoneNumber: '01234 567890',
}

beforeEach(() => {
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
      applicationReference: application.reference,
      mainContact,
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
          expect($('title').text()).toMatch(/^Check the visit details before booking -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Check the visit details before booking')

          // TODO flesh out test for a 'full' visit
        })
    })

    // TODO specific test for no additional support

    // TODO specific test for no phone number
  })

  describe(`POST ${url}`, () => {
    const visit = TestData.visitDto()

    beforeEach(() => {
      visitService.bookVisit.mockResolvedValue(visit)

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('should book visit, clear booking journey data, store booking confirmation and redirect to the visit booked page', () => {
      const expectedBookingConfirmed: BookingConfirmed = {
        prisonCode: sessionData.bookingJourney.prison.code,
        prisonName: sessionData.bookingJourney.prison.prisonName,
        visitReference: visit.reference,
      }

      return request(app)
        .post(url)
        .expect(302)
        .expect('location', `/book-visit/visit-booked`)
        .expect(() => {
          expect(sessionData.bookingJourney).toBe(undefined)
          expect(sessionData.bookingConfirmed).toStrictEqual(expectedBookingConfirmed)

          expect(visitService.bookVisit).toHaveBeenCalledWith({
            applicationReference: application.reference,
          })
        })
    })

    // TODO test for handling booking error (VB-3597)
  })
})
