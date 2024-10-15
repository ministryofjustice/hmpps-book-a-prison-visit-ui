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

    it('should remove previously set analytics cookies when rejecting (via cookies page form)', () => {
      // Home page - accept analytics via banner
      const homePage = Page.verifyOnPage(HomePage)
      homePage.acceptAnalytics()
      homePage.hideAnalyticsAcceptedMessage()
      checkCookie({ acceptAnalytics: 'yes' })

      // go to Cookies page - analytics cookies should be present
      homePage.goToFooterLinkByName('Cookies')
      const cookiesPage = Page.verifyOnPage(CookiesPage)
      cookiesPage.cookieBanner().should('not.exist')
      cy.getCookie('_ga').should('exist')
      cookiesPage.getAnalyticsCookieName().then(cookie => cy.getCookie(cookie.text()).should('exist'))

      // reject analytics via cookies page form
      cookiesPage.rejectAnalyticsRadio().check()
      cookiesPage.saveCookieSettings()

      // cookie preference should be set and analytics cookies removed
      cookiesPage.checkOnPage()
      checkCookie({ acceptAnalytics: 'no' })
      cy.getCookie('_ga').should('not.exist')
      cookiesPage.getAnalyticsCookieName().then(cookie => cy.getCookie(cookie.text()).should('not.exist'))
    })

    it('should remove previously set analytics cookies when rejecting (via cookie banner)', () => {
      // Home page
      const homePage = Page.verifyOnPage(HomePage)
      homePage.cookieBanner().should('be.visible')

      // Go to Cookies page and accept analytics - _ga cookies set
      homePage.goToFooterLinkByName('Cookies')
      const cookiesPage = Page.verifyOnPage(CookiesPage)
      cookiesPage.acceptAnalyticsRadio().check()
      cookiesPage.saveCookieSettings()
      cookiesPage.cookieBanner().should('not.exist')
      checkCookie({ acceptAnalytics: 'yes' })
      cy.getCookie('_ga').should('exist')
      cookiesPage.getAnalyticsCookieName().then(cookie => cy.getCookie(cookie.text()).should('exist'))

      // Remove 'cookie_policy' cookie (to trigger banner) and go to home page
      cy.clearCookie('cookie_policy')
      cookiesPage.goToServiceHeaderLinkByName('Home')
      homePage.checkOnPage()
      homePage.cookieBanner().should('be.visible')
      homePage.googleAnalytics().should('not.exist')

      // Reject cookies via banner
      homePage.rejectAnalytics()
      homePage.hideAnalyticsRejectedMessage()
      checkCookie({ acceptAnalytics: 'no' })

      // Go to cookies page - _ga cookies should not be set
      homePage.goToFooterLinkByName('Cookies')
      cookiesPage.checkOnPage()
      cookiesPage.rejectAnalyticsRadio().should('be.checked')
      cy.getCookie('_ga').should('not.exist')
      cookiesPage.getAnalyticsCookieName().then(cookie => cy.getCookie(cookie.text()).should('not.exist'))
    })
  })
})

function checkCookie({ acceptAnalytics }) {
  cy.getCookie('cookie_policy').then(cookie => {
    cy.wrap(cookie).should('have.a.property', 'path', '/')
    cy.wrap(cookie).should('have.a.property', 'value', encodeURIComponent(JSON.stringify({ acceptAnalytics })))

    const expectedExpiry = new Date()
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 1)

    const actualCookieExpiryDate = new Date(cookie.expiry * 1000).toDateString()

    cy.wrap(actualCookieExpiryDate).should('equal', expectedExpiry.toDateString())
  })
}
