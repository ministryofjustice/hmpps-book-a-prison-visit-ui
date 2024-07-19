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
const prison = TestData.prisonDto({ code: 'FHI', prisonName: 'Foston Hall (HMP & YOI)' })

const visit = TestData.visitDto()

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference, prisoners: [prisoner] },
    bookingConfirmed: {
      prisonCode: prison.code,
      prisonName: prison.prisonName,
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
    it('should render visit booked page - FHI', () => {
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
          expect($('[data-test="phone-number-text"]').length).toBe(1)
          expect($('[data-test="prison-specific-content"]').length).toBe(1)
          expect($('[data-test="prison-name"]').text()).toBe('Foston Hall (HMP & YOI)')
          expect($('[data-test="prison-number"]').text()).toBe('0121 661 2101')
          expect($('[data-test="minutes-before-visit"]').text()).toBe('45')
          expect($('[data-test="prison-website"]').text()).toBe('visits at Foston Hall (HMP & YOI)')
          expect($('[data-test="prison-website"]').attr('href')).toBe('https://www.gov.uk/guidance/foston-hall-prison')
        })
    })

    it('should render visit booked page - DHI', () => {
      sessionData.bookingConfirmed.prisonCode = 'DHI'
      sessionData.bookingConfirmed.prisonName = 'Drake Hall (HMP & YOI)'
      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booked -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit booked')
          expect($('[data-test="phone-number-text"]').length).toBe(1)
          expect($('[data-test="prison-specific-content"]').length).toBe(1)
          expect($('[data-test="prison-name"]').text()).toBe('Drake Hall (HMP & YOI)')
          expect($('[data-test="prison-number"]').text()).toBe('0121 661 2101')
          expect($('[data-test="minutes-before-visit"]').text()).toBe('45')
          expect($('[data-test="prison-website"]').text()).toBe('visits at Drake Hall (HMP & YOI)')
          expect($('[data-test="prison-website"]').attr('href')).toBe('https://www.gov.uk/guidance/drake-hall-prison')
        })
    })

    it('Should show alternative text when no phone number provided', () => {
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

    it('Should not show prison specific text when non-supported prison used', () => {
      sessionData.bookingConfirmed.prisonCode = 'HEI'
      sessionData.bookingConfirmed.prisonName = 'Hewell (HMP)'
      return request(app)
        .get(paths.BOOK_VISIT.BOOKED)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booked -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visit booked')
          expect($('[data-test="prison-specific-content"]').length).toBe(0)
        })
    })
  })
})
