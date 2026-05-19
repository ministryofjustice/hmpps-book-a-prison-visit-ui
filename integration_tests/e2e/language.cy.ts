import paths from '../../server/constants/paths'
import Page from '../pages/page'
import AccessibilityStatementPage from '../pages/staticPages/accessibilityStatement'

context('Change language English / Welsh', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubPrisonNames')

    cy.hideCookieBanner()
  })

  it('should visit a page and toggle language between English and Welsh', () => {
    // Visit page - default language should be English
    cy.visit(paths.ACCESSIBILITY)
    const accessibilityStatementPage = Page.verifyOnPage(AccessibilityStatementPage)
    accessibilityStatementPage.getCurrentLanguage().contains('English')
    accessibilityStatementPage.getServiceName().contains('Visit someone in prison')

    // Change language to Welsh
    accessibilityStatementPage.selectWelshLanguage()
    accessibilityStatementPage.getCurrentLanguage().contains('Cymraeg')
    accessibilityStatementPage.getServiceName().contains('Ymweld â rhywun yn y carchar')

    // Change language back to English
    accessibilityStatementPage.selectEnglishLanguage()
    accessibilityStatementPage.getCurrentLanguage().contains('English')
    accessibilityStatementPage.getServiceName().contains('Visit someone in prison')
  })
})
