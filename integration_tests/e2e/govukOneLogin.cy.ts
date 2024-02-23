import IndexPage from '../pages/index'
import GovukOneLoginPage from '../pages/govukOneLogin'
import Page from '../pages/page'

context('Sign in with GOV.UK One Login', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
  })

  it('Unauthenticated user redirected to GOV.UK One Login - home page', () => {
    cy.visit('/')
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - sign-in URL', () => {
    cy.visit('/auth/sign-in')
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - callback URL', () => {
    cy.visit('/auth/callback')
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - non-existant route', () => {
    cy.visit('/NON-EXISTANT-PAGE')
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('User can sign in and view home page', () => {
    cy.signIn()

    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.prisonerName().contains('Adam Greene')
  })

  it('User sent to auth error page if sign in fails', () => {
    // setting an invalid nonce value should cause ID token validation to fail
    cy.signIn({ failOnStatusCode: false, nonce: 'INVALID_NONCE' })
    cy.get('h1').contains('Authorisation Error')
  })

  // Skipping test as can't target sign out button without changing template
  it.skip('User can log out', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut().click()
    Page.verifyOnPage(GovukOneLoginPage)
    cy.contains('You have been logged out.')
  })
})
