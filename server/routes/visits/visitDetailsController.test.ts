import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockPrisonService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { VisitDetails } from '../../services/visitService'

let app: Express

const prisonService = createMockPrisonService()

const prison = TestData.prisonDto()
const visitDisplayId = randomUUID()

let sessionData: SessionData
let bookings: SessionData['bookings']
let visitDetails: VisitDetails

beforeEach(() => {
  visitDetails = TestData.visitDetails({ visitDisplayId })
  bookings = { type: undefined, visits: [visitDetails] }

  sessionData = { bookings } as SessionData

  prisonService.getPrison.mockResolvedValue(prison)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View a single booking', () => {
  describe('Future booking', () => {
    const fakeDate = new Date('2024-05-28')

    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
    })

    afterEach(() => {
      jest.resetAllMocks()
      jest.useRealTimers()
    })

    it('should render the visit details page', () => {
      bookings.type = 'future'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
          expect($('h1').text()).toBe('Visit details')

          expect($('[data-test="visit-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visitor-name-1"]').text().trim()).toBe('Keith Phillips')
          expect($('[data-test="additional-support"]').text()).toBe('Wheelchair access requested')
          expect($('[data-test="main-contact-name"]').text()).toBe('Joan Phillips')
          expect($('[data-test="main-contact-email"]').text()).toBe('visitor@example.com')
          expect($('[data-test="main-contact-number"]').text()).toBe('07712 000 000')
          expect($('[data-test="main-contact-no-details"]').length).toBe(0)

          expect($('[data-test="prison-name"]').text()).toBe(prison.prisonName)
          expect($('[data-test="prison-phone-number"]').text()).toBe(prison.phoneNumber)
          expect($('[data-test="minutes-before-visit"]').text()).toBe('45')
          expect($('[data-test="prison-website"]').attr('href')).toBe(prison.webAddress)
          expect($('[data-test=no-prison-phone-number]').length).toBeFalsy()
          expect($('[data-test="visit-reference-changes"]').text()).toBe('ab-cd-ef-gh')

          // don't display this line when on the visit details page
          expect($('[data-test=cancel-visit-content]').length).toBeFalsy()

          expect($('[data-test="cancel-visit"]').text()).toContain('Cancel visit')
          expect($('[data-test="cancel-visit"]').attr('href')).toBe(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDisplayId}`)

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })

    it('should render the visit details page - no main contact details', () => {
      bookings.type = 'future'
      bookings.visits[0].visitContact.email = undefined
      bookings.visits[0].visitContact.telephone = undefined

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="main-contact-email"]').length).toBe(0)
          expect($('[data-test="main-contact-number"]').length).toBe(0)
          expect($('[data-test="main-contact-no-details"]').text()).toBe('No contact details provided')
        })
    })

    it('should render the visit details page - requested visit', () => {
      bookings.type = 'future'
      bookings.visits[0].visitSubStatus = 'REQUESTED'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit details')
          expect($('.moj-alert').text()).toContain('Your request needs to be reviewed')
          expect($('.moj-alert').text()).toContain(
            'This visit is not booked yet. It needs to be checked by Hewell (HMP).',
          )
          expect($('[data-test="change-booking-heading"]').text()).toBe('How to update your request')
        })
    })

    it('should show alternative content if prison has no phone number', () => {
      bookings.type = 'future'
      prisonService.getPrison.mockResolvedValue(TestData.prisonDto({ phoneNumber: null }))

      return request(app)
        .get(`${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=no-prison-phone-number]').text()).toContain(prison.prisonName)
          expect($('[data-test=no-prison-phone-number] a').attr('href')).toBe(prison.webAddress)
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
        })
    })
  })

  describe('Past booking', () => {
    it('should render the visit details page', () => {
      bookings.type = 'past'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_PAST}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.PAST)
          expect($('h1').text()).toBe('Visit details')

          expect($('[data-test="visit-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')

          expect($('[data-test="prison-name"]').length).toBeFalsy()
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
          expect($('[data-test="minutes-before-visit"]').length).toBeFalsy()
          expect($('[data-test="prison-website"]').length).toBeFalsy()
          expect($('[data-test="visit-reference-changes"]').length).toBeFalsy()

          expect($('[data-test="cancel-visit"]').text()).toBeFalsy()
          expect($('[data-test="cancel-visit"]').attr('href')).toBeFalsy()

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })
  })

  describe('Cancelled booking', () => {
    it('should render the visit details page with "Visit cancelled" message', () => {
      bookings.type = 'cancelled'
      visitDetails.visitStatus = 'CANCELLED'
      visitDetails.visitSubStatus = 'CANCELLED'
      visitDetails.outcomeStatus = 'ESTABLISHMENT_CANCELLED'

      return request(app)
        .get(`${paths.BOOKINGS.VISIT_CANCELLED}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.CANCELLED)
          expect($('h1').text()).toBe('Visit details')

          expect($('[data-test="visit-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')
          expect($('.moj-alert').eq(0).text()).toContain('Visit cancelled')
          expect($('.moj-alert').eq(0).text()).toContain('This visit was cancelled by the prison')

          expect($('[data-test="prison-name"]').length).toBeFalsy()
          expect($('[data-test="prison-phone-number"]').length).toBeFalsy()
          expect($('[data-test="minutes-before-visit"]').length).toBeFalsy()
          expect($('[data-test="prison-website"]').length).toBeFalsy()
          expect($('[data-test="visit-reference-changes"]').length).toBeFalsy()

          expect($('[data-test="cancel-visit"]').text()).toBeFalsy()
          expect($('[data-test="cancel-visit"]').attr('href')).toBeFalsy()

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })
  })

  describe('Validation', () => {
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
