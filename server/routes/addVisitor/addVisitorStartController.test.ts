import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  sessionData = { addVisitorJourneyResult: { previous: 'journey data' } } as unknown as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add visitor start journey page', () => {
  describe(`GET ${paths.ADD_VISITOR.START}`, () => {
    it('should render add visitor journey start page and clear any previous session data', () => {
      return request(app)
        .get(paths.ADD_VISITOR.START)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Providing visitor information -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITORS)
          expect($('h1').text().trim()).toBe('Providing visitor information')
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')

          expect(sessionData.addVisitorJourneyResult).toBeUndefined()
        })
    })
  })
})
