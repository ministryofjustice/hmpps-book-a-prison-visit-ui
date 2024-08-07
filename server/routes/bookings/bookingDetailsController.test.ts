import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockBookerService, createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'

let app: Express

const bookerService = createMockBookerService()
const visitService = createMockVisitService()
const orchestrationVisitDto = TestData.orchestrationVisitDto()
const pastVisitDto = TestData.orchestrationVisitDto({
  startTimestamp: '2023-05-30T10:00:00',
  endTimestamp: '2023-05-30T11:30:00',
})
const cancelledVisitDto = TestData.orchestrationVisitDto({
  visitStatus: 'CANCELLED',
  outcomeStatus: 'ESTABLISHMENT_CANCELLED',
})
const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner({ prisonId: 'DHI' })
let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
    bookingsFuture: [orchestrationVisitDto],
    bookingsPast: [pastVisitDto],
    bookingsCancelled: [cancelledVisitDto],
  } as SessionData
  visitService.getFuturePublicVisits.mockResolvedValue([orchestrationVisitDto])
  app = appWithAllRoutes({ services: { bookerService, visitService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View single booking', () => {
  it('should render the booking details page', () => {
    return request(app)
      .get(`${paths.BOOKINGS.VISIT}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit booking details -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Visit booking details')
        expect($('[data-test="booking-reference"]').text()).toContain('ab-cd-ef-gh')
        expect($('[data-test="visit-date"]').text()).toContain('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time"]').text()).toContain('10am')
        expect($('[data-test="visit-end-time"]').text()).toContain('11:30am')
        expect($('[data-test="prisoner-name"]').text()).toContain('John Smith')
        expect($('[data-test="visitor-name-1"]').text()).toContain('Keith Phillips')
        expect($('[data-test="additional-support"]').text()).toContain('Wheelchair access requested')
        expect($('[data-test="main-contact-name"]').text()).toContain('Joan Phillips')
        expect($('[data-test="main-contact-number"]').text()).toContain('01234 567890')
        expect($('[data-test="prison-name"]').text()).toContain('Drake Hall (HMP & YOI)')
        expect($('[data-test="prison-phone-number"]').text()).toContain('0121 661 2101')
        expect($('[data-test="minutes-before-visit"]').text()).toContain('45')
        expect($('[data-test="prison-website"]').attr('href')).toContain(
          'https://www.gov.uk/guidance/drake-hall-prison',
        )
      })
  })

  it('should render the booking details page - visit date in the past', () => {
    return request(app)
      .get(`${paths.BOOKINGS.VISIT_PAST}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit booking details -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.PAST)
        expect($('h1').text()).toBe('Visit booking details')
        expect($('[data-test="booking-reference"]').text()).toContain('ab-cd-ef-gh')
        expect($('[data-test="visit-date"]').text()).toContain('Tuesday 30 May 2023')
        expect($('[data-test="prison-name"]').text()).not.toContain('Drake Hall (HMP & YOI)')
        expect($('[data-test="prison-website"]').length).toBe(0)
      })
  })

  it('should render the booking details page - cancelled by prison', () => {
    return request(app)
      .get(`${paths.BOOKINGS.VISIT_CANCELLED}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit booking details -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.CANCELLED)
        expect($('h1').text()).toBe('Visit booking details')
        expect($('[data-test="booking-reference"]').text()).toContain('ab-cd-ef-gh')
        expect($('[data-test="visit-date"]').text()).toContain('Thursday 30 May 2024')
        expect($('[data-test="prison-name"]').text()).not.toContain('Drake Hall (HMP & YOI)')
        expect($('[data-test="prison-website"]').length).toBe(0)
        expect($('[data-test="visit-cancelled-type"]').text()).toContain('This visit was cancelled by the prison.')
      })
  })

  it('should render the booking details page - cancelled by prisoner', () => {
    sessionData.bookingsCancelled[0].outcomeStatus = 'PRISONER_CANCELLED'
    return request(app)
      .get(`${paths.BOOKINGS.VISIT_CANCELLED}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit booking details -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.CANCELLED)
        expect($('h1').text()).toBe('Visit booking details')
        expect($('[data-test="booking-reference"]').text()).toContain('ab-cd-ef-gh')
        expect($('[data-test="visit-date"]').text()).toContain('Thursday 30 May 2024')
        expect($('[data-test="prison-name"]').text()).not.toContain('Drake Hall (HMP & YOI)')
        expect($('[data-test="prison-website"]').length).toBe(0)
        expect($('[data-test="visit-cancelled-type"]').text()).toContain('This visit was cancelled by the prisoner.')
      })
  })

  it('should render the booking details page - cancelled by visitor', () => {
    sessionData.bookingsCancelled[0].outcomeStatus = 'VISITOR_CANCELLED'
    return request(app)
      .get(`${paths.BOOKINGS.VISIT_CANCELLED}/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit booking details -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.CANCELLED)
        expect($('h1').text()).toBe('Visit booking details')
        expect($('[data-test="booking-reference"]').text()).toContain('ab-cd-ef-gh')
        expect($('[data-test="visit-date"]').text()).toContain('Thursday 30 May 2024')
        expect($('[data-test="prison-name"]').text()).not.toContain('Drake Hall (HMP & YOI)')
        expect($('[data-test="prison-website"]').length).toBe(0)
        expect($('[data-test="visit-cancelled-type"]').text()).toContain('This visit was cancelled by a visitor.')
      })
  })

  it('should redirect to bookings homepage if number higher than expected entered in address bar', () => {
    return request(app).get(`${paths.BOOKINGS.VISIT}/50`).expect(302).expect('Location', paths.BOOKINGS.HOME)
  })

  it('should redirect to bookings homepage if number less than 1 entered in address bar', () => {
    return request(app).get(`${paths.BOOKINGS.VISIT}/0`).expect(302).expect('Location', paths.BOOKINGS.HOME)
  })
})
