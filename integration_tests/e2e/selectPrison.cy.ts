import paths from '../../server/constants/paths'
import GovukOneLoginPage from '../pages/govukOneLogin'
import Page from '../pages/page'
import SelectedPrisonPage from '../pages/selectPrison/selectedPrison'
import SelectPrisonPage from '../pages/selectPrison/selectPrison'

context('Select a prison', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')
    cy.task('stubSignIn')
  })

  it('should select a supported prison and go to GOVUK One Login', () => {
    cy.hideCookieBanner()

    // Start at select prison page and type into autocomplete input
    cy.visit(paths.SELECT_PRISON)
    const selectPrisonPage = Page.verifyOnPage(SelectPrisonPage)
    selectPrisonPage.autoCompletePrisonName('Hew', 'Hewell (HMP)')

    // Submit selected prison
    cy.task('stubGetSupportedPrisonIds')
    cy.task('stubGetPrison')
    selectPrisonPage.continue()

    // Visiting selected prison page
    const selectedPrisonPage = Page.verifyOnPage(SelectedPrisonPage, 'Hewell (HMP)')

    // Continue
    selectedPrisonPage.continue()

    // Redirected to GOV.UK One Login Page
    Page.verifyOnPage(GovukOneLoginPage)
  })

  it('should select an unsupported prison be redirected to PVB', () => {
    cy.hideCookieBanner()

    // Start at select prison page and type into autocomplete input
    cy.visit(paths.SELECT_PRISON)
    const selectPrisonPage = Page.verifyOnPage(SelectPrisonPage)
    selectPrisonPage.autoCompletePrisonName('Hew', 'Hewell (HMP)')

    // Submit selected prison
    cy.task('stubGetSupportedPrisonIds', []) // none supported
    cy.task('stubPvbRequestPage')
    selectPrisonPage.continue()

    // Redirected to PVB request page
    cy.contains('PVB request page')
  })
})
