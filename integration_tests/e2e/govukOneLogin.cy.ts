import HomePage from '../pages/home'
import Page from '../pages/page'
import SignedOutPage from '../pages/staticPages/signedOut'
import paths from '../../server/constants/paths'

context('GOV.UK One Login', () => {
  const serviceSignInUrl = new RegExp(`${Cypress.config('baseUrl')}${paths.SIGN_IN}`)
  const oneLoginAuthorizeUrl = /^http:\/\/localhost:9090\/authorize/

  beforeEach(() => {
    cy.task('reset')
  })

  describe('Sign in / sign out', () => {
    it('User can sign in and view home page', () => {
      cy.task('stubHmppsAuthToken')
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners')
      cy.signIn()

      Page.verifyOnPage(HomePage)
    })

    it('User can request a specific page and be redirected to this after sign in', () => {
      const page = '/deep-link' // will be a 404, but OK as testing original URL preserved
      cy.task('stubHmppsAuthToken')
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners')
      cy.signIn({ options: { failOnStatusCode: false }, initialRequestUrl: page })
      cy.location('pathname').should('equal', page)
      cy.contains('404')
    })

    it('User can log out', () => {
      cy.task('stubHmppsAuthToken')
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners')

      cy.signIn()
      const homePage = Page.verifyOnPage(HomePage)

      homePage.signOut()

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
        expectedRedirect: serviceSignInUrl,
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
          expect(response.redirectedToUrl).to.match(expectedRedirect)
        })
      })
    })
  })

  describe('Validation errors', () => {
    // FIXME use simulator's error config options
    it.skip('User sent to auth error page if sign in fails', () => {
      cy.signIn({ options: { failOnStatusCode: false } })
      cy.get('h1').contains('Sorry, there is a problem with the service')
    })
  })
})
