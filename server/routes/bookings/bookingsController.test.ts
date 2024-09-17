import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'

let app: Express

const visitService = createMockVisitService()
const orchestrationVisitDto = TestData.orchestrationVisitDto()
const pastVisitDto = TestData.orchestrationVisitDto({
  startTimestamp: '2023-05-30T10:00:00',
  endTimestamp: '2023-05-30T11:30:00',
})
const cancelledVisitDto = TestData.orchestrationVisitDto({ outcomeStatus: 'ESTABLISHMENT_CANCELLED' })
const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner({ prisonId: 'DHI' })
let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
  } as SessionData

  app = appWithAllRoutes({ services: { visitService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Bookings homepage', () => {
  it('should render the bookings home page - with a future visit', () => {
    visitService.getFuturePublicVisits.mockResolvedValue([orchestrationVisitDto])
    return request(app)
      .get(paths.BOOKINGS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Bookings -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Bookings')
        expect($('h2').text()).toContain('How to change your booking')
        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookingsFuture: [orchestrationVisitDto],
        } as SessionData)
      })
  })

  it('should render the bookings home page - with no future visits', () => {
    visitService.getFuturePublicVisits.mockResolvedValue([])
    return request(app)
      .get(paths.BOOKINGS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Bookings -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Bookings')
        expect($('h2').text()).not.toContain('How to change your booking')
        expect($('[data-test="no-visits"]').text()).toBe('You do not have any future bookings.')
      })
  })
})

describe('Cancelled visits page', () => {
  it('should render the cancelled visits page', () => {
    visitService.getCancelledPublicVisits.mockResolvedValue([cancelledVisitDto])
    return request(app)
      .get(paths.BOOKINGS.CANCELLED)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Cancelled visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Cancelled visits')
        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookingsCancelled: [cancelledVisitDto],
        } as SessionData)
      })
  })

  it('should render the cancelled visits page - with no cancelled visits', () => {
    visitService.getCancelledPublicVisits.mockResolvedValue([])
    return request(app)
      .get(paths.BOOKINGS.CANCELLED)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Cancelled visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Cancelled visits')
        expect($('[data-test="no-visits"]').text()).toBe('You do not have any cancelled bookings.')
      })
  })
})

describe('Past visits page', () => {
  it('should render the past visits page', () => {
    visitService.getPastPublicVisits.mockResolvedValue([pastVisitDto])
    return request(app)
      .get(paths.BOOKINGS.PAST)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Past visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Past visits')
        expect($('[data-test="visit-date-1"]').text()).toBe('Tuesday 30 May 2023')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookingsPast: [pastVisitDto],
        } as SessionData)
      })
  })

  it('should render the past visits page - with no past visits', () => {
    visitService.getPastPublicVisits.mockResolvedValue([])
    return request(app)
      .get(paths.BOOKINGS.PAST)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Past visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Past visits')
        expect($('[data-test="no-visits"]').text()).toBe('You do not have any past bookings.')
      })
  })
})
