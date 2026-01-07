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
      result: true,
    },
  } as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add visitor request success page', () => {
  describe(`GET ${paths.ADD_VISITOR.SUCCESS}`, () => {
    it('should return a 404 if FEATURE_ADD_VISITOR is not enabled', () => {
      disableFeatureForTest('addVisitor')
      app = appWithAllRoutes({})

      return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(404)
    })

    it('should render add visitor journey request success page and clear session data', () => {
      return request(app)
        .get(paths.ADD_VISITOR.SUCCESS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Request submitted -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Request submitted')
          expect($('[data-test="link-a-visitor"]').text().trim()).toBe('Link another visitor')
          expect($('[data-test="link-a-visitor"]').attr('href')).toBe(paths.ADD_VISITOR.DETAILS)

          expect(sessionData.addVisitorJourney).toBeUndefined()
        })
    })

    it('should redirect to visitors page if add visitor request result not in session', () => {
      delete sessionData.addVisitorJourney.result

      return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.VISITORS)
    })
  })
})
