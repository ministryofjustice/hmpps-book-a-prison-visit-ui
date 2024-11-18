Cypress.Commands.add(
  'signIn',
  ({
    options = { failOnStatusCode: true },
    nonce = undefined,
    initialRequestUrl = '/',
    hideCookieBanner = true,
  } = {}) => {
    if (hideCookieBanner) {
      cy.hideCookieBanner()
    }
    cy.request(initialRequestUrl)
    return cy.task('getSignInUrl', nonce).then((url: string) => {
      cy.visit(url, options)
      return cy.task('verifyJwtAssertionForToken')
    })
  },
)

Cypress.Commands.add('hideCookieBanner', () =>
  cy.setCookie('cookie_policy', encodeURIComponent(JSON.stringify({ acceptAnalytics: 'no' }))),
)
