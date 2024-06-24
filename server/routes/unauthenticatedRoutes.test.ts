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
  it('should render accessibility statement with GOVUK One Login Header for an authenticated user', () => {
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
        expect($('.service-header__nav-list-item-link').length).toBe(1)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
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
        expect($('.govuk-header__content').text().trim()).toBe('Visit someone in prison')
      })
  })
})

describe('Privacy policy', () => {
  it('should render privacy policy with GOVUK One Login Header for an authenticated user', () => {
    userSupplier = () => user
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.PRIVACY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Privacy policy -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Privacy policy')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(1)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
      })
  })

  it('should render privacy policy with fallback header for an unauthenticated user', () => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(paths.PRIVACY)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Privacy policy -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('Privacy policy')

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .one-login-header').length).toBe(0)
        expect($('.govuk-header__content').text().trim()).toBe('Visit someone in prison')
      })
  })
})

describe('Terms and conditions', () => {
  it('should render terms and conditions with GOVUK One Login Header for an authenticated user', () => {
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
        expect($('.service-header__nav-list-item-link').length).toBe(1)
        expect($('.service-header__nav-list-item-link').eq(0).text().trim()).toBe('Home')
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
        expect($('.govuk-header__content').text().trim()).toBe('Visit someone in prison')
      })
  })
})
