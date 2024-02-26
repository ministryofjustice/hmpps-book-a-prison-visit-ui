import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'

let app: Express

const supportedPrisonsService = createMockSupportedPrisonsService()

beforeEach(() => {
  supportedPrisonsService.getSupportedPrisonIds.mockResolvedValue(['HEI', 'PNI'])
  app = appWithAllRoutes({ services: { supportedPrisonsService } })
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

describe('GET /prisons', () => {
  it('should render prisons page with API call', () => {
    return request(app)
      .get('/prisons')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Test API call')
        expect(res.text).toContain('HEI')
        expect(res.text).toContain('PNI')
        expect(supportedPrisonsService.getSupportedPrisonIds).toHaveBeenCalledWith()
      })
  })
})
