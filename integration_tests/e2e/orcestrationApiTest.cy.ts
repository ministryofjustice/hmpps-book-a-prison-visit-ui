context('Test API call page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.signIn()
  })

  it('Test call to Orchestration service', () => {
    cy.task('stubHmppsAuthToken')
    cy.task('stubSupportedPrisonIds')
    cy.visit('/prisons')
    cy.contains('list of supported prison IDs')
    cy.contains('HEI')
    cy.contains('BLI')
  })
})
