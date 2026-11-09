import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'
import { enableFeatureForTest, disableFeatureForTest } from '../../../data/testutils/mockFeatureFlags'
import TestData from '../../testutils/testData'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  enableFeatureForTest('multiplePrisoners')
  sessionData = {
    addVisitorJourneyResult: {
      firstName: 'First',
      lastName: 'Last',
      result: 'REQUESTED',
      prisoner: TestData.prisoner(),
    },
  } as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Add visitor request success page', () => {
  describe(`GET ${paths.ADD_VISITOR.SUCCESS}`, () => {
    it('should render add visitor journey request success page', () => {
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
          expect($('[data-test="link-a-visitor"]').attr('href')).toBe(`${paths.ADD_VISITOR.DETAILS}/uuidv4-1-1-1-1`)
        })
    })

    it('should have original add visitor link when FEATURE_MULTIPLE_PRISONERS is disabled', () => {
      disableFeatureForTest('multiplePrisoners')
      app = appWithAllRoutes({ sessionData })

      return request(app)
        .get(paths.ADD_VISITOR.SUCCESS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="link-a-visitor"]').attr('href')).toBe(paths.ADD_VISITOR.DETAILS)
        })
    })

    it('should render add visitor journey auto approved page', () => {
      return request(app)
        .get(paths.ADD_VISITOR.AUTO_APPROVED)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor linked/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text().trim()).toBe('Visitor linked')
          expect($('[data-test="link-a-visitor"]').text().trim()).toBe('Link another visitor')
          expect($('[data-test="link-a-visitor"]').attr('href')).toBe(`${paths.ADD_VISITOR.DETAILS}/uuidv4-1-1-1-1`)
          expect($('[data-test="book-a-visit"]').text().trim()).toBe('Book a visit')
          expect($('[data-test="book-a-visit"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('[data-test="visitor-approved"]').text()).toStrictEqual(
            'First Last will appear as a visitor when you book visits for John Smith.',
          )
        })
    })

    it('should redirect to prisoners page if add visitor request result not in session', () => {
      delete sessionData.addVisitorJourneyResult

      return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.PRISONERS)
    })

    it('should redirect to visitors page if add visitor request result not in session when FEATURE_MULTIPLE_PRISONERS is disabled', () => {
      disableFeatureForTest('multiplePrisoners')
      app = appWithAllRoutes({ sessionData })
      delete sessionData.addVisitorJourneyResult

      return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.VISITORS)
    })
  })

  it('should redirect to prisoners page if add visitor request result and no prisoner in session', () => {
    sessionData.booker = { reference: 'ref', prisoners: [] }
    delete sessionData.addVisitorJourneyResult

    return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.PRISONERS)
  })

  it('should redirect to visitors page if add visitor request result and no prisoner in session when FEATURE_MULTIPLE_PRISONERS is disabled', () => {
    disableFeatureForTest('multiplePrisoners')
    app = appWithAllRoutes({ sessionData })
    sessionData.booker = { reference: 'ref', prisoners: [] }
    delete sessionData.addVisitorJourneyResult

    return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.VISITORS)
  })
})
