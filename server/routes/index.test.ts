import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.service-header__heading').text()).toBe('Visit someone in prison')
        expect($('.service-header__nav-list-item').length).toBe(3)
        expect($('.service-header__nav-list-item:nth-child(1)').eq(0).text()).toContain('Home')
        expect($('.service-header__nav-list-item:nth-child(2)').eq(0).text()).toContain('Bookings')
        expect($('.service-header__nav-list-item:nth-child(3)').eq(0).text()).toContain('Visitors')
        expect($('h1.govuk-heading-l').text()).toBe('Book a visit')
        expect($('[data-test="prisoner-name"]').text()).toBe('Adam Greene')
      })
  })
})
