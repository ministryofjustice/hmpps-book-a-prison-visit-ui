import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import AccessibilityStatementPage from '../pages/staticPages/accessibilityStatement'
import HomePage from '../pages/home'
import Page from '../pages/page'
import PrivacyNoticePage from '../pages/staticPages/privacyNotice'
import TermsAndConditionsPage from '../pages/staticPages/termsAndConditions'

context('Static content pages', () => {
  describe('Unauthenticated user', () => {
    it('should be able to access static content pages', () => {
      cy.hideCookieBanner()

      cy.visit(paths.ACCESSIBILITY)
      const accessibilityStatementPage = Page.verifyOnPage(AccessibilityStatementPage)
      accessibilityStatementPage.oneLoginHeader().should('not.exist')

      cy.visit(paths.PRIVACY)
      const privacyNoticePage = Page.verifyOnPage(PrivacyNoticePage)
      privacyNoticePage.oneLoginHeader().should('not.exist')

      cy.visit(paths.TERMS)
      const termsAndConditionsPage = Page.verifyOnPage(TermsAndConditionsPage)
      termsAndConditionsPage.oneLoginHeader().should('not.exist')
    })
  })

  describe('Authenticated user', () => {
    it('should be able to navigate to static content pages from home page using footer links', () => {
      cy.task('reset')
      cy.task('stubSignIn')
      cy.task('stubHmppsAuthToken')

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
      cy.signIn()

      // Home page
      const homePage = Page.verifyOnPage(HomePage)

      // should have the GOVUK One Login header
      homePage.oneLoginHeader().contains('GOV.UK One Login')

      // Select 'Accessibility' in footer
      homePage.goToFooterLinkByName('Accessibility')
      Page.verifyOnPage(AccessibilityStatementPage)

      // Select 'Privacy' in footer
      homePage.goToFooterLinkByName('Privacy')
      Page.verifyOnPage(PrivacyNoticePage)

      // Select 'Terms and conditions' in footer
      homePage.goToFooterLinkByName('Terms and conditions')
      Page.verifyOnPage(TermsAndConditionsPage)
    })
  })
})
