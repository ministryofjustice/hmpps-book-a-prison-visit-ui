import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express
const url = '/some-page?foo=bar' // actually a 404 but doesn't matter; language toggle is on all pages

afterEach(() => {
  jest.resetAllMocks()
})

describe('Language toggle', () => {
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

  it('should show language toggle with language set to Welsh', () => {
    app = appWithAllRoutes({ lng: 'cy' })
    return request(app)
      .get(url)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/Ymweld â rhywun yn y carchar/)

        expect($('.visits-language-toggle li[aria-current="true"]').text().trim()).toBe('Cymraeg')
        expect($('.visits-language-toggle a').text().trim()).toBe('English')
        expect($('.visits-language-toggle a').attr('href')).toBe('/some-page?foo=bar&lng=en')
      })
  })

  it('should show language toggle when rendering from a POST request (e.g. a server error)', () => {
    app = appWithAllRoutes({})
    return request(app)
      .post(url)
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
