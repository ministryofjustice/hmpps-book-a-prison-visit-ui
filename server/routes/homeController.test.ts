import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import TestData from './testutils/testData'
import paths from '../constants/paths'
import * as utils from '../utils/utils'

let app: Express

let sessionData: SessionData

beforeEach(() => {
  sessionData = {} as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Home page', () => {
  const bookerReference = TestData.bookerReference().value
  const prisoner = TestData.prisoner()

  // For MVP only one prisoner per booker supported; so only first rendered
  it('should render the home page with the prisoner associated with the booker and store prisoners in session', () => {
    return request(app)
      .get(paths.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Book a visit -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Book a visit')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('form[method=POST]').attr('action')).toBe(paths.BOOK_VISIT.SELECT_PRISONER)
        expect($('input[name=prisonerDisplayId]').val()).toBe('uuidv4-1')
        expect($('[data-test="start-booking"]').text().trim()).toBe('Start')

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
        } as SessionData)
      })
  })

  it('should render the home page with message when booker has no associated prisoners', () => {
    sessionData.booker = { reference: bookerReference, prisoners: [] }
    app = appWithAllRoutes({ populateBooker: false, sessionData })

    return request(app)
      .get(paths.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Book a visit -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Book a visit')
        expect($('[data-test="prisoner-name"]').length).toBe(0)
        expect($('[data-test="start-booking"]').length).toBe(0)
        expect($('[data-test=no-prisoners]').text()).toBe('No prisoner details found.')

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [],
          },
        } as SessionData)
      })
  })
})

describe('Return to Home page redirect', () => {
  it('should call clearSession() and redirect to home', () => {
    const clearSession = jest.spyOn(utils, 'clearSession')

    return request(app)
      .get(paths.RETURN_HOME)
      .expect(302)
      .expect('Location', paths.HOME)
      .expect(() => {
        expect(clearSession).toHaveBeenCalled()
      })
  })
})

describe('Page header', () => {
  it('should render the GOVUK One Login Header on pages where the user is logged in', () => {
    return request(app)
      .get(paths.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toBe('Book a visit - Visit someone in prison - GOV.UK')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(3)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
        expect($('.service-header__nav-list-item-link').eq(1).text().trim()).toBe('Bookings')
        expect($('.service-header__nav-list-item-link').eq(2).text().trim()).toBe('Visitors')
      })
  })

  it('should render the phase banner', () => {
    return request(app)
      .get(paths.HOME)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toBe('Book a visit - Visit someone in prison - GOV.UK')
        expect($('.govuk-phase-banner').text()).toContain('Beta')
      })
  })
})
