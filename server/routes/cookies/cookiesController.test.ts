import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, FlashData, flashProvider } from '../testutils/appSetup'
import paths from '../../constants/paths'
import config from '../../config'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe.skip('Cookies page', () => {
  describe(`GET ${paths.COOKIES}`, () => {
    it('should render cookies page with banner, no analytics and radios unchecked when no consent cookie', () => {
      app = appWithAllRoutes({})

      return request(app)
        .get(paths.COOKIES)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cookies -/)
          expect($('[data-test="back-link"]').length).toBe(0)
          expect($('h1').text()).toBe('Cookies')

          expect($('script[data-test=matomo-analytics]').length).toBe(0)
          expect($('script[data-test=matomo-tag-manager]').length).toBe(0)
          expect($('#cookie-banner').length).toBe(1)
          expect($('[data-test=matomo-id-cookie-name]').text()).toContain('_pk_id')
          expect($('[data-test=matomo-session-cookie-name]').text()).toContain('_pk_ses')
          expect($('input[name=acceptAnalytics]:checked').length).toBe(0)
        })
    })

    it('should render cookies page with no banner, no analytics script and radio checked when consent cookie set to NO', () => {
      app = appWithAllRoutes({
        cookies: {
          cookie_policy: JSON.stringify({ acceptAnalytics: 'no' }),
        },
      })

      return request(app)
        .get(paths.COOKIES)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cookies -/)
          expect($('h1').text()).toBe('Cookies')

          expect($('script[data-test=matomo-analytics]').length).toBe(0)
          expect($('script[data-test=matomo-tag-manager]').length).toBe(0)
          expect($('#cookie-banner').length).toBe(0)
          expect($('[data-test=matomo-id-cookie-name]').text()).toContain('_pk_id')
          expect($('[data-test=matomo-session-cookie-name]').text()).toContain('_pk_ses')
          expect($('input[name=acceptAnalytics][value=no]').prop('checked')).toBe(true)
        })
    })

    it('should render cookies page with no banner, load analytics script and radio checked when consent cookie set to YES', () => {
      app = appWithAllRoutes({
        cookies: {
          cookie_policy: JSON.stringify({ acceptAnalytics: 'yes' }),
        },
      })

      return request(app)
        .get(paths.COOKIES)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cookies -/)
          expect($('h1').text()).toBe('Cookies')

          expect($('script[data-test=matomo-analytics]').length).toBe(1)
          expect($('script[data-test=matomo-tag-manager]').length).toBe(1)
          expect($('#cookie-banner').length).toBe(0)
          expect($('[data-test=matomo-id-cookie-name]').text()).toContain('_pk_id')
          expect($('[data-test=matomo-session-cookie-name]').text()).toContain('_pk_ses')
          expect($('input[name=acceptAnalytics][value=yes]').prop('checked')).toBe(true)
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'acceptAnalytics',
        value: [],
        msg: 'No answer selected',
      }
      const flashData: FlashData = { errors: [validationError] }
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

      app = appWithAllRoutes({})

      return request(app)
        .get(paths.COOKIES)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Error: Cookies -/)
          expect($('h1').text()).toBe('Cookies')

          expect($('.govuk-error-summary a[href="#acceptAnalytics"]').text()).toBe('No answer selected')
          expect($('#acceptAnalytics-error').text()).toContain('No answer selected')
        })
    })
  })

  describe(`POST ${paths.COOKIES}`, () => {
    const fakeDate = new Date('2024-07-24T16:30:15.000Z')
    const expectedCookieExpiry = 'Thu, 24 Jul 2025 16:30:15 GMT' // expiry in 1 year

    const analyticsYesValue = encodeURIComponent(JSON.stringify({ acceptAnalytics: 'yes' }))
    const analyticsNoValue = encodeURIComponent(JSON.stringify({ acceptAnalytics: 'no' }))

    const clearGACookie = '_ga=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    const clearGAIDCookie = '_ga_SSLMWLQYHQ=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'

    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDate) })
      app = appWithAllRoutes({})
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should set cookie with correct parameters when analytics accepted', () => {
      return request(app)
        .post(paths.COOKIES)
        .send({ acceptAnalytics: 'yes' })
        .expect(302)
        .expect('Location', paths.COOKIES)
        .expect('Set-Cookie', `cookie_policy=${analyticsYesValue}; Path=/; Expires=${expectedCookieExpiry}`)
    })

    it('should set cookie with correct parameters when analytics rejected and clear existing analytics cookies (localhost)', () => {
      const acceptAnalyticsNoCookie = `cookie_policy=${analyticsNoValue}; Path=/; Expires=${expectedCookieExpiry}`
      const acceptAnalyticsCheck = new RegExp(acceptAnalyticsNoCookie)

      return request(app)
        .post(paths.COOKIES)
        .send({ acceptAnalytics: 'no' })
        .expect(302)
        .expect('Location', paths.COOKIES)
        .expect('Set-Cookie', acceptAnalyticsCheck)
    })

    it('should set cookie with correct parameters when analytics rejected and clear existing analytics cookies (justice domain)', () => {
      const replacedProp = jest.replaceProperty(config, 'domain', 'https://visit-dev.prison.service.justice.gov.uk')

      const acceptAnalyticsNoCookie = `cookie_policy=${analyticsNoValue}; Path=/; Expires=${expectedCookieExpiry}`

      return request(app)
        .post(paths.COOKIES)
        .send({ acceptAnalytics: 'no' })
        .expect(302)
        .expect('Location', paths.COOKIES)
        .expect('Set-Cookie', `${acceptAnalyticsNoCookie},${clearGACookie},${clearGAIDCookie}`)
        .expect(() => {
          replacedProp.replaceValue('domain')
        })
    })

    describe('Validation errors', () => {
      it('should set validation error and not set cookie when no choice made', () => {
        const expectedFlashErrors: FieldValidationError[] = [
          { type: 'field', location: 'body', path: 'acceptAnalytics', value: undefined, msg: 'No answer selected' },
        ]

        return request(app)
          .post(paths.COOKIES)
          .expect(302)
          .expect('Location', paths.COOKIES)
          .expect(res => {
            expect(res.headers).not.toHaveProperty('set-cookie')
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
          })
      })

      it('should set validation error and not set cookie when invalid choice made', () => {
        const expectedFlashErrors: FieldValidationError[] = [
          { type: 'field', location: 'body', path: 'acceptAnalytics', value: 'INVALID', msg: 'No answer selected' },
        ]

        return request(app)
          .post(paths.COOKIES)
          .send({ acceptAnalytics: 'INVALID' })
          .expect(302)
          .expect('Location', paths.COOKIES)
          .expect(res => {
            expect(res.headers).not.toHaveProperty('set-cookie')
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
          })
      })
    })
  })
})
