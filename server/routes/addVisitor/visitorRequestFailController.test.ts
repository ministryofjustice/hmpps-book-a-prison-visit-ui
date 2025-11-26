import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { disableFeatureForTest, enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  enableFeatureForTest('addVisitor')

  sessionData = {
    addVisitorJourney: {
      visitorDetails: {
        firstName: 'first',
        lastName: 'last',
        'visitorDob-day': '1',
        'visitorDob-month': '2',
        'visitorDob-year': '2000',
        visitorDob: '2000-02-01',
      },
    },
  } as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add visitor request failure pages', () => {
  describe(`GET ${paths.ADD_VISITOR.SUCCESS}`, () => {
    it('should return a 404 if FEATURE_ADD_VISITOR is not enabled', () => {
      disableFeatureForTest('addVisitor')
      app = appWithAllRoutes({})

      return request(app).get(paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED).expect(404)
    })

    it('should render add visitor journey request failure page - visitor already requested', () => {
      sessionData.addVisitorJourney.result = 'REQUEST_ALREADY_EXISTS'

      return request(app)
        .get(paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor already requested -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visitor already requested')

          expect($('[data-test="visitor-name"]').text()).toBe('first last')

          expect(sessionData.addVisitorJourney).toBeUndefined()
        })
    })

    it('should render add visitor journey request failure page - visitor already linked', () => {
      sessionData.addVisitorJourney.result = 'VISITOR_ALREADY_EXISTS'

      return request(app)
        .get(paths.ADD_VISITOR.FAIL_ALREADY_LINKED)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor already linked -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visitor already linked')

          expect($('[data-test="visitor-name"]').text()).toBe('first last')

          expect(sessionData.addVisitorJourney).toBeUndefined()
        })
    })

    it('should render add visitor journey request failure page - too many requests', () => {
      sessionData.addVisitorJourney.result = 'MAX_IN_PROGRESS_REQUESTS_REACHED'

      return request(app)
        .get(paths.ADD_VISITOR.FAIL_TOO_MANY_REQUESTS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cannot submit visitor request -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Cannot submit visitor request')

          expect(sessionData.addVisitorJourney).toBeUndefined()
        })
    })

    it('should redirect to visitors page if add visitor request result not in session', () => {
      return request(app).get(paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED).expect(302).expect('location', paths.VISITORS)
    })
  })
})
