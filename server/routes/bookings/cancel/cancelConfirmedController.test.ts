import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import TestData from '../../testutils/testData'
import paths from '../../../constants/paths'

let app: Express

const bookerReference = TestData.bookerReference().value

let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a booking - Booking cancelled', () => {
  describe('GET - Display Booking cancelled page', () => {
    it('should render the page confirming the visit has been cancelled', () => {
      return request(app)
        .get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Booking cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Booking cancelled')
          expect($('h2').text()).toContain('What happens next')
          expect($('p').text()).toContain('A text message will be sent to the main contact')
        })
    })
  })
})
