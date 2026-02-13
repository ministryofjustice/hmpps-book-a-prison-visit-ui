import HomePage from '../pages/home'
import Page from '../pages/page'
import SignedOutPage from '../pages/staticPages/signedOut'
import paths from '../../server/constants/paths'
import { AuthoriseError, IdTokenError } from '../mockApis/govukOneLoginSimulator'

context('GOV.UK One Login', () => {
  const authErrorUrl = `${Cypress.config('baseUrl')}${paths.AUTH_ERROR}`
  const serviceSignInUrl = `${Cypress.config('baseUrl')}${paths.SIGN_IN}`
  const oneLoginAuthorizeUrl = 'http://localhost:9090/authorize'

  beforeEach(() => {
    cy.task('reset')

    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners')
  })

  describe('Sign in / sign out', () => {
    it('User can sign in and view home page', () => {
      cy.signIn()
      Page.verifyOnPage(HomePage)
    })

    it('User can request a specific page and be redirected to this after sign in', () => {
      const page = '/deep-link' // will be a 404, but OK as testing original URL preserved
      cy.signIn({ options: { failOnStatusCode: false }, initialRequestUrl: page })
      cy.location('pathname').should('equal', page)
      cy.contains('404')
    })

    it('User can sign out and be redirected to the signed out page', () => {
      cy.signIn()
      const homePage = Page.verifyOnPage(HomePage)

      homePage.signOut()

      // Being redirected to the signed out page confirms that
      // the 'post_logout_redirect_uri' configuration and idToken store is working
      const signedOutPage = Page.verifyOnPage(SignedOutPage)
      signedOutPage.signInLink().should('have.attr', 'href', paths.SIGN_IN)
    })
  })

  describe('Unauthenticated user access', () => {
    const redirectTestCases = [
      {
        description: 'home page',
        url: paths.HOME,
        expectedStatus: 302,
        expectedRedirect: serviceSignInUrl,
      },
      {
        description: '/sign-in URL',
        url: paths.SIGN_IN,
        expectedStatus: 302,
        expectedRedirect: oneLoginAuthorizeUrl,
      },
      {
        description: '/auth/callback URL',
        url: paths.AUTH_CALLBACK,
        expectedStatus: 302,
        expectedRedirect: oneLoginAuthorizeUrl,
      },
      {
        description: 'callback URL with unrecognised/expired parameters',
        url: `${paths.AUTH_CALLBACK}?code=INVALID_AUTHORIZATION_CODE&state=INVALID-STATE`,
        expectedStatus: 302,
        expectedRedirect: authErrorUrl,
      },
      {
        description: 'non-existent route',
        url: '/NON-EXISTENT-PAGE',
        expectedStatus: 302,
        expectedRedirect: serviceSignInUrl,
      },
    ]

    redirectTestCases.forEach(({ description, url, expectedStatus, expectedRedirect }) => {
      it(`Unauthenticated user accessing ${description} is redirected`, () => {
        cy.request({ url, followRedirect: false }).then(response => {
          expect(response.status).to.eq(expectedStatus)
          expect(response.redirectedToUrl.startsWith(expectedRedirect)).to.eq(true)
        })
      })
    })
  })

  describe('Validation errors - authorisation', () => {
    const authoriseErrorTestCases: AuthoriseError[] = ['ACCESS_DENIED', 'TEMPORARILY_UNAVAILABLE']

    authoriseErrorTestCases.forEach(error => {
      it(`User sent to auth error page if GOV.UK One Login returns authorisation error ${error}`, () => {
        cy.task('setAuthoriseError', error)

        cy.signIn({ options: { failOnStatusCode: false } })
        cy.get('h1').contains('Sorry, there is a problem with the service')
        cy.location('pathname').should('equal', paths.AUTH_ERROR)
      })
    })
  })

  describe('Validation errors - ID token', () => {
    const idTokenErrorTestCases: IdTokenError[] = [
      'INVALID_ISS',
      'INVALID_AUD',
      'INVALID_ALG_HEADER',
      'INVALID_SIGNATURE',
      'TOKEN_EXPIRED',
      'TOKEN_NOT_VALID_YET',
      'NONCE_NOT_MATCHING',
      'INCORRECT_VOT',
    ]

    idTokenErrorTestCases.forEach(error => {
      it(`User sent to auth error page if GOV.UK One Login returns ID token error ${error}`, () => {
        cy.task('setIdTokenError', error)

        cy.signIn({ options: { failOnStatusCode: false } })
        cy.get('h1').contains('Sorry, there is a problem with the service')
        cy.location('pathname').should('equal', paths.AUTH_ERROR)
      })
    })
  })

  describe('ID Token signing key rotation', () => {
    // 'oauth4webapi' (openid-client v6 dependency) will re-request keys as necessary from /.well-known/jwks.json,
    // but not more than once per minute. This test retries up to 6 times with a 10 second delays.
    // Most likely NO wait here as any previous tests will have 'used up' the key refresh delay since app startup.
    // See implementation https://github.com/panva/oauth4webapi/blob/0fc74562ed9d42604fcf9ce060ac2fddce146af5/src/index.ts#L3156-L3160
    it(
      'Sign in, sign out then rotate keys and sign in again',
      { retries: { openMode: 6, runMode: 6 }, screenshotOnRunFailure: false },
      () => {
        if (Cypress.currentRetry > 0) {
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(10000) // 10 seconds
        }

        // Sign in
        cy.signIn()
        const homePage = Page.verifyOnPage(HomePage)

        // Sign out
        homePage.signOut()
        Page.verifyOnPage(SignedOutPage)

        // Rotate keys
        cy.task('publishNewIdTokenSigningKeys')
        cy.task('useNewIdTokenSigningKeys')

        // Sign in again successfully with new keys
        cy.signIn()
        Page.verifyOnPage(HomePage)
      },
    )
  })
})
