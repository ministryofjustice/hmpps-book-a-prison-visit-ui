import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import { disableFeatureForTest, enableFeatureForTest } from '../data/testutils/mockFeatureFlags'

let app: Express
const url = '/some-page?foo=bar' // actually a 404 but doesn't matter; language toggle is on all pages

beforeEach(() => {
  enableFeatureForTest('welshLanguageEnabled')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Language toggle', () => {
  describe('Welsh language feature flag', () => {
    it('should not show language toggle if Welsh language feature not enabled', () => {
      disableFeatureForTest('welshLanguageEnabled')
      app = appWithAllRoutes({})

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.visits-language-toggle').length).toBe(0)
        })
    })

    it('should show language toggle if Welsh language feature is enabled', () => {
      app = appWithAllRoutes({})
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.visits-language-toggle').length).toBe(1)
        })
    })
  })

  it('should show language toggle with language set to English (the default)', () => {
    app = appWithAllRoutes({})
    return request(app)
      .get(url)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/Visit someone in prison/)

        expect($('.visits-language-toggle li[aria-current="true"]').text().trim()).toBe('English')
        expect($('.visits-language-toggle a').text().trim()).toBe('Cymraeg')
        expect($('.visits-language-toggle a').attr('href')).toBe('/some-page?foo=bar&lng=cy')
      })
  })
})
