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
const bookerReference = TestData.bookerReference().value

let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    booker: {
      reference: bookerReference,
    },
  } as SessionData

  app = appWithAllRoutes({ services: { visitService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Bookings homepage (future visits list)', () => {
  const futureVisitDetails = TestData.visitDetails()

  it('should render the bookings home page - with a future visit', () => {
    visitService.getFuturePublicVisits.mockResolvedValue([futureVisitDetails])

    return request(app)
      .get(paths.BOOKINGS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Bookings -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Bookings')

        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')
        expect($('[data-test="visit-link-booking-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT}/${futureVisitDetails.visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.CANCEL_VISIT}/${futureVisitDetails.visitDisplayId}`,
        )

        expect($('[data-test=change-booking-heading]').length).toBeFalsy()

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'future',
            visits: [futureVisitDetails],
          },
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
        expect($('h1').text()).toBe('Bookings')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test=change-booking-heading]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'future',
            visits: [],
          },
        } as SessionData)
      })
  })
})

describe('Past visits list page', () => {
  const pastVisitDetails = TestData.visitDetails()

  it('should render the past visits page', () => {
    visitService.getPastPublicVisits.mockResolvedValue([pastVisitDetails])

    return request(app)
      .get(paths.BOOKINGS.PAST)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Past visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.BOOKINGS.HOME)
        expect($('h1').text()).toBe('Past visits')

        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-link-booking-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT_PAST}/${pastVisitDetails.visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(undefined)

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'past',
            visits: [pastVisitDetails],
          },
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
        expect($('h1').text()).toBe('Past visits')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'past',
            visits: [],
          },
        } as SessionData)
      })
  })
})

describe('Cancelled visits list page', () => {
  const cancelledVisitDetails = TestData.visitDetails({ outcomeStatus: 'ESTABLISHMENT_CANCELLED' })

  it('should render the cancelled visits page', () => {
    visitService.getCancelledPublicVisits.mockResolvedValue([cancelledVisitDetails])

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
        expect($('[data-test="visit-link-booking-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT_CANCELLED}/${cancelledVisitDetails.visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(undefined)

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'cancelled',
            visits: [cancelledVisitDetails],
          },
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
        expect($('h1').text()).toBe('Cancelled visits')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookings: {
            type: 'cancelled',
            visits: [],
          },
        } as SessionData)
      })
  })
})
