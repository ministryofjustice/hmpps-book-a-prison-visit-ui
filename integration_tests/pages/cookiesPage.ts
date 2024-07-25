import Page, { PageElement } from './page'

export default class CookiesPage extends Page {
  constructor() {
    super('Cookies')
  }

  acceptAnalyticsRadio = (): PageElement => cy.get('input[name=acceptAnalytics][value=yes]')

  rejectAnalyticsRadio = (): PageElement => cy.get('input[name=acceptAnalytics][value=no]')
}
