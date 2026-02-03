import paths from '../../server/constants/paths'

Cypress.Commands.add(
  'signIn',
  ({ options = { failOnStatusCode: true }, initialRequestUrl = paths.HOME, hideCookieBanner = true } = {}) => {
    cy.clearAllCookies()
    if (hideCookieBanner) {
      cy.hideCookieBanner()
    }
    cy.visit(initialRequestUrl, options)
  },
)

Cypress.Commands.add('hideCookieBanner', () =>
  cy.setCookie('cookie_policy', encodeURIComponent(JSON.stringify({ acceptAnalytics: 'no' }))),
)
