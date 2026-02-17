import logAccessibilityViolations from '../support/logAccessibilityViolations'

export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new (title?: string) => T, title?: string): T {
    return new constructor(title)
  }

  constructor(
    private readonly title: string,
    private readonly options: { axeTest?: boolean } = {
      axeTest: true,
    },
  ) {
    this.checkOnPage()

    if (options.axeTest) {
      this.runAxe()
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  runAxe = (): void => {
    cy.injectAxe()

    cy.configureAxe({
      rules: [
        // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
        { id: 'region', selector: '*:not(.govuk-skip-link)' },

        // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
        { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },
      ],
    })

    cy.checkA11y(
      undefined,
      undefined,
      logAccessibilityViolations,
      false, // skipFailures
    )
  }

  googleAnalytics = (): PageElement => cy.get('[data-test=google-analytics]')

  cookieBanner = (): PageElement => cy.get('#cookie-banner')

  acceptAnalytics = (): void => {
    cy.get('[data-test=accept-analytics]').click()
  }

  rejectAnalytics = (): void => {
    cy.get('[data-test=reject-analytics]').click()
  }

  hideAnalyticsAcceptedMessage = (): void => {
    cy.get('[data-test=hide-cookies-accepted]').click()
  }

  hideAnalyticsRejectedMessage = (): void => {
    cy.get('[data-test=hide-cookies-rejected]').click()
  }

  oneLoginHeader = (): PageElement => cy.get('.rebranded-one-login-header')

  signOut = (): PageElement => cy.get('.rebranded-one-login-header').contains('a', 'Sign out').click()

  goToServiceHeaderLinkByName = (name: string): PageElement =>
    cy.get('.govuk-service-navigation').contains('a', name).click()

  backLink = (): PageElement => cy.get('[data-test="back-link"]')

  getMessages = (index: number): PageElement => cy.get('.moj-alert').eq(index)

  goToFooterLinkByName = (name: string): PageElement => cy.get('.govuk-footer__link').contains('a', name).click()

  protected clickDisabledOnSubmitButton = (dataTestName: string): void => {
    cy.get(`[data-test=${dataTestName}]`).within(bookButton => {
      // set a one-off event listener for window unload to check
      // a submit button is disabled after it is clicked
      cy.once('window:before:unload', () => {
        expect(bookButton.attr('disabled')).to.eq('disabled')
      })
      cy.wrap(bookButton).click()
    })
  }
}
