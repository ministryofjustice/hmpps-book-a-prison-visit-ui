import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import getPrisonInformation from '../../constants/prisonInformation'

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

describe('Bookings homepage (future visits)', () => {
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
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT}/${futureVisitDetails.visitDisplayId}`,
        )

        expect($('h2').text()).toContain('How to change your booking')
        expect($('[data-test="prison-name"]').text()).toBe(getPrisonInformation('DHI').prisonName)
        expect($('[data-test="prison-phone-number"]').text()).toBe(getPrisonInformation('DHI').prisonPhoneNumber)
        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookingsFuture: [futureVisitDetails],
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
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('h2').text()).not.toContain('How to change your booking')
        expect($('[data-test="no-visits"]').length).toBeTruthy()
      })
  })
})

describe('Past visits page', () => {
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
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT_PAST}/${pastVisitDetails.visitDisplayId}`,
        )

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookingsPast: [pastVisitDetails],
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
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()
      })
  })
})

describe('Cancelled visits page', () => {
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
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.BOOKINGS.VISIT_CANCELLED}/${cancelledVisitDetails.visitDisplayId}`,
        )

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
          },
          bookingsCancelled: [cancelledVisitDetails],
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
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()
      })
  })
})
