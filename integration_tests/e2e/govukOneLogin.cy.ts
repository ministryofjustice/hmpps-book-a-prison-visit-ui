import HomePage from '../pages/home'
import GovukOneLoginPage from '../pages/govukOneLogin'
import Page from '../pages/page'
import SignedOutPage from '../pages/signedOut'
import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'

context('Sign in with GOV.UK One Login', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
  })

  it('Unauthenticated user redirected to GOV.UK One Login - home page', () => {
    cy.visit(paths.HOME)
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - sign-in URL', () => {
    cy.visit(paths.SIGN_IN)
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - callback URL', () => {
    cy.visit(paths.AUTH_CALLBACK)
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - callback URL with unrecognised/expired parameters', () => {
    cy.visit(`${paths.AUTH_CALLBACK}?code=INVALID_AUTHORIZATION_CODE&state=INVALID-STATE`)
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('Unauthenticated user redirected to GOV.UK One Login - non-existant route', () => {
    cy.visit('/NON-EXISTANT-PAGE')
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('User can sign in and view home page', () => {
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.signIn()

    Page.verifyOnPage(HomePage)
  })

  it('User can request a specific page and be redirected to this after sign in', () => {
    const page = '/deep-link' // will be a 404, but OK as testing original URL preserved
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.signIn({ options: { failOnStatusCode: false }, initialRequestUrl: page })
    cy.location('pathname').should('equal', page)
    cy.contains('404')
  })

  it('User sent to auth error page if sign in fails', () => {
    // setting an invalid nonce value should cause ID token validation to fail
    cy.signIn({ options: { failOnStatusCode: false }, nonce: 'INVALID_NONCE' })
    cy.get('h1').contains('Sorry, there is a problem with the service')
  })

  it('User can log out', () => {
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)

    cy.task('stubSignOut')
    homePage.signOut()
    const signedOutPage = Page.verifyOnPage(SignedOutPage)
    signedOutPage.signInLink().should('have.attr', 'href', paths.SIGN_IN)
  })
})
