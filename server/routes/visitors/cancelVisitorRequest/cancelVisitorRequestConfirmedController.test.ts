import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a visitor request - Visitor request cancelled', () => {
  describe('GET - Display Visitor request cancelled page', () => {
    it('should render the confirmation page', () => {
      return request(app)
        .get(paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor link request cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Visitor link request cancelled')
          expect($('[data-test=link-a-visitor]').attr('href')).toBe(paths.ADD_VISITOR.START)
        })
    })
  })
})
