import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'

let app: Express
let userSupplier: () => Express.User

const authenticatedUserPages = [
  [paths.ACCESSIBILITY, 'Accessibility statement for Visit someone in prison'],
  [paths.PRIVACY, 'Privacy notice'],
  [paths.TERMS, 'Terms and conditions'],
]

const unauthenticatedUserPages = [...authenticatedUserPages, [paths.SIGNED_OUT, 'You have signed out']]

describe('Static content pages - authenticated users', () => {
  it.each(authenticatedUserPages)('%s - with GOVUK One Login header', (path, pageTitle) => {
    app = appWithAllRoutes({})

    return request(app)
      .get(path)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(new RegExp(`^${pageTitle} -`))
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe(pageTitle)
        expect($('header .rebranded-one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
        expect($('.govuk-service-navigation__link').length).toBe(3)
        expect($('.govuk-service-navigation__link').eq(0).text().trim()).toBe('Home')
        expect($('.govuk-service-navigation__link').eq(1).text().trim()).toBe('Bookings')
        expect($('.govuk-service-navigation__link').eq(2).text().trim()).toBe('Visitors')
      })
  })
})

describe('Static content pages - unauthenticated users', () => {
  it.each(unauthenticatedUserPages)('%s - with GOVUK One Login header', (path, pageTitle) => {
    userSupplier = () => undefined
    app = appWithAllRoutes({ userSupplier })

    return request(app)
      .get(path)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(new RegExp(`^${pageTitle} -`))
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe(pageTitle)

        expect($('header.govuk-header').length).toBe(1)
        expect($('header .rebranded-one-login-header').length).toBe(0)
        expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      })
  })
})
