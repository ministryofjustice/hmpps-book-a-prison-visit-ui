import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'

let app: Express

let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a booking - Booking cancelled', () => {
  describe('GET - Display Booking cancelled page', () => {
    it('should render the page confirming the visit has been cancelled - with phone number', () => {
      sessionData.bookingCancelled = { hasPhoneNumber: true }

      return request(app)
        .get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Booking cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Booking cancelled')
          expect($('h2').text()).toContain('What happens next')
          expect($('[data-test=phone-number-text]').length).toBe(1)
        })
    })

    it('should render the page confirming the visit has been cancelled - no phone number', () => {
      sessionData.bookingCancelled = { hasPhoneNumber: false }

      return request(app)
        .get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Booking cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Booking cancelled')
          expect($('h2').text()).toContain('What happens next')
          expect($('[data-test=phone-number-text]').length).toBe(0)
        })
    })

    it('should redirect to bookings page if bookingCancelled data not set', () => {
      sessionData.bookingCancelled = undefined

      return request(app)
        .get(`${paths.BOOKINGS.CANCEL_CONFIRMATION}`)
        .expect(302)
        .expect('location', paths.BOOKINGS.HOME)
    })
  })
})
