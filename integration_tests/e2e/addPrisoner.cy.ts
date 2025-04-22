import TestData from '../../server/routes/testutils/testData'
import PrisonerAddedPage from '../pages/addPrisoner/prisonerAdded'
import PrisonerDetailsPage from '../pages/addPrisoner/prisonerDetails'
import PrisonerLocationPage from '../pages/addPrisoner/prisonerLocation'
import PrisonerNotMatchedPage from '../pages/addPrisoner/prisonerNotMatched'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Add a prisoner', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should complete the add prisoner journey, with failed and then successful attempt', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners')
    cy.signIn()

    // Home page - booker with no prisoner
    const homePage = Page.verifyOnPage(HomePage)
    homePage.noPrisoner().should('exist')

    // Start Add a prisoner journey
    cy.task('stubGetSupportedPrisons')
    homePage.addPrisoner()

    // Prisoner location page - select prison and continue
    const prisonerLocationPage = Page.verifyOnPage(PrisonerLocationPage)
    prisonerLocationPage.selectPrison('HEI')
    prisonerLocationPage.continue()

    // Prisoner details page - enter details
    const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
    prisonerDetailsPage.enterFirstName('John')
    prisonerDetailsPage.enterLastName('Smyth')
    prisonerDetailsPage.enterPrisonerDob(2, 4, 1975)
    prisonerDetailsPage.enterPrisonNumber('A1234BC')

    // Submit prisoner details (entered incorrectly first time)
    cy.task('stubRegisterPrisoner', {
      prisoner: TestData.registerPrisonerForBookerDto({ prisonerLastName: 'Smyth' }),
      fail: true,
    })
    prisonerDetailsPage.continue()

    // Prisoner not matched page
    const prisonerNotMatchedPage = Page.verifyOnPage(PrisonerNotMatchedPage)

    // Go back and correct details
    prisonerNotMatchedPage.goBackCheckDetails()
    prisonerDetailsPage.checkOnPage()
    prisonerDetailsPage.enterLastName('Smith')

    // Re-submit prisoner details
    cy.task('stubRegisterPrisoner')
    prisonerDetailsPage.continue()

    // Prisoner added
    Page.verifyOnPage(PrisonerAddedPage)
  })
})
