import * as cheerio from 'cheerio'
import express from 'express'
import nunjucksSetup from '../utils/nunjucksSetup'
import { ApplicationInfo } from '../applicationInfo'

describe('Authorisation error page', () => {
  const app = express()
  nunjucksSetup(app, {} as ApplicationInfo)

  it('should render a default GOVUK Header on the authorisation error page', () => {
    app.render('authError', (err: Error, html: string) => {
      const $ = cheerio.load(html)
      expect($('head title').text()).toMatch(/^Sorry, there is a problem with the service -/)

      expect($('header.govuk-header').length).toBe(1)
      expect($('header .one-login-header').length).toBe(0)
      expect($('.govuk-service-navigation__service-name').text().trim()).toBe('Visit someone in prison')
      expect($('h1').text().trim()).toBe('Sorry, there is a problem with the service')
    })
  })
})
