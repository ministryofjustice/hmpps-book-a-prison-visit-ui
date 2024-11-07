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
    bookingConfirmed: {
      prison,
      visitReference: visit.applicationReference,
      hasPhoneNumber: true,
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit booked', () => {
  describe(`GET ${paths.BOOK_VISIT.BOOKED}`, () => {
    it('should render visit booked page', () => {
      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booked -/)
          expect($('#service-header__nav').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit booked')
          expect($('[data-test="booking-reference-title"]').text()).toBe(visit.applicationReference)

          expect($('[data-test="phone-number-text"]').length).toBe(1)

          expect($('[data-test="booking-reference-changes"]').text()).toBe(visit.applicationReference)
          expect($('[data-test="cancel-visit-content"]').text()).toBe(
            'Or you can cancel your booking from the bookings page.',
          )
          expect($('[data-test="cancel-visit-content"] > a').attr('href')).toBe(paths.BOOKINGS.HOME)

          expect($('[data-test="prison-specific-content"]').length).toBe(1)
          expect($('[data-test="prison-name"]').text()).toBe(prison.prisonName)
          expect($('[data-test="prison-phone-number"]').text()).toBe(prison.phoneNumber)
          expect($('[data-test="minutes-before-visit"]').text()).toBe('45')
          expect($('[data-test="prison-website"]').text()).toBe(`visits at ${prison.prisonName}`)
          expect($('[data-test="prison-website"]').attr('href')).toBe(prison.webAddress)
          expect($('[data-test=no-prison-phone-number]').length).toBeFalsy()
        })
    })

    it('should show alternative content if prison has no phone number', () => {
      sessionData.bookingConfirmed.prison.phoneNumber = null

      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=no-prison-phone-number]').text()).toContain(prison.prisonName)
          expect($('[data-test=no-prison-phone-number] a').attr('href')).toBe(prison.webAddress)
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
        })
    })

    it('should not show text message info when no main contact phone number provided', () => {
      sessionData.bookingConfirmed.hasPhoneNumber = false

      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booked -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit booked')

          expect($('[data-test="phone-number-text"]').length).toBe(0)
        })
    })
  })
})
