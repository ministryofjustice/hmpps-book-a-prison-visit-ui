import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import paths from '../constants/paths'
import { createMockPrisonService } from '../services/testutils/mocks'
import TestData from './testutils/testData'

let app: Express
let userSupplier: () => Express.User
const prisonService = createMockPrisonService()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Service start page', () => {
  it('should render service start page with supported prisons, fallback header, no GOVUK service nav for an unauthenticated user', () => {
    const supportedPrisons = [TestData.prisonRegisterPrisonDto()]
    prisonService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
    userSupplier = () => undefined
    app = appWithAllRoutes({ services: { prisonService }, userSupplier })

    return request(app)
      .get(paths.START)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visit someone in prison -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Visit someone in prison')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation').length).toBe(0)

        expect($('[data-test^="prison-"]').length).toBe(1)
        expect($('[data-test^="prison-1"]').text()).toBe(supportedPrisons[0].prisonName)

        expect($('[data-test=start-now]').attr('href')).toBe(paths.SIGN_IN)
      })
  })

  it('should redirect to the home page if an authenticated user visits the service start page', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier })
    return request(app).get(paths.START).expect(302).expect('location', paths.HOME)
  })
})

describe('Accessibility statement', () => {
  it('should render accessibility statement with GOVUK One Login Header for an authenticated user with booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.ACCESSIBILITY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Accessibility statement -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Accessibility statement')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(3)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
        expect($('.service-header__nav-list-item-link').eq(1).text().trim()).toBe('Bookings')
        expect($('.service-header__nav-list-item-link').eq(2).text().trim()).toBe('Visitors')
      })
  })

  it('should render accessibility statement with GOVUK One Login Header and no service nav for an authenticated user with no booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier, populateBooker: false })

    return request(app)
      .get(paths.ACCESSIBILITY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Accessibility statement -/)
        expect($('.service-header__nav-list-item-link').length).toBe(0)
      })
  })

  it('should render accessibility statement with fallback header for an unauthenticated user', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.ACCESSIBILITY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Accessibility statement -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Accessibility statement')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      })
  })
})

describe('Privacy notice', () => {
  it('should render privacy notice with GOVUK One Login Header for an authenticated user with booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.PRIVACY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Privacy notice -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Privacy notice')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(3)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
        expect($('.service-header__nav-list-item-link').eq(1).text().trim()).toBe('Bookings')
        expect($('.service-header__nav-list-item-link').eq(2).text().trim()).toBe('Visitors')
      })
  })

  it('should render privacy notice with GOVUK One Login Header and no service nav for an authenticated user with no booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier, populateBooker: false })

    return request(app)
      .get(paths.PRIVACY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Privacy notice -/)
        expect($('.service-header__nav-list-item-link').length).toBe(0)
      })
  })

  it('should render privacy notice with fallback header for an unauthenticated user', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.PRIVACY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Privacy notice -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Privacy notice')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      })
  })
})

describe('Signed out', () => {
  it('should render signed out page with fallback header', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.SIGNED_OUT)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^You have signed out -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('You have signed out')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      })
  })
})

describe('Terms and conditions', () => {
  it('should render terms and conditions with GOVUK One Login Header for an authenticated user with booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.TERMS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Terms and conditions -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Terms and conditions')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(3)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
        expect($('.service-header__nav-list-item-link').eq(1).text().trim()).toBe('Bookings')
        expect($('.service-header__nav-list-item-link').eq(2).text().trim()).toBe('Visitors')
      })
  })

  it('should render terms and conditions with GOVUK One Login Header and no service nav for an authenticated user with no booker record', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier, populateBooker: false })

    return request(app)
      .get(paths.TERMS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Terms and conditions -/)
        expect($('.service-header__nav-list-item-link').length).toBe(0)
      })
  })

  it('should render terms and conditions with fallback header for an unauthenticated user', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.TERMS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Terms and conditions -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Terms and conditions')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      })
  })
})
