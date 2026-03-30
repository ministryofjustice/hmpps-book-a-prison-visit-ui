import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'

let app: Express

let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()

const visit = TestData.visitDto()

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference, prisoners: [prisoner] },
    bookVisitConfirmed: {
      isARequest: false,
      prison,
      visitReference: visit.reference,
      hasEmail: true,
      hasMobile: true,
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit confirmed (BOOKED - AUTO_APPROVED)', () => {
  describe(`GET ${paths.BOOK_VISIT.BOOKED}`, () => {
    it('should render visit booked page (email and text message confirmation)', () => {
      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booked -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit booked')
          expect($('[data-test="visit-reference-title"]').text()).toBe(visit.reference)

          expect($('[data-test="confirmation-notification-message"]').text()).toContain('An email and a text')

          expect($('[data-test="prison-specific-content"]').length).toBe(1)
          expect($('[data-test="contact-prison"]').text()).toContain(prison.prisonName)
          expect($('[data-test="contact-prison"]').text()).toContain(prison.phoneNumber)

          expect($('[data-test="change-visit"]').text()).toContain(visit.reference)
          expect($('[data-test="cancel-visit-content"]').text()).toBe(
            'Or you can cancel your visit from the visits page.',
          )
          expect($('[data-test="cancel-visit-content"] > a').attr('href')).toBe(paths.VISITS.HOME)

          expect($('[data-test="more-visits-info"] a').text()).toBe(`visits at ${prison.prisonName}`)
          expect($('[data-test="more-visits-info"] a').attr('href')).toBe(prison.webAddress)
        })
    })

    it('should show alternative content if prison has no phone number', () => {
      sessionData.bookVisitConfirmed!.prison.phoneNumber = undefined

      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=contact-prison]').text()).toContain(prison.prisonName)
          expect($('[data-test=contact-prison] a').attr('href')).toBe(prison.webAddress)
        })
    })

    describe('Visit confirmation message variations', () => {
      it('email only', () => {
        sessionData.bookVisitConfirmed!.hasMobile = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="confirmation-notification-message"]').text()).toContain('An email')
          })
      })

      it('mobile phone only', () => {
        sessionData.bookVisitConfirmed!.hasEmail = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="confirmation-notification-message"]').text()).toContain('A text message')
          })
      })

      it('no email or mobile phone', () => {
        sessionData.bookVisitConfirmed!.hasEmail = false
        sessionData.bookVisitConfirmed!.hasMobile = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="confirmation-notification-message"]').length).toBe(0)
          })
      })
    })
  })
})

describe('Visit confirmed (BOOKED - REQUESTED)', () => {
  beforeEach(() => {
    sessionData.bookVisitConfirmed!.isARequest = true
  })

  describe(`GET ${paths.BOOK_VISIT.BOOKED}`, () => {
    it('should render visit requested page (email and text message confirmation)', () => {
      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit requested -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit requested')
          expect($('[data-test="visit-requested-panel"]').text()).toContain(prison.prisonName)

          expect($('[data-test="request-confirmation-message"]').text()).toContain('an email and a text message')
          expect($('[data-test="request-reference"]').text()).toBe(visit.reference)

          expect($('[data-test="confirm-or-reject"]').text()).toContain(prison.prisonName)
          expect($('[data-test="response-message"]').text()).toContain('An email and a text message')
        })
    })

    describe('Request confirmation message variations', () => {
      it('email only', () => {
        sessionData.bookVisitConfirmed!.hasMobile = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="request-confirmation-message"]').text()).toContain('an email')
            expect($('[data-test="response-message"]').text()).toContain('An email')
          })
      })

      it('mobile phone only', () => {
        sessionData.bookVisitConfirmed!.hasEmail = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="request-confirmation-message"]').text()).toContain('a text message')
            expect($('[data-test="response-message"]').text()).toContain('A text message')
          })
      })

      it('no email or mobile phone', () => {
        sessionData.bookVisitConfirmed!.hasEmail = false
        sessionData.bookVisitConfirmed!.hasMobile = false

        return request(app)
          .get(paths.BOOK_VISIT.BOOKED)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="request-confirmation-message"]').length).toBe(0)
            expect($('[data-test="response-message"]').length).toBe(0)
          })
      })
    })
  })
})
