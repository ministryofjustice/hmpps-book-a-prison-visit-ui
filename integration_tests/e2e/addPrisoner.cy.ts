import TestData from '../../server/routes/testutils/testData'
import PrisonerAddedPage from '../pages/addPrisoner/prisonerAdded'
import PrisonerDetailsPage from '../pages/addPrisoner/prisonerDetails'
import PrisonerLocationPage from '../pages/addPrisoner/prisonerLocation'
import PrisonerNotMatchedPage from '../pages/addPrisoner/prisonerNotMatched'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SignedOutPage from '../pages/staticPages/signedOut'

context('Add a prisoner', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')

    cy.task('stubGetSupportedPrisons')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners')

    cy.task('clearRateLimits')
  })

  it('should complete the add prisoner journey, with failed and then successful attempt', () => {
    cy.signIn()

    // Home page - booker with no prisoner
    const homePage = Page.verifyOnPage(HomePage)
    homePage.noPrisoner().should('exist')

    // Start Add a prisoner journey
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

  describe('Rate limiting', () => {
    // using low, custom limits set in feature.env for
    // booker/prisoner max requests and rate limit window

    it('should limit the number of times a booker can try to add a prisoner and allow retry after limit expiry', () => {
      cy.signIn()

      // Start Add a prisoner journey
      const homePage = Page.verifyOnPage(HomePage)
      homePage.addPrisoner()

      // Prisoner location page - select prison and continue
      const prisonerLocationPage = Page.verifyOnPage(PrisonerLocationPage)
      prisonerLocationPage.selectPrison('HEI')
      prisonerLocationPage.continue()

      // Prisoner details page - enter details
      const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
      prisonerDetailsPage.enterFirstName('John')
      prisonerDetailsPage.enterLastName('Smith')
      prisonerDetailsPage.enterPrisonerDob(2, 4, 1975)
      prisonerDetailsPage.enterPrisonNumber('A1234BC')

      // Repeatedly attempt to add prisoner (API mocked to not match)
      cy.task('stubRegisterPrisoner', { fail: true })
      // attempt #1
      prisonerDetailsPage.continue()
      const prisonerNotMatchedPage = Page.verifyOnPage(PrisonerNotMatchedPage)
      // attempt #2
      prisonerNotMatchedPage.goBackCheckDetails()
      prisonerDetailsPage.continue()
      prisonerNotMatchedPage.checkOnPage()
      // attempt #3
      prisonerNotMatchedPage.goBackCheckDetails()
      prisonerDetailsPage.continue()
      prisonerNotMatchedPage.checkOnPage()
      // attempt #4
      prisonerNotMatchedPage.goBackCheckDetails()
      prisonerDetailsPage.continue()

      // Rate limit reached for prisoner A1234BC (prisoner max requests = 3)
      cy.contains('Too Many Requests')

      // Try another prisoner
      cy.go('back')
      cy.task('stubRegisterPrisoner', {
        prisoner: TestData.registerPrisonerForBookerDto({ prisonerId: 'B1234BC' }),
        fail: true,
      })
      prisonerDetailsPage.enterPrisonNumber('B1234BC')
      // attempt #1
      prisonerDetailsPage.continue()
      prisonerNotMatchedPage.checkOnPage()
      // attempt #2
      prisonerNotMatchedPage.goBackCheckDetails()
      prisonerDetailsPage.continue()

      // Rate limit now reached for the booker (booker max requests = 5)
      cy.contains('Too Many Requests')

      // Wait for rate limits to expire
      cy.task('waitUntilRateLimitsExpire')

      // No try again to add original prisoner (API mocked to match)
      cy.go('back')
      cy.task('stubRegisterPrisoner')
      prisonerDetailsPage.checkOnPage()
      prisonerDetailsPage.enterPrisonNumber('A1234BC')
      prisonerDetailsPage.continue()

      // Prisoner added
      Page.verifyOnPage(PrisonerAddedPage)
    })

    it('should limit the number of attempts to add a prisoner by different bookers (and persist limits across sign-in/sign-out)', () => {
      const addAPrisoner = (booker: string) => {
        const bookerReference = TestData.bookerReference({ value: booker })
        cy.task('stubGetBookerReference', { bookerReference })
        cy.task('stubGetPrisoners', { bookerReference })
        cy.signIn()

        // Start Add a prisoner journey
        const homePage = Page.verifyOnPage(HomePage)
        homePage.addPrisoner()

        // Prisoner location page - select prison and continue
        const prisonerLocationPage = Page.verifyOnPage(PrisonerLocationPage)
        prisonerLocationPage.selectPrison('HEI')
        prisonerLocationPage.continue()

        // Prisoner details page - enter details
        const prisonerDetailsPage = Page.verifyOnPage(PrisonerDetailsPage)
        prisonerDetailsPage.enterFirstName('John')
        prisonerDetailsPage.enterLastName('Smith')
        prisonerDetailsPage.enterPrisonerDob(2, 4, 1975)
        prisonerDetailsPage.enterPrisonNumber('A1234BC')

        // Attempt to add prisoner (API mocked to not match)
        cy.task('stubRegisterPrisoner', { bookerReference, fail: true })
        prisonerDetailsPage.continue()
      }

      // attempt #1
      addAPrisoner('booker-1')
      const prisonerNotMatchedPage = Page.verifyOnPage(PrisonerNotMatchedPage)
      prisonerNotMatchedPage.signOut()
      Page.verifyOnPage(SignedOutPage)

      // attempt #2
      addAPrisoner('booker-2')
      prisonerNotMatchedPage.checkOnPage()
      prisonerNotMatchedPage.signOut()
      Page.verifyOnPage(SignedOutPage)

      // attempt #3
      addAPrisoner('booker-3')
      prisonerNotMatchedPage.checkOnPage()
      prisonerNotMatchedPage.signOut()
      Page.verifyOnPage(SignedOutPage)

      // attempt #4
      addAPrisoner('booker-3')

      // Rate limit: max attempts (3) reached for prisoner by any booker
      cy.contains('Too Many Requests')
    })
  })
})
