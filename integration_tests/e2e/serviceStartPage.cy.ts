import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import GovukOneLoginPage from '../pages/govukOneLogin'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ServiceStartPage from '../pages/serviceStart'

context('Service start page', () => {
  beforeEach(() => {
    cy.task('reset')
  })

  describe('Unauthenticated user', () => {
    it('should be able to visit start page and proceed to GOVUK One Login', () => {
      cy.hideCookieBanner()

      // Go to service start page
      cy.visit(paths.START)
      const serviceStartPage = Page.verifyOnPage(ServiceStartPage)
      serviceStartPage.oneLoginHeader().should('not.exist')

      // Click Start now button and be redirected to GOVUK One Login
      cy.task('stubSignIn')
      serviceStartPage.startNow()
      Page.verifyOnPage(GovukOneLoginPage)
    })
  })

  describe('Authenticated user (with registered prisoner)', () => {
    it('should be redirected to home page if attempting to view the start page', () => {
      cy.task('stubSignIn')
      cy.task('stubHmppsAuthToken')

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
      cy.signIn()

      // Logged in (on Home page)
      Page.verifyOnPage(HomePage)

      // Go to service start page
      cy.visit(paths.START)

      // Redirected back to Home page
      Page.verifyOnPage(HomePage)
    })
  })
})
