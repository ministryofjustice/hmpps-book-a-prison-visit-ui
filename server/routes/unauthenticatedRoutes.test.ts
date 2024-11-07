import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import paths from '../constants/paths'

let app: Express
let userSupplier: () => Express.User

afterEach(() => {
  jest.resetAllMocks()
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
