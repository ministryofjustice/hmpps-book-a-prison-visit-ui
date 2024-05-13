import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import { createMockBookerService } from '../services/testutils/mocks'
import TestData from './testutils/testData'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData
  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Home page', () => {
  // For MVP only one prisoner per booker supported; so only first rendered
  it('should render the home page with the prisoner associated with the booker and store prisoners in session', () => {
    const bookerReference = TestData.bookerReference().value
    const prisoner = TestData.prisonerInfoDto()
    bookerService.getPrisoners.mockResolvedValue([prisoner])

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Book a visit')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name=prisonerNumber]').val()).toBe(prisoner.prisonerNumber)
        expect($('form[method=POST]').attr('action')).toBe('/book-a-visit/select-prisoner')
        expect($('[data-test="start-booking"]').text().trim()).toBe('Start')

        expect(bookerService.getPrisoners).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
        } as SessionData)
      })
  })

  it('should render the home page with message when booker has no associated prisoners', () => {
    const bookerReference = TestData.bookerReference().value
    bookerService.getPrisoners.mockResolvedValue([])

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Book a visit')
        expect($('[data-test="prisoner-name"]').length).toBe(0)
        expect($('[data-test="start-booking"]').length).toBe(0)
        expect($('[data-test=no-prisoners]').text()).toBe('No prisoner details found.')

        expect(bookerService.getPrisoners).toHaveBeenCalledWith(bookerReference)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [],
          },
        } as SessionData)
      })
  })
})

describe('Page header', () => {
  it('should render the GOVUK One Login Header on pages where the user is logged in', () => {
    bookerService.getPrisoners.mockResolvedValue([])

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item').length).toBe(3)
        expect($('.service-header__nav-list-item:nth-child(1)').eq(0).text()).toContain('Home')
        expect($('.service-header__nav-list-item:nth-child(2)').eq(0).text()).toContain('Bookings')
        expect($('.service-header__nav-list-item:nth-child(3)').eq(0).text()).toContain('Visitors')
      })
  })
})
