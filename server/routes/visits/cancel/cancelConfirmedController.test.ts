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
    it('should render the page confirming the visit has been cancelled (email and text message)', () => {
      sessionData.bookingCancelled = { hasEmail: true, hasMobile: true }

      return request(app)
        .get(`${paths.VISITS.CANCEL_CONFIRMATION}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Visit cancelled')
          expect($('h2').text()).toContain('What happens next')
          expect($('[data-test=confirmation-notification-message]').text()).toContain(
            'An email and a text message will be sent',
          )
        })
    })

    describe('Confirmation message variations', () => {
      it('email only', () => {
        sessionData.bookingCancelled = { hasEmail: true, hasMobile: false }

        return request(app)
          .get(`${paths.VISITS.CANCEL_CONFIRMATION}`)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=confirmation-notification-message]').text()).toContain('An email will be sent')
          })
      })

      it('mobile phone only', () => {
        sessionData.bookingCancelled = { hasEmail: false, hasMobile: true }

        return request(app)
          .get(`${paths.VISITS.CANCEL_CONFIRMATION}`)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=confirmation-notification-message]').text()).toContain('A text message will be sent')
          })
      })

      it('no email or mobile phone', () => {
        sessionData.bookingCancelled = { hasEmail: false, hasMobile: false }

        return request(app)
          .get(`${paths.VISITS.CANCEL_CONFIRMATION}`)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test=confirmation-notification-message]').length).toBe(0)
          })
      })
    })

    it('should redirect to bookings page if bookingCancelled data not set', () => {
      sessionData.bookingCancelled = undefined

      return request(app).get(`${paths.VISITS.CANCEL_CONFIRMATION}`).expect(302).expect('location', paths.VISITS.HOME)
    })
  })
})
