import HomePage from '../pages/home'
import Page from '../pages/page'
import SignedOutPage from '../pages/staticPages/signedOut'
import paths from '../../server/constants/paths'

context('GOV.UK One Login', () => {
  const serviceSignInUrl = `${Cypress.config('baseUrl')}${paths.SIGN_IN}`
  const oneLoginAuthorizeUrl = /^http:\/\/localhost:9090\/authorize/

  beforeEach(() => {
    cy.task('reset')
  })

  it('Unauthenticated user redirected to /sign-in when accessing home page', () => {
    cy.request({ url: paths.HOME, followRedirect: false }).then(response => {
      expect(response.status).to.eq(302)
      expect(response.redirectedToUrl).to.eq(serviceSignInUrl)
    })
  })

  it('Unauthenticated user redirected to GOV.UK One Login /authorize when accessing /sign-in URL', () => {
    cy.request({ url: paths.SIGN_IN, followRedirect: false }).then(response => {
      expect(response.status).to.eq(302)
      expect(response.redirectedToUrl).to.match(oneLoginAuthorizeUrl)
    })
  })

  it('Unauthenticated user redirected to GOV.UK One Login /authorize when accessing /auth/callback URL', () => {
    cy.request({ url: paths.AUTH_CALLBACK, followRedirect: false }).then(response => {
      expect(response.status).to.eq(302)
      expect(response.redirectedToUrl).to.match(oneLoginAuthorizeUrl)
    })
  })

  it('Unauthenticated user redirected to GOV.UK One Login - callback URL with unrecognised/expired parameters', () => {
    cy.request({
      url: `${paths.AUTH_CALLBACK}?code=INVALID_AUTHORIZATION_CODE&state=INVALID-STATE`,
      followRedirect: false,
    }).then(response => {
      expect(response.status).to.eq(302)
      expect(response.redirectedToUrl).to.eq(serviceSignInUrl)
    })
  })

  it('Unauthenticated user redirected to GOV.UK One Login - non-existent route', () => {
    cy.request({ url: '/NON-EXISTENT-PAGE', followRedirect: false }).then(response => {
      expect(response.status).to.eq(302)
      expect(response.redirectedToUrl).to.eq(serviceSignInUrl)
    })
  })

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

  // FIXME use simulator's error config options
  it.skip('User sent to auth error page if sign in fails', () => {
    cy.signIn({ options: { failOnStatusCode: false } })
    cy.get('h1').contains('Sorry, there is a problem with the service')
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
