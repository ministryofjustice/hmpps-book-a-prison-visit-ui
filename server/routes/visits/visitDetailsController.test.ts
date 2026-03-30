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
let visitDetails: VisitDetails

beforeEach(() => {
  visitDetails = TestData.visitDetails({ visitDisplayId })
  sessionData = {} as SessionData

  prisonService.getPrison.mockResolvedValue(prison)

  app = appWithAllRoutes({ services: { prisonService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View a single visit', () => {
  describe('Future visit', () => {
    const fakeDate = new Date('2024-05-28')

    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
    })

    afterEach(() => {
      jest.resetAllMocks()
      jest.useRealTimers()
    })

    it('should render the visit details page', () => {
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }

      return request(app)
        .get(`${paths.VISITS.DETAILS}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
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

          expect($('[data-test="contact-prison"]').text()).toContain(prison.prisonName)
          expect($('[data-test="contact-prison"]').text()).toContain(prison.phoneNumber)
          expect($('[data-test="more-visits-info"] a').text()).toBe(`visits at ${prison.prisonName}`)
          expect($('[data-test="more-visits-info"] a').attr('href')).toBe(prison.webAddress)
          expect($('[data-test="change-visit"]').text()).toContain('ab-cd-ef-gh')

          // don't display this line when on the visit details page
          expect($('[data-test=cancel-visit-content]').length).toBeFalsy()

          expect($('[data-test="cancel-visit"]').text()).toContain('Cancel visit')
          expect($('[data-test="cancel-visit"]').attr('href')).toBe(`${paths.VISITS.CANCEL_VISIT}/${visitDisplayId}`)

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })

    it('should render the visit details page - no main contact details', () => {
      visitDetails.visitContact.email = undefined
      visitDetails.visitContact.telephone = undefined
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }

      return request(app)
        .get(`${paths.VISITS.DETAILS}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="main-contact-email"]').length).toBe(0)
          expect($('[data-test="main-contact-number"]').length).toBe(0)
          expect($('[data-test="main-contact-no-details"]').text()).toBe('No contact details provided')
        })
    })

    it('should render the visit details page - requested visit', () => {
      visitDetails.visitSubStatus = 'REQUESTED'
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }

      return request(app)
        .get(`${paths.VISITS.DETAILS}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit details')
          expect($('.moj-alert').text()).toContain('Your request needs to be reviewed')
          expect($('.moj-alert').text()).toContain(
            'This visit is not booked yet. It needs to be checked by Hewell (HMP & YOI).',
          )
          expect($('[data-test="change-request-heading"]').text()).toBe('How to update your request')
        })
    })

    it('should show alternative content if prison has no phone number', () => {
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }
      prisonService.getPrison.mockResolvedValue({ ...TestData.prisonDto(), phoneNumber: undefined })

      return request(app)
        .get(`${paths.VISITS.DETAILS}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=contact-prison]').text()).toContain(prison.prisonName)
          expect($('[data-test=contact-prison] a').attr('href')).toBe(prison.webAddress)
        })
    })
  })

  describe('Past visit', () => {
    it('should render the visit details page', () => {
      sessionData.bookedVisits = { type: 'past', visits: [visitDetails] }

      return request(app)
        .get(`${paths.VISITS.VISIT_PAST}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.PAST)
          expect($('h1').text()).toBe('Visit details')

          expect($('[data-test="visit-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')

          expect($('[data-test="change-visit-heading"]').length).toBeFalsy()
          expect($('[data-test="change-request-heading"]').length).toBeFalsy()

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })
  })

  describe('Cancelled visit', () => {
    it('should render the visit details page with "Visit cancelled" message', () => {
      visitDetails.visitStatus = 'CANCELLED'
      visitDetails.visitSubStatus = 'CANCELLED'
      visitDetails.outcomeStatus = 'ESTABLISHMENT_CANCELLED'
      sessionData.bookedVisits = { type: 'cancelled', visits: [visitDetails] }

      return request(app)
        .get(`${paths.VISITS.VISIT_CANCELLED}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visit details -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.CANCELLED)
          expect($('h1').text()).toBe('Visit details')

          expect($('[data-test="visit-reference"]').text()).toBe('ab-cd-ef-gh')
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')
          expect($('.moj-alert').eq(0).text()).toContain('Visit cancelled')
          expect($('.moj-alert').eq(0).text()).toContain('This visit was cancelled by the prison')

          expect($('[data-test="change-visit-heading"]').length).toBeFalsy()
          expect($('[data-test="change-request-heading"]').length).toBeFalsy()

          expect(prisonService.getPrison).toHaveBeenCalledWith(visitDetails.prisonId)
        })
    })
  })

  describe('Validation', () => {
    it('should redirect to Visits home page if an invalid visitDisplayId is passed', () => {
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }
      return request(app).get(`${paths.VISITS.DETAILS}/NOT-A-UUID`).expect(302).expect('location', paths.VISITS.HOME)
    })

    it('should redirect to Visits home page if an unrecognised (not in session) visitDisplayId is passed', () => {
      sessionData.bookedVisits = { type: 'future', visits: [visitDetails] }
      const unrecognisedUUID = randomUUID()
      return request(app)
        .get(`${paths.VISITS.DETAILS}/${unrecognisedUUID}`)
        .expect(302)
        .expect('location', paths.VISITS.HOME)
    })
  })
})
