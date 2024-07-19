import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import paths from '../constants/paths'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('Access denied page', () => {
  it('should render the access denied page when booker has not been set in session', () => {
    app = appWithAllRoutes({ populateBooker: false })

    return request(app)
      .get(paths.ACCESS_DENIED)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^You cannot access this service -/)
        expect($('[data-test="back-link"]').length).toBe(0)
        expect($('h1').text()).toBe('You cannot access this service')

        expect($('header .one-login-header').length).toBe(1)
        expect($('header.govuk-header').length).toBe(0)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item-link').length).toBe(0)
      })
  })

  it('should redirect to home and not render the access denied page if booker set in session', () => {
    app = appWithAllRoutes({})

    return request(app).get(paths.ACCESS_DENIED).expect(302).expect('Location', paths.HOME)
  })
})
