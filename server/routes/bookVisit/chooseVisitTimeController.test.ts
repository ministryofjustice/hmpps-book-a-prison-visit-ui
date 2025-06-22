import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { BadRequest, InternalServerError } from 'http-errors'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockVisitService, createMockVisitSessionsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { VisitSessionsCalendar } from '../../services/visitSessionsService'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { SessionRestriction } from '../../data/orchestrationApiClient'
import { MoJAlert } from '../../@types/bapv'

jest.mock('../../../logger')

let app: Express

const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionsService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const prison = TestData.prisonDto({ policyNoticeDaysMax: 6 }) // small booking window for testing
const visitor = TestData.visitor()
const sessionRestriction: SessionRestriction = 'OPEN'
const firstSessionDate = '2024-05-30'
const calendar: VisitSessionsCalendar = {
  '2024-05': {
    '2024-05-28': [],
    '2024-05-29': [],
    '2024-05-30': [{ reference: 'a', startTime: '10:00', endTime: '11:30' }],
    '2024-05-31': [
      { reference: 'b', startTime: '09:00', endTime: '09:45' },
      { reference: 'c', startTime: '14:00', endTime: '15:00' },
    ],
  },
  '2024-06': {
    '2024-06-01': [],
    '2024-06-02': [{ reference: 'd', startTime: '09:00', endTime: '11:00' }],
    '2024-06-03': [],
  },
}
const allVisitSessionIds: string[] = ['2024-05-30_a', '2024-05-31_b', '2024-05-31_c', '2024-06-02_d']

const visitSessionA = TestData.availableVisitSessionDto({ sessionDate: '2024-05-30', sessionTemplateReference: 'a' })
const visitSessionB = TestData.availableVisitSessionDto({ sessionDate: '2024-05-31', sessionTemplateReference: 'b' })
const visitSessionC = TestData.availableVisitSessionDto({ sessionDate: '2024-05-31', sessionTemplateReference: 'c' })
const visitSessionD = TestData.availableVisitSessionDto({ sessionDate: '2024-06-02', sessionTemplateReference: 'd' })
const allVisitSessions = [visitSessionA, visitSessionB, visitSessionC, visitSessionD]

const application = TestData.applicationDto()

