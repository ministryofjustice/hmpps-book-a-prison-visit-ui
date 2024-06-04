import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockVisitService, createMockVisitSessionService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { FlashData } from '../../@types/bapv'
import { SessionRestriction, VisitSessionsCalendar } from '../../services/visitSessionsService'

let app: Express

const visitService = createMockVisitService()
const visitSessionsService = createMockVisitSessionService()
let sessionData: SessionData

const url = '/book-visit/choose-visit-time'

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisonerInfoDto()
const prison = TestData.prisonDto({ policyNoticeDaysMax: 6 }) // small booking window for testing
const visitor = TestData.visitorInfoDto()
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
const sessionRestriction: SessionRestriction = 'OPEN'
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
  let flashData: FlashData

  describe(`GET ${url}`, () => {
    beforeEach(() => {
      visitSessionsService.getVisitSessionsCalendar.mockResolvedValue({
        calendar,
        firstSessionDate,
        allVisitSessionIds,
        sessionRestriction,
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
          allVisitors: [visitor],
          selectedVisitors: [visitor],
        },
      } as SessionData

      app = appWithAllRoutes({ services: { visitSessionsService }, sessionData })
    })

    it('should render calendar for dates in the booking window with available sessions', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Choose the visit time -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/book-visit/select-visitors')
          expect($('h1').text()).toBe('Choose the visit time')

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

          expect($('form[method=POST]').attr('action')).toBe('/book-visit/choose-visit-time')

          // visit session radios per day
          expect($('.visits-calendar__day-group').length).toBe(3)
          expect($('.visits-calendar__day-group legend').eq(0).text().trim()).toBe('Thursday 30 May 2024')
          expect($('.visits-calendar__day-group legend').eq(1).text().trim()).toBe('Friday 31 May 2024')
          expect($('.visits-calendar__day-group legend').eq(2).text().trim()).toBe('Sunday 2 June 2024')

          expect($('input[name=visitSession]').length).toBe(4)
          expect($('input[name=visitSession]').eq(0).attr('value')).toBe('2024-05-30_a')
          expect($('input[name=visitSession]').eq(1).attr('value')).toBe('2024-05-31_b')
          expect($('input[name=visitSession]').eq(2).attr('value')).toBe('2024-05-31_c')
          expect($('input[name=visitSession]').eq(3).attr('value')).toBe('2024-06-02_d')

          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(visitSessionsService.getVisitSessionsCalendar).toHaveBeenCalledWith(
            prison.code,
            prisoner.prisonerNumber,
            [visitor.visitorId],
            prison.policyNoticeDaysMax,
          )

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: [visitor],
              selectedVisitors: [visitor],
              allVisitSessionIds,
              sessionRestriction,
            },
          } as SessionData)
        })
    })

    it('should render a drop-out page when there are no available visit sessions', () => {
      visitSessionsService.getVisitSessionsCalendar.mockResolvedValue({
        calendar: {},
        firstSessionDate: '',
        allVisitSessionIds: [],
        sessionRestriction: undefined,
      })

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^A visit cannot be booked -/)
          expect($('[data-test="back-link"]').attr('href')).toBe('/book-visit/select-visitors')
          expect($('h1').text()).toBe('A visit cannot be booked')

          expect($('main p').eq(0).text()).toContain('no available visit times')
          expect($('[data-test=return-to-home]').text()).toBe('return to the homepage')
          expect($('[data-test=return-to-home]').attr('href')).toBe('/')

          expect(visitSessionsService.getVisitSessionsCalendar).toHaveBeenCalledWith(
            prison.code,
            prisoner.prisonerNumber,
            [visitor.visitorId],
            prison.policyNoticeDaysMax,
          )

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: [visitor],
              selectedVisitors: [visitor],
            },
          } as SessionData)
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

      flashData = { errors: [validationError], formValues: { visitSession: '' } }

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Choose the visit time -/)
          expect($('.govuk-error-summary a[href="#visitSession-error"]').text()).toBe('No visit time selected')
          expect($('#visitSession-error').text()).toContain('No visit time selected')
        })
    })
  })

  describe(`POST ${url}`, () => {
    beforeEach(() => {
      visitService.createVisitApplication.mockResolvedValue(application)

      sessionData = {
        booker: { reference: bookerReference, prisoners: [prisoner] },
        bookingJourney: {
          prisoner,
          prison,
          allVisitors: [visitor],
          selectedVisitors: [visitor],
          allVisitSessionIds,
          sessionRestriction,
        },
      } as SessionData

      app = appWithAllRoutes({ services: { visitService }, sessionData })
    })

    it('it should create a visit application for the selected session and store data in session', () => {
      return request(app)
        .post(url)
        .send({ visitSession: '2024-05-30_a' })
        .expect(302)
        .expect('Location', '/book-visit/additional-support')
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()

          expect(visitService.createVisitApplication).toHaveBeenCalledWith({
            bookingJourney: sessionData.bookingJourney,
            bookerReference,
          })

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [prisoner],
            },
            bookingJourney: {
              prisoner,
              prison,
              allVisitors: [visitor],
              selectedVisitors: [visitor],
              allVisitSessionIds,
              sessionRestriction,
              selectedSessionDate: '2024-05-30',
              selectedSessionTemplateReference: 'a',
              applicationReference: application.reference,
            },
          } as SessionData)
        })
    })

    it('should set a validation error and redirect to original page when no visit time selected', () => {
      const expectedFlashData: FlashData = {
        errors: [
          { type: 'field', location: 'body', path: 'visitSession', value: undefined, msg: 'No visit time selected' },
        ],
        formValues: {},
      }

      return request(app)
        .post(url)
        .expect(302)
        .expect('Location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
          expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
          expect(visitService.createVisitApplication).not.toHaveBeenCalled()
        })
    })

    it('should filter out an invalid visit session date/reference', () => {
      const expectedFlashData: FlashData = {
        errors: [
          { type: 'field', location: 'body', path: 'visitSession', value: undefined, msg: 'No visit time selected' },
        ],
        formValues: {},
      }

      return request(app)
        .post(url)
        .send({ visitSession: 'INVALID_VALUE' })
        .expect(302)
        .expect('Location', url)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashData.errors)
          expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashData.formValues)
          expect(visitService.createVisitApplication).not.toHaveBeenCalled()
        })
    })
  })
})
