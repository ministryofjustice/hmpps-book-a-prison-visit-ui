Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }, nonce = undefined, initialRequestUrl = '/') => {
  cy.request(initialRequestUrl)
  return cy.task('getSignInUrl', nonce).then((url: string) => {
    cy.visit(url, options)
    return cy.task('verifyJwtAssertionForToken')
  })
})
