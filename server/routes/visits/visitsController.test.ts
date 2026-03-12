import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockBookerService, createMockVisitService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { VisitDetails } from '../../services/visitService'
import { Prisoner } from '../../services/bookerService'

let app: Express

const visitService = createMockVisitService()
const bookerService = createMockBookerService()
const bookerReference = TestData.bookerReference().value

let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData

  app = appWithAllRoutes({ services: { visitService, bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

// Short term redirect from old bookings URL to new visits URL (because old URL in confirmation emails)
describe('/bookings => /visits redirect', () => {
  it('should redirect /bookings to the Visits home page', () => {
    return request(app).get('/bookings').expect(302).expect('Location', paths.VISITS.HOME)
  })
})

describe('Visits home page (future visits list)', () => {
  const futureVisitDetails = [TestData.visitDetails(), TestData.visitDetails({ visitSubStatus: 'REQUESTED' })]
  const prisoner = TestData.prisoner()

  it('should render the Visits home page - with a future visit', () => {
    bookerService.getPrisoners.mockResolvedValue([prisoner])
    visitService.getFuturePublicVisits.mockResolvedValue(futureVisitDetails)

    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visits -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Visits')
        expect($('[data-test="prisoner-name-at-location"]').text()).toContain('John Smith at Hewell (HMP)')
        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="tag-1"]').length).toBe(0)
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-reference-1"]').text()).toBe('ab-cd-ef-gh')
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.VISITS.DETAILS}/${futureVisitDetails[0].visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(
          `${paths.VISITS.CANCEL_VISIT}/${futureVisitDetails[0].visitDisplayId}`,
        )

        expect($('[data-test="tag-2"]').text()).toContain(`Awaiting review`)

        expect($('[data-test=change-visit-heading]').length).toBeFalsy()

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'future',
          visits: futureVisitDetails,
        } as SessionData['bookedVisits'])
      })
  })

  it('should render the Visits home page - with no future visits', () => {
    bookerService.getPrisoners.mockResolvedValue([prisoner])
    visitService.getFuturePublicVisits.mockResolvedValue([])

    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Visits')
        expect($('[data-test="prisoner-name-at-location"]').text()).toContain('John Smith at Hewell (HMP)')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test=change-visit-heading]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getFuturePublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'future',
          visits: [],
        } as SessionData['bookedVisits'])
      })
  })

  it('should render the Visits home page with the prisoner associated with the booker and store prisoners in session', () => {
    bookerService.getPrisoners.mockResolvedValue([prisoner])
    visitService.getFuturePublicVisits.mockResolvedValue([])
    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visits -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Visits')
        expect($('[data-test="prisoner-name-at-location"]').text()).toContain('John Smith at Hewell (HMP)')
        expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
        expect($('input[name=prisonerDisplayId]').val()).toBe('uuidv4-1-1-1-1')
        expect($('[data-test="book-a-visit"]').text().trim()).toBe('Book a visit')

        expect(bookerService.getPrisoners).toHaveBeenCalledWith(bookerReference)
        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookedVisits: {
            type: 'future',
            visits: [] as VisitDetails[],
          },
        } as SessionData)
      })
  })

  it('should render the Visits home page with add a prisoner message and button', () => {
    bookerService.getPrisoners.mockResolvedValue([])

    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visits -/)
        expect($('h1').text()).toBe('Visits')
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('[data-test="prisoner-name"]').length).toBe(0)
        expect($('[data-test=no-prisoner]').text()).toBe('You need to add a prisoner to book a visit.')
        expect($('[data-test="start"]').length).toBe(0)
        expect($('[data-test="add-prisoner"]').attr('href')).toBe(paths.ADD_PRISONER.LOCATION)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [] as Prisoner[],
          },
          bookedVisits: {
            type: 'future',
            visits: [] as VisitDetails[],
          },
        } as SessionData)
      })
  })

  it('Page header - should render the GOVUK One Login Header on pages where the user is logged in', () => {
    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('head > title').text()).toBe('Visits - Visit someone in prison - GOV.UK')

        expect($('header .rebranded-one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
        expect($('.govuk-service-navigation__link').length).toBe(2)
        expect($('.govuk-service-navigation__link').eq(0).text().trim()).toBe('Visits')
        expect($('.govuk-service-navigation__link').eq(1).text().trim()).toBe('Visitors')
      })
  })

  it('Page header - should render the phase banner', () => {
    return request(app)
      .get(paths.VISITS.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('head > title').text()).toBe('Visits - Visit someone in prison - GOV.UK')
        expect($('.govuk-phase-banner').text()).toContain('Beta')
      })
  })
})

describe('Past visits list page', () => {
  const pastVisitDetails = TestData.visitDetails()

  it('should render the past visits page', () => {
    visitService.getPastPublicVisits.mockResolvedValue([pastVisitDetails])

    return request(app)
      .get(paths.VISITS.PAST)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Past visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
        expect($('h1').text()).toBe('Past visits')

        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.VISITS.VISIT_PAST}/${pastVisitDetails.visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(undefined)

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'past',
          visits: [pastVisitDetails],
        } as SessionData['bookedVisits'])
      })
  })

  it('should render the past visits page - with no past visits', () => {
    visitService.getPastPublicVisits.mockResolvedValue([])

    return request(app)
      .get(paths.VISITS.PAST)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Past visits')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getPastPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'past',
          visits: [],
        } as SessionData['bookedVisits'])
      })
  })
})

describe('Cancelled visits list page', () => {
  const cancelledVisitDetails = TestData.visitDetails({ outcomeStatus: 'ESTABLISHMENT_CANCELLED' })

  it('should render the cancelled visits page', () => {
    visitService.getCancelledPublicVisits.mockResolvedValue([cancelledVisitDetails])

    return request(app)
      .get(paths.VISITS.CANCELLED)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Rejected and cancelled visits -/)
        expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITS.HOME)
        expect($('h1').text()).toBe('Rejected and cancelled visits')

        expect($('[data-test="visit-date-1"]').text()).toBe('Thursday 30 May 2024')
        expect($('[data-test="visit-start-time-1"]').text()).toBe('10am')
        expect($('[data-test="visit-end-time-1"]').text()).toBe('11:30am')
        expect($('[data-test="visit-link-1"]').attr('href')).toBe(
          `${paths.VISITS.VISIT_CANCELLED}/${cancelledVisitDetails.visitDisplayId}`,
        )
        expect($('[data-test="visit-link-cancel-1"]').attr('href')).toBe(undefined)

        expect($('[data-test="no-visits"]').length).toBeFalsy()

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'cancelled',
          visits: [cancelledVisitDetails],
        } as SessionData['bookedVisits'])
      })
  })

  it('should render the cancelled visits page - with no cancelled visits', () => {
    visitService.getCancelledPublicVisits.mockResolvedValue([])

    return request(app)
      .get(paths.VISITS.CANCELLED)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Rejected and cancelled visits')
        expect($('[data-test="visit-date-1"]').length).toBeFalsy()
        expect($('[data-test="no-visits"]').length).toBeTruthy()

        expect(visitService.getCancelledPublicVisits).toHaveBeenCalledWith(bookerReference)

        expect(sessionData.bookedVisits).toStrictEqual({
          type: 'cancelled',
          visits: [],
        } as SessionData['bookedVisits'])
      })
  })
})
