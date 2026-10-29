import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { createMockBookerService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { enableFeatureForTest, disableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()

beforeEach(() => {
  enableFeatureForTest('multiplePrisoners')
  bookerService.getVisitorRequests.mockResolvedValue([])
  bookerService.getPrisoners.mockResolvedValue([prisoner])
  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
  } as SessionData
  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoners page', () => {
  it('should return a 404 if FEATURE_MULTIPLE_PRISONERS is disabled', () => {
    disableFeatureForTest('multiplePrisoners')
    app = appWithAllRoutes({ services: { bookerService }, sessionData })
    return request(app).get(paths.PRISONERS).expect(404)
  })

  it('should render the link new prisoner section when no prisoners are linked', () => {
    bookerService.getPrisoners.mockResolvedValue([])
    return request(app)
      .get(paths.PRISONERS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Prisoners and Visitors -/)
        expect($('h1').text()).toBe('Prisoners and Visitors')
        expect($('h2[data-test="prisoners-linked"]').length).toBe(0)
        expect($('[data-test="prisoners-table"]').length).toBe(0)
        expect($('h2[data-test="link-new-prisoner"]').text()).toBe('Link a new prisoner')
        expect($('[data-test="link-new-prisoner-button"]').text().trim()).toBe('Link a new prisoner')
      })
  })

  it('should render the prisoners page with all prisoners associated with the booker', () => {
    return request(app)
      .get(paths.PRISONERS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Prisoners and Visitors -/)
        expect($('h1').text()).toBe('Prisoners and Visitors')
        expect($('h2[data-test="prisoners-linked"]').text()).toBe('Prisoners linked to your account')
        expect($('[data-test="prisoners-table"]').length).toBe(1)
        expect($('[data-test="prisoner-name-0"]').text().trim()).toBe('John Smith')
        expect($('[data-test="prisoner-dob-0"]').text().trim()).toBe('1 February 1980')
        expect($('h2[data-test="link-new-prisoner"]').text()).toBe('Link a new prisoner')
        expect($('[data-test="link-new-prisoner-button"]').text().trim()).toBe('Link a new prisoner')
      })
  })
})
