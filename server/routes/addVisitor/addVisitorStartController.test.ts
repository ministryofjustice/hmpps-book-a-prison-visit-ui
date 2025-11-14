import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { disableFeatureForTest, enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

let app: Express

beforeEach(() => {
  enableFeatureForTest('addVisitor')
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add visitor start journey page', () => {
  describe(`GET ${paths.ADD_VISITOR.START}`, () => {
    it('should return a 404 if FEATURE_ADD_VISITOR is not enabled', () => {
      disableFeatureForTest('addVisitor')
      app = appWithAllRoutes({})

      return request(app).get(paths.ADD_VISITOR.START).expect(404)
    })

    it('should render add visitor journey start page', () => {
      return request(app)
        .get(paths.ADD_VISITOR.START)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Providing visitor information -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Providing visitor information')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })
  })
})
