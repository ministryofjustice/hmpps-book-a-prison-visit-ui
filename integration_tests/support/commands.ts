Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl', options.nonce).then((url: string) => cy.visit(url, options))
})