const fakeDate = new Date('2024-05-28')

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true, now: fakeDate })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Choose visit time', () => {
  describe(`GET ${paths.BOOK_VISIT.CHOOSE_TIME}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      visitSessionsService.getVisitSessionsCalendar.mockResolvedValue({
        calendar,
        firstSessionDate,
        allVisitSessionIds,
        allVisitSessions,
      })

      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      sessionData = {
        booker: {
          reference: bookerReference,
          prisoners: [prisoner],
        },
        bookingJourney: {
          prisoner,
          prison,
          eligibleVisitors: [visitor],
          selectedVisitors: [visitor],
          sessionRestriction,
        },
      } as SessionData

      app = appWithAllRoutes({ services: { visitSessionsService }, sessionData })
    })

    it('should use the session validation middleware', () => {
      sessionData.bookingJourney.prisoner = undefined

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect(302)
        .expect('Location', paths.HOME)
        .expect(res => {
          expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
        })
    })

    it('should render calendar for dates in the booking window with available sessions', () => {
      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Choose the visit time -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_VISITORS)
          expect($('h1').text()).toBe('Choose the visit time')

          expect($('[data-test="message"]').length).toBe(0)
          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')

          // calendar months, day listing and start day column
          expect($('.visits-calendar h2').eq(0).text()).toBe('May 2024')
          expect($('.visits-calendar__month').eq(0).children('.visits-calendar__day').length).toBe(4)
          expect(
            $('.visits-calendar__month')
              .eq(0)
              .children('.visits-calendar__day')
              .hasClass('visits-calendar__day--start-col-2'),
          ).toBe(true)
          expect($('.visits-calendar h2').eq(1).text()).toBe('June 2024')
          expect($('.visits-calendar__month').eq(1).children('.visits-calendar__day').length).toBe(3)
          expect(
            $('.visits-calendar__month')
              .eq(1)
              .children('.visits-calendar__day')
              .hasClass('visits-calendar__day--start-col-6'),
          ).toBe(true)

          // available visit session day links
          expect($('.visits-calendar__day a').length).toBe(3)
          expect($('.visits-calendar__day a').eq(0).attr('href')).toBe('#day-group-2024-05-30')
          expect($('.visits-calendar__day a').eq(1).attr('href')).toBe('#day-group-2024-05-31')
          expect($('.visits-calendar__day a').eq(2).attr('href')).toBe('#day-group-2024-06-02')
          expect($('.visits-calendar__day--selected a').text().trim().replace(/\s+/g, ' ')).toBe(
            '30 May - Thursday - 1 visit time available',
          )

          expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.CHOOSE_TIME)

          // visit session radios per day
          expect($('.visits-calendar__day-group').length).toBe(3)
          expect($('.visits-calendar__day-group legend').eq(0).text().trim()).toBe('Thursday 30 May 2024')
          expect($('.visits-calendar__day-group legend').eq(1).text().trim()).toBe('Friday 31 May 2024')
          expect($('.visits-calendar__day-group legend').eq(2).text().trim()).toBe('Sunday 2 June 2024')

          expect($('input[name=visitSession]').length).toBe(4)
          expect($('input[name=visitSession]:checked').length).toBe(0)
          expect($('input[name=visitSession]').eq(0).attr('value')).toBe('2024-05-30_a')
          expect($('input[name=visitSession]').eq(1).attr('value')).toBe('2024-05-31_b')
          expect($('input[name=visitSession]').eq(2).attr('value')).toBe('2024-05-31_c')
          expect($('input[name=visitSession]').eq(3).attr('value')).toBe('2024-06-02_d')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(visitSessionsService.getVisitSessionsCalendar).toHaveBeenCalledWith({
            prisonId: prison.code,
            prisonerId: prisoner.prisonerNumber,
            visitorIds: [visitor.visitorId],
            bookerReference,
            daysAhead: prison.policyNoticeDaysMax,
          })
        })
    })

    it('should have back link to closed visit page if sessionRestriction is CLOSED', () => {
      sessionData.bookingJourney.sessionRestriction = 'CLOSED'

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Choose the visit time -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.CLOSED_VISIT)
          expect($('h1').text()).toBe('Choose the visit time')
        })
    })

    it('should render alert message if set in flash', () => {
      const alert: MoJAlert = { variant: 'error', title: 'Alert title', showTitleAsHeading: true, text: 'Alert text' }
      flashData = { messages: [alert] }

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.moj-alert').eq(0).text().trim()).toContain(alert.title)
          expect($('.moj-alert').eq(0).text().trim()).toContain(alert.text)
        })
    })

    it('should pre-populate with data in session', () => {
      sessionData.bookingJourney.selectedVisitSession = visitSessionC
      sessionData.bookingJourney.applicationReference = application.reference

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.visits-calendar__day--selected a').text().trim().replace(/\s+/g, ' ')).toBe(
            '31 May - Friday - 2 visit times available',
          )
          expect($('input[name=visitSession]').length).toBe(4)
          expect($('input[name=visitSession]:checked').length).toBe(1)
          expect($('input[name=visitSession]').eq(2).attr('value')).toBe('2024-05-31_c')
          expect($('input[name=visitSession]').eq(2).prop('checked')).toBe(true)
        })
    })

    it('should render a drop-out page when there are no available visit sessions', () => {
      visitSessionsService.getVisitSessionsCalendar.mockResolvedValue({
        calendar: {},
        firstSessionDate: '',
        allVisitSessionIds: [],
        allVisitSessions: [],
      })

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('#service-header__nav').length).toBe(0)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOK_VISIT.SELECT_VISITORS)
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('main p').eq(0).text()).toContain('no available visit times')
          expect($('[data-test=return-to-home]').text()).toBe('return to the homepage')
          expect($('[data-test=return-to-home]').attr('href')).toBe(paths.HOME)

          expect(visitSessionsService.getVisitSessionsCalendar).toHaveBeenCalledWith({
            prisonId: prison.code,
            prisonerId: prisoner.prisonerNumber,
            visitorIds: [visitor.visitorId],
            bookerReference,
            daysAhead: prison.policyNoticeDaysMax,
          })
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'visitSession',
        value: [],
        msg: 'No visit time selected',
      }

      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.BOOK_VISIT.CHOOSE_TIME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Choose the visit time -/)
          expect($('.govuk-error-summary a[href="#visitSession-error"]').text()).toBe('No visit time selected')
          expect($('#visitSession-error').text()).toContain('No visit time selected')
        })
    })
  })

  describe(`POST ${paths.BOOK_VISIT.CHOOSE_TIME}`, () => {
    beforeEach(() => {
      visitService.createVisitApplication.mockResolvedValue(application)
      visitService.changeVisitApplication.mockResolvedValue(application)

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: {
          prisoner,
          prison,
          eligibleVisitors: [visitor],
          selectedVisitors: [visitor],
          sessionRestriction,
          allVisitSessionIds,
          allVisitSessions,
        },
      } as SessionData

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('should create a visit application for the selected date/time and store data in session', () => {
      return request(app)
        .post(paths.BOOK_VISIT.CHOOSE_TIME)
        .send({ visitSession: '2024-05-30_a' })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()

          expect(visitService.createVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
            bookerReference,
          })
          expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

          expect(sessionData.bookingJourney.selectedVisitSession.sessionDate).toBe('2024-05-30')
          expect(sessionData.bookingJourney.selectedVisitSession.sessionTemplateReference).toBe('a')
          expect(sessionData.bookingJourney.applicationReference).toBe(application.reference)
        })
    })

    it('should update an in-progress visit application with selected date/time and store data in session', () => {
      const { bookingJourney } = sessionData
      bookingJourney.selectedVisitSession = visitSessionA
      bookingJourney.applicationReference = application.reference

      return request(app)
        .post(paths.BOOK_VISIT.CHOOSE_TIME)
        .send({ visitSession: '2024-06-02_d' })
        .expect(302)
        .expect('Location', paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()

          expect(visitService.createVisitApplication).not.toHaveBeenCalled()
          expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
            bookingJourney,
          })

          expect(bookingJourney.selectedVisitSession.sessionDate).toBe('2024-06-02')
          expect(bookingJourney.selectedVisitSession.sessionTemplateReference).toBe('d')
          expect(bookingJourney.applicationReference).toBe(application.reference)
        })
    })

    describe('Handle API errors', () => {
      const expectedFlashMessage: MoJAlert = {
        variant: 'error',
        title: 'Your visit time is no longer available',
        showTitleAsHeading: true,
        text: 'Select a new time.',
      }

      it('should set message in flash and redirect to current page when create application returns 400 Bad Request', () => {
        visitService.createVisitApplication.mockRejectedValue(new BadRequest())

        return request(app)
          .post(paths.BOOK_VISIT.CHOOSE_TIME)
          .send({ visitSession: '2024-05-30_a' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('messages', expectedFlashMessage)
            expect(visitService.createVisitApplication).toHaveBeenCalledWith({
              bookingJourney: sessionData.bookingJourney,
              bookerReference,
            })
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()

            expect(sessionData.bookingJourney.selectedVisitSession).toBe(undefined)
          })
      })

      it('should set message in flash and redirect to current page when change application returns 400 Bad Request', () => {
        const { bookingJourney } = sessionData
        bookingJourney.selectedVisitSession = visitSessionA
        bookingJourney.applicationReference = application.reference

        visitService.changeVisitApplication.mockRejectedValue(new BadRequest())

        return request(app)
          .post(paths.BOOK_VISIT.CHOOSE_TIME)
          .send({ visitSession: '2024-05-30_a' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('messages', expectedFlashMessage)
            expect(visitService.createVisitApplication).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).toHaveBeenCalledWith({
              bookingJourney: sessionData.bookingJourney,
            })

            expect(sessionData.bookingJourney.selectedVisitSession).toBe(undefined)
          })
      })

      it('should throw any other API error response and not set a message in flash', () => {
        visitService.createVisitApplication.mockRejectedValue(new InternalServerError())

        return request(app)
          .post(paths.BOOK_VISIT.CHOOSE_TIME)
          .send({ visitSession: '2024-05-30_a' })
          .expect(500)
          .expect(() => {
            expect(flashProvider).not.toHaveBeenCalled()
            expect(sessionData.bookingJourney.selectedVisitSession).toStrictEqual(visitSessionA)
          })
      })
    })

    describe('Validation errors', () => {
      const expectedFlashErrors: FieldValidationError[] = [
        { type: 'field', location: 'body', path: 'visitSession', value: undefined, msg: 'No visit time selected' },
      ]

      it('should set a validation error and redirect to original page when no visit time selected', () => {
        return request(app)
          .post(paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(visitService.createVisitApplication).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })

      it('should filter out an invalid visit session date/reference', () => {
        return request(app)
          .post(paths.BOOK_VISIT.CHOOSE_TIME)
          .send({ visitSession: 'INVALID_VALUE' })
          .expect(302)
          .expect('Location', paths.BOOK_VISIT.CHOOSE_TIME)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(visitService.createVisitApplication).not.toHaveBeenCalled()
            expect(visitService.changeVisitApplication).not.toHaveBeenCalled()
          })
      })
    })
  })
})
