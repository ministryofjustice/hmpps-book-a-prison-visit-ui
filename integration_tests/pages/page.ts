import axe from 'axe-core'
import logAccessibilityViolations from '../support/logAccessibilityViolations'

export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(
    private readonly title: string,
    private readonly options: { axeTest?: boolean; axeRulesToIgnore?: string[] } = {
      axeTest: true,
    },
  ) {
    this.checkOnPage()

    if (options.axeTest || options.axeRulesToIgnore?.length) {
      this.runAxe(options.axeRulesToIgnore)
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  runAxe = (axeRulesToIgnore: string[] = []): void => {
    axeRulesToIgnore.push('region') // FIXME ignoring this rule as suspected false positives since adding cookie banner

    // If passed, build set of axe rules to ignore for a particular page class
    const rules: axe.RuleObject = axeRulesToIgnore.reduce((acc, cur) => {
      acc[cur] = { enabled: false }
      return acc
    }, {})

    cy.injectAxe()
    cy.checkA11y(
      null,
      { rules },
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

  oneLoginHeader = (): PageElement => cy.get('.one-login-header')

  signOut = (): PageElement => cy.get('.one-login-header').contains('a', 'Sign out').click()

  goToServiceHeaderLinkByName = (name: string): PageElement => cy.get('.service-header').contains('a', name).click()

  backLink = (): PageElement => cy.get('[data-test="back-link"]')

  goToFooterLinkByName = (name: string): PageElement => cy.get('.govuk-footer__link').contains('a', name).click()

  protected clickDisabledOnSubmitButton = (dataTestName: string): void => {
    cy.get(`[data-test=${dataTestName}]`).within(bookButton => {
      // set a one-off event listener for window unload to check
      // submit booking button is disabled after it is clicked
      cy.once('window:before:unload', () => {
        expect(bookButton.attr('disabled')).to.eq('disabled')
      })
      cy.wrap(bookButton).click()
    })
  }
}
