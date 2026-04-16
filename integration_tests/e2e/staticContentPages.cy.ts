import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import AccessibilityStatementPage from '../pages/staticPages/accessibilityStatement'
import VisitsPage from '../pages/visits/visits'
import Page from '../pages/page'
import PrivacyNoticePage from '../pages/staticPages/privacyNotice'
import TermsAndConditionsPage from '../pages/staticPages/termsAndConditions'

context('Static content pages', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubPrisonNames')
  })

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
    const bookerReference = TestData.bookerReference().value
    it('should be able to navigate to static content pages from Visits home page using footer links', () => {
      cy.task('stubHmppsAuthToken')

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
      cy.task('stubGetFuturePublicVisits', {
        bookerReference,
        visits: [],
      })
      cy.signIn()

      // Visits home page
      const visitsPage = Page.verifyOnPage(VisitsPage)

      // should have the GOVUK One Login header
      visitsPage.oneLoginHeader().contains('GOV.UK One Login')

      // Select 'Accessibility' in footer
      visitsPage.goToFooterLinkByName('Accessibility')
      Page.verifyOnPage(AccessibilityStatementPage)

      // Select 'Privacy' in footer
      visitsPage.goToFooterLinkByName('Privacy')
      Page.verifyOnPage(PrivacyNoticePage)

      // Select 'Terms and conditions' in footer
      visitsPage.goToFooterLinkByName('Terms and conditions')
      Page.verifyOnPage(TermsAndConditionsPage)
    })
  })
})
