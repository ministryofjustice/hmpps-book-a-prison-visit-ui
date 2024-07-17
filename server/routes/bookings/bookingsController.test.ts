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
const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner({ prisonId: 'DHI' })
let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
    bookings: [orchestrationVisitDto],
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
        expect($('form[method=POST]').attr('action')).toBe(paths.BOOKINGS.HOME)
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
          bookings: [orchestrationVisitDto],
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
      })
  })
})
