import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import TestData from './testutils/testData'
import paths from '../constants/paths'
import * as utils from '../utils/utils'
import config from '../config'
import { createMockBookerService } from '../services/testutils/mocks'

let app: Express
let sessionData: SessionData

const bookerService = createMockBookerService()

beforeEach(() => {
  sessionData = {} as SessionData
  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Home page', () => {
  const bookerReference = TestData.bookerReference().value

  describe('Booker has a prisoner registered', () => {
    const prisoner = TestData.prisoner()
    bookerService.getPrisoners.mockResolvedValue([prisoner])

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
      bookerService.getPrisoners.mockResolvedValue([])

      return request(app)
        .get(paths.HOME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Book a visit -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Book a visit')
          expect($('[data-test="prisoner-name"]').length).toBe(0)
          expect($('[data-test=no-prisoner]').text()).toBe('No prisoner details found.')
          expect($('[data-test="start-booking"]').length).toBe(0)
          expect($('[data-test="add-prisoner"]').length).toBe(0)

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

  describe('Booker has no prisoner registered (feature flagged with FEATURE_ADD_PRISONER_ENABLED)', () => {
    beforeEach(() => {
      jest.replaceProperty(config, 'features', {
        ...config.features,
        addPrisoner: true,
      })

      app = appWithAllRoutes({ services: { bookerService }, sessionData })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should render the home page with add a prisoner message and button', () => {
      bookerService.getPrisoners.mockResolvedValue([])

      return request(app)
        .get(paths.HOME)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Book a visit -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Book a visit')
          expect($('[data-test="prisoner-name"]').length).toBe(0)
          expect($('[data-test=no-prisoner]').text()).toBe('You need to add a prisoner to book a visit.')
          expect($('[data-test="start-booking"]').length).toBe(0)
          expect($('[data-test="add-prisoner"]').attr('href')).toBe(paths.ADD_PRISONER.LOCATION)

          expect(sessionData).toStrictEqual({
            booker: {
              reference: bookerReference,
              prisoners: [],
            },
          } as SessionData)
        })
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
  beforeEach(() => {
    bookerService.getPrisoners.mockResolvedValue([])
  })

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
