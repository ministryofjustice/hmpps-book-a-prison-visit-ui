import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { randomUUID } from 'crypto'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'
import { disableFeatureForTest, enableFeatureForTest } from '../../../data/testutils/mockFeatureFlags'
import TestData from '../../testutils/testData'

let app: Express
let sessionData: SessionData
const uuid = randomUUID()
const prisoner = TestData.prisoner({ prisonerDisplayId: uuid })

beforeEach(() => {
  enableFeatureForTest('multiplePrisoners')
  sessionData = {
    booker: {
      prisoners: [prisoner],
    },
  } as SessionData
  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a visitor request - Visitor request cancelled', () => {
  describe('GET - Display Visitor request cancelled page', () => {
    it('should render the confirmation page', () => {
      return request(app)
        .get(`${paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION}/${uuid}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor link request cancelled -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(undefined)
          expect($('h1').text()).toContain('Visitor link request cancelled')
          expect($('[data-test=link-a-visitor]').attr('href')).toBe(`${paths.ADD_VISITOR.START}/${uuid}`)
        })
    })

    it('should not show the link new visitor button when prisoner display ID is invalid', () => {
      return request(app)
        .get(`${paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION}/uuidv4-1-1-1-1`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=link-a-visitor]').length).toBe(0)
        })
    })

    it('should have original add visitor link when FEATURE_MULTIPLE_PRISONERS is disabled', () => {
      disableFeatureForTest('multiplePrisoners')
      app = appWithAllRoutes({})

      return request(app)
        .get(paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=link-a-visitor]').attr('href')).toBe(paths.ADD_VISITOR.START)
        })
    })
  })
})
