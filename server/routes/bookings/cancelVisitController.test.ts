import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockBookerService, createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { VisitDetails } from '../../services/visitService'

let app: Express

const bookerService = createMockBookerService()
const visitService = createMockVisitService()

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const visitDisplayId = randomUUID()

let sessionData: SessionData
let bookings: SessionData['bookings']
let visitDetails: VisitDetails

beforeEach(() => {
  visitDetails = TestData.visitDetails({ visitDisplayId })
  bookings = { type: 'future', visits: [visitDetails] }

  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
    bookings,
  } as SessionData

  app = appWithAllRoutes({ services: { bookerService, visitService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a booking', () => {
  describe('GET - Display visit information on cancellation page', () => {
    it('should render the cancel confirmation page', () => {
      return request(app)
        .get(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cancel your booking -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(
            `${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`,
          )
          expect($('h1').text()).toBe('Are you sure you want to cancel your booking?')

          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-start-time"]').text()).toBe('10am')
          expect($('[data-test="visit-end-time"]').text()).toBe('11:30am')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visitor-name-1"]').text()).toContain('Keith Phillips')
          expect($('form[method=POST]').attr('action')).toBe(
            `${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`,
          )
        })
    })

    describe('GET - Display cancellation confirmed page', () => {
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

  describe('POST - cancel booking', () => {
    it('should have cancelled the visit and redirect to confirmation page', () => {
      return request(app)
        .post(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .send('cancelBooking=yes')
        .expect(302)
        .expect('location', paths.BOOKINGS.CANCEL_CONFIRMATION)
        .expect(() => {
          expect(visitService.cancelVisit).toHaveBeenCalledTimes(1)
          expect(visitService.cancelVisit).toHaveBeenCalledWith({
            actionedBy: 'aaaa-bbbb-cccc',
            applicationReference: 'ab-cd-ef-gh',
          })
        })
    })

    it('should redirect to visit details page if "no" is selected', () => {
      return request(app)
        .post(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .send('cancelBooking=no')
        .expect(302)
        .expect('location', `${paths.BOOKINGS.VISIT}/${visitDetails.visitDisplayId}`)
        .expect(() => {
          expect(visitService.cancelVisit).toHaveBeenCalledTimes(0)
        })
    })

    it('should NOT redirect when incorrect value posted', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'cancelBooking',
        type: 'field',
        value: 'test',
      }
      return request(app)
        .post(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .send('cancelBooking=test')
        .expect(302)
        .expect('location', `${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .expect(() => {
          expect(visitService.cancelVisit).toHaveBeenCalledTimes(0)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
        })
    })

    it('should NOT redirect when no value posted', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'cancelBooking',
        type: 'field',
        value: undefined,
      }
      return request(app)
        .post(`${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .expect(302)
        .expect('location', `${paths.BOOKINGS.CANCEL_VISIT}/${visitDetails.visitDisplayId}`)
        .expect(() => {
          expect(visitService.cancelVisit).toHaveBeenCalledTimes(0)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
        })
    })

    it('should NOT cancel the visit if invalid visit ID is posted', () => {
      return request(app)
        .post(`${paths.BOOKINGS.CANCEL_VISIT}/test`)
        .send('cancelBooking=yes')
        .expect(302)
        .expect('location', paths.BOOKINGS.HOME)
        .expect(() => {
          expect(visitService.cancelVisit).toHaveBeenCalledTimes(0)
        })
    })
  })
})
