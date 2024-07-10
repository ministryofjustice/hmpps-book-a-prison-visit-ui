import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import AccessibilityStatementPage from '../pages/accessibilityStatement'
import HomePage from '../pages/home'
import Page from '../pages/page'
import PrivacyNoticePage from '../pages/privacyNotice'
import TermsAndConditionsPage from '../pages/termsAndConditions'

context('Static content pages', () => {
  describe('Unauthenticated user', () => {
    it('should be able to access static content pages', () => {
      cy.visit(paths.ACCESSIBILITY)
      const accessibilityStatementPage = Page.verifyOnPage(AccessibilityStatementPage)

      // should not have the GOVUK One Login header
      accessibilityStatementPage.signOut().should('not.exist')
    })
  })

  describe('Authenticated user', () => {
    it('should be able to navigate to static content pages from home page using footer links', () => {
      cy.task('reset')
      cy.task('stubSignIn')
      cy.task('stubHmppsAuthToken')

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [TestData.prisonerInfoDto] })
      cy.signIn()

      // Home page
      const homePage = Page.verifyOnPage(HomePage)

      // should have the GOVUK One Login header
      homePage.signOut().should('exist')

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
