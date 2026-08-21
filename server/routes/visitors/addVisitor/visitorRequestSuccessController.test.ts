import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'

let app: Express
let sessionData: SessionData

beforeEach(() => {
  sessionData = {
    addVisitorJourneyResult: {
      firstName: 'First',
      lastName: 'Last',
      result: 'REQUESTED',
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
          expect($('[data-test="link-a-visitor"]').attr('href')).toBe(paths.ADD_VISITOR.DETAILS)
          expect($('[data-test="book-a-visit"]').text().trim()).toBe('Book a visit')
          expect($('[data-test="book-a-visit"]').attr('href')).toBe(paths.VISITS.HOME)
          expect($('[data-test="visitor-approved"]').text()).toStrictEqual(
            'First Last will appear as a visitor when you book visits for John Smith.',
          )
        })
    })

    it('should redirect to visitors page if add visitor request result not in session', () => {
      delete sessionData.addVisitorJourneyResult

      return request(app).get(paths.ADD_VISITOR.SUCCESS).expect(302).expect('location', paths.VISITORS)
    })
  })
})
