import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockBookerService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import getPrisonInformation from '../../constants/prisonInformation'
import { VisitDetails } from '../../services/visitService'

let app: Express

const bookerService = createMockBookerService()

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner({ prisonId: 'DHI' })
const visitDisplayId = randomUUID()

let sessionData: SessionData
let bookings: SessionData['bookings']
let visitDetails: VisitDetails

beforeEach(() => {
  visitDetails = TestData.visitDetails({ visitDisplayId })
  bookings = { type: undefined, visits: [visitDetails] }

  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
    bookings,
  } as SessionData

  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View a single booking', () => {
  describe('Future booking', () => {
    it('should render the booking details page', () => {
      bookings.type = 'future'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booking details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
          expect($('h1').text()).toBe('Visit booking details')

          expect($('[data-test="booking-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visitor-name-1"]').text()).toBe('Keith Phillips')
          expect($('[data-test="additional-support"]').text()).toBe('Wheelchair access requested')
          expect($('[data-test="main-contact-name"]').text()).toBe('Joan Phillips')
          expect($('[data-test="main-contact-number"]').text()).toBe('01234 567890')

          expect($('[data-test="prison-name"]').text()).toBe(getPrisonInformation('DHI').prisonName)
          expect($('[data-test="prison-phone-number"]').text()).toBe(getPrisonInformation('DHI').prisonPhoneNumber)
          expect($('[data-test="minutes-before-visit"]').text()).toBe('45')
          expect($('[data-test="prison-website"]').attr('href')).toBe(getPrisonInformation('DHI').prisonWebsite)
        })
    })
  })

  describe('Past booking', () => {
    it('should render the booking details page', () => {
      bookings.type = 'past'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_PAST}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booking details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.PAST)
          expect($('h1').text()).toBe('Visit booking details')

          expect($('[data-test="booking-reference"]').text()).toBe('ab-cd-ef-gh')

          expect($('[data-test="prison-name"]').length).toBeFalsy()
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
          expect($('[data-test="minutes-before-visit"]').length).toBeFalsy()
          expect($('[data-test="prison-website"]').length).toBeFalsy()
        })
    })
  })

  describe('Cancelled booking', () => {
    it('should render the booking details page - cancelled by prison', () => {
      bookings.type = 'cancelled'
      visitDetails.visitStatus = 'CANCELLED'
      visitDetails.outcomeStatus = 'ESTABLISHMENT_CANCELLED'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_CANCELLED}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit booking details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.CANCELLED)
          expect($('h1').text()).toBe('Visit booking details')

          expect($('[data-test="booking-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-cancelled-type"]').text()).toBe('This visit was cancelled by the prison.')

          expect($('[data-test="prison-name"]').length).toBeFalsy()
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
          expect($('[data-test="minutes-before-visit"]').length).toBeFalsy()
          expect($('[data-test="prison-website"]').length).toBeFalsy()
        })
    })

    it('should render the booking details page - cancelled by prisoner', () => {
      bookings.type = 'cancelled'
      visitDetails.visitStatus = 'CANCELLED'
      visitDetails.outcomeStatus = 'PRISONER_CANCELLED'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_CANCELLED}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-cancelled-type"]').text()).toBe('This visit was cancelled by the prisoner.')
        })
    })

    it('should render the booking details page - cancelled by visitor', () => {
      bookings.type = 'cancelled'
      visitDetails.visitStatus = 'CANCELLED'
      visitDetails.outcomeStatus = 'VISITOR_CANCELLED'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_CANCELLED}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="visit-cancelled-type"]').text()).toBe('This visit was cancelled by a visitor.')
        })
    })
  })

  describe('Validation', () => {
    it('should look up prisoner details if not present in session', () => {
      sessionData.booker.prisoners = []
      bookings.type = 'future'

      bookerService.getPrisoners.mockResolvedValue([prisoner])

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
          expect($('[data-test="booking-reference"]').text()).toBe('ab-cd-ef-gh')

          expect(bookerService.getPrisoners).toHaveBeenCalledWith(bookerReference)
        })
    })

    it('should redirect to bookings home page if an invalid visitDisplayId is passed', () => {
      bookings.type = 'future'
      return request(app).get(`${paths.BOOKINGS.VISIT}/NOT-A-UUID`).expect(302).expect('location', paths.BOOKINGS.HOME)
    })

    it('should redirect to bookings home page if an unrecognised (not in session) visitDisplayId is passed', () => {
      bookings.type = 'future'
      const unrecognisedUUID = randomUUID()
      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${unrecognisedUUID}`)
        .expect(302)
        .expect('location', paths.BOOKINGS.HOME)
    })
  })
})
