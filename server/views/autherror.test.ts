import * as cheerio from 'cheerio'
import express from 'express'
import nunjucksSetup from '../utils/nunjucksSetup'

describe('Authorisation error page', () => {
  const app = express()
  nunjucksSetup(app, null)

  it('should render a default GOVUK Header on the authorisation error page', () => {
    app.render('autherror', (err: Error, html: string) => {
      const $ = cheerio.load(html)

      expect($('header.govuk-header').length).toBe(1)
      expect($('header .one-login-header').length).toBe(0)
      expect($('.govuk-header__content').text().trim()).toBe('Visit someone in prison')
      expect($('h1').text().trim()).toBe('Authorisation Error')
    })
  })
})
