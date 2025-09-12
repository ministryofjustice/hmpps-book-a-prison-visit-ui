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

describe('/select-prison', () => {
  // Full tests for this route in ./server/routes/selectPrison
  it('should render select prison page', () => {
    prisonService.getAllPrisonNames.mockResolvedValue([])

    app = appWithAllRoutes({ services: { prisonService } })
    return request(app)
      .get(paths.SELECT_PRISON)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Which prison are you visiting\? -/)
      })
  })
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
