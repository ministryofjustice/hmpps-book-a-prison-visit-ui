import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { randomUUID } from 'crypto'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../../testutils/appSetup'
import paths from '../../../constants/paths'
import { enableFeatureForTest } from '../../../data/testutils/mockFeatureFlags'
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

    it('should redirect to prisoners page when prisoner display ID is invalid', () => {
      return request(app)
        .get(`${paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION}/6f97370f-1812-4ba8-a3f6-65ef3fca6471`)
        .expect(302)
        .expect('location', paths.PRISONERS)
    })
  })
})
