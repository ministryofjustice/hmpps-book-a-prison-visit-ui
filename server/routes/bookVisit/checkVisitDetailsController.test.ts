import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { BadRequest, InternalServerError } from 'http-errors'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { BookingConfirmed } from '../../@types/bapv'
import { createMockVisitService } from '../../services/testutils/mocks'
import paths from '../../constants/paths'
import logger from '../../../logger'

jest.mock('../../../logger')

let app: Express

const visitService = createMockVisitService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto()
const visitor = TestData.visitor()
const application = TestData.applicationDto()
const visitSession = TestData.availableVisitSessionDto()
const mainContact = {
  contact: 'Mary Magdeline',
  phoneNumber: '01234 567890',
}

beforeEach(() => {
  sessionData = {
    booker: { reference: bookerReference, prisoners: [prisoner] },
    bookingJourney: {
      prisoner,
      prison,
      allVisitors: [visitor],
      selectedVisitors: [visitor],
      allVisitSessionIds: ['2024-05-30_a'],
      allVisitSessions: [visitSession],
      selectedVisitSession: visitSession,
      applicationReference: application.reference,
      mainContact: {
        contact: mainContact.contact,
        phoneNumber: mainContact.phoneNumber,
      },
      visitorSupport: 'Wheelchair access',
    },
  } as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check visit details', () => {
  describe(`GET ${paths.BOOK_VISIT.CHECK_DETAILS}`, () => {
    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render check visit details page', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Check the visit details before booking -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Check the visit details before booking')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visitor-name-1"]').text()).toBe('Joan Phillips (44 years old)')
          expect($('[data-test="change-visitors"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_VISITORS)
          expect($('[data-test="visit-date"]').text()).toBe('Thursday 30 May 2024')
          expect($('[data-test="visit-time"]').text()).toBe('10am to 11:30am')
          expect($('[data-test="change-time"]').attr('href')).toBe(paths.BOOK_VISIT.CHOOSE_TIME)
          expect($('[data-test="additional-support"]').text()).toBe('Wheelchair access')
          expect($('[data-test="change-additional-support"]').attr('href')).toBe(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
          expect($('[data-test="main-contact-name"]').text()).toBe(mainContact.contact)
          expect($('[data-test="main-contact-number"]').text()).toBe(mainContact.phoneNumber)
          expect($('[data-test="change-main-contact"]').attr('href')).toBe(paths.BOOK_VISIT.MAIN_CONTACT)
        })
    })

    it('Should show alternative text when no additional support/phone number provided', () => {
      sessionData.bookingJourney.visitorSupport = ''
      sessionData.bookingJourney.mainContact.phoneNumber = undefined
      return request(app)
        .get(paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Check the visit details before booking -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Check the visit details before booking')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="additional-support"]').text()).toBe('None')
          expect($('[data-test="main-contact-number"]').text()).toBe('No phone number provided')
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.CHECK_DETAILS}`, () => {
    const visit = TestData.visitDto()

    beforeEach(() => {
      visitService.bookVisit.mockResolvedValue(visit)

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('should book visit, clear booking journey data, store booking confirmation and redirect to the visit booked page', () => {
      const expectedBookingConfirmed: BookingConfirmed = {
        prisonCode: sessionData.bookingJourney.prison.code,
        prisonName: sessionData.bookingJourney.prison.prisonName,
        visitReference: visit.reference,
        hasPhoneNumber: true,
      }

      return request(app)
        .post(paths.BOOK_VISIT.CHECK_DETAILS)
        .expect(302)
        .expect('location', paths.BOOK_VISIT.BOOKED)
        .expect(() => {
          expect(sessionData.bookingJourney).toBe(undefined)
          expect(sessionData.bookingConfirmed).toStrictEqual(expectedBookingConfirmed)

          expect(visitService.bookVisit).toHaveBeenCalledWith({
            applicationReference: application.reference,
          })
        })
    })

    describe('Handle API errors', () => {
      const expectedFlashMessage = 'Your visit time is no longer available. Select a new time.'

      it('should set message in flash and redirect to choose visit time page when create application returns 400 Bad Request', () => {
        visitService.bookVisit.mockRejectedValue(new BadRequest())

        return request(app)
          .post(paths.BOOK_VISIT.CHECK_DETAILS)
          .expect(302)
          .expect('location', paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('message', expectedFlashMessage)
            expect(sessionData.bookingJourney).not.toBe(undefined)
            expect(sessionData.bookingConfirmed).toBe(undefined)
            expect(visitService.bookVisit).toHaveBeenCalledWith({
              applicationReference: application.reference,
            })
            expect(sessionData.bookingJourney.selectedVisitSession).toBe(undefined)
          })
      })

      it('should throw any other API error response and not set a message in flash', () => {
        visitService.bookVisit.mockRejectedValue(new InternalServerError())

        return request(app)
          .post(paths.BOOK_VISIT.CHECK_DETAILS)
          .expect(500)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(sessionData.bookingJourney).not.toBe(undefined)
            expect(sessionData.bookingConfirmed).toBe(undefined)
            expect(sessionData.bookingJourney.selectedVisitSession).toStrictEqual(visitSession)
          })
      })
    })
  })
})
