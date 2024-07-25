import TestData from '../../server/routes/testutils/testData'
import CookiesPage from '../pages/cookiesPage'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Cookie consent and analytics', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })

    cy.signIn()
  })

  describe('Cookie banner', () => {
    it('should show cookie banner, set cookie when analytics accepted and load analytics', () => {
      // Home page - analytics script should not be present initially
      const homePage = Page.verifyOnPage(HomePage)
      homePage.googleAnalytics().should('not.exist')

      // Cookie banner - accept analytics
      homePage.acceptAnalytics()
      cy.contains('accepted analytics cookies')
      homePage.hideAnalyticsAcceptedMessage()
      homePage.cookieBanner().should('not.be.visible')
      checkCookie({ acceptAnalytics: 'yes' })

      // go to Cookies page - should be no banner and analytics should load
      homePage.goToFooterLinkByName('Cookies')
      const cookiesPage = Page.verifyOnPage(CookiesPage)
      cookiesPage.googleAnalytics().should('exist')
      cookiesPage.cookieBanner().should('not.exist')
      cookiesPage.acceptAnalyticsRadio().should('be.checked')
    })

    it('should show cookie banner, set cookie when analytics rejected and not load analytics', () => {
      // Home page - analytics script should not be present initially
      const homePage = Page.verifyOnPage(HomePage)
      homePage.googleAnalytics().should('not.exist')

      // Cookie banner - reject analytics
      homePage.rejectAnalytics()
      cy.contains('rejected analytics cookies')
      homePage.hideAnalyticsRejectedMessage()
      homePage.cookieBanner().should('not.be.visible')
      checkCookie({ acceptAnalytics: 'no' })

      // go to Cookies page - should be no banner and analytics should not load
      homePage.goToFooterLinkByName('Cookies')
      const cookiesPage = Page.verifyOnPage(CookiesPage)
      cookiesPage.googleAnalytics().should('not.exist')
      cookiesPage.cookieBanner().should('not.exist')
      cookiesPage.rejectAnalyticsRadio().should('be.checked')
    })
  })
})

function checkCookie({ acceptAnalytics }) {
  cy.getCookie('cookie_policy').then(cookie => {
    cy.wrap(cookie).should('have.a.property', 'path', '/')
    cy.wrap(cookie).should('have.a.property', 'value', JSON.stringify({ acceptAnalytics }))

    const expectedExpiry = new Date()
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 1)

    const actualCookieExpiryDate = new Date(cookie.expiry * 1000).toDateString()

    cy.wrap(actualCookieExpiryDate).should('equal', expectedExpiry.toDateString())
  })
}
