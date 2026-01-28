import Page, { PageElement } from '../page'

export default class CookiesPage extends Page {
  constructor() {
    super('Cookies')
  }

  getAnalyticsCookieName = (): PageElement => cy.get('[data-test="matomo-id-cookie-name"]')

  acceptAnalyticsRadio = (): PageElement => cy.get('input[name=acceptAnalytics][value=yes]')

  rejectAnalyticsRadio = (): PageElement => cy.get('input[name=acceptAnalytics][value=no]')

  saveCookieSettings = (): void => {
    cy.get('[data-test="save-cookie-settings"]').click()
  }
}
