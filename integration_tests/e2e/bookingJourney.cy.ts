import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Booking journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should complete the booking journey', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.prisonerInfoDto()] })
    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')
    homePage.startButton().contains('Start')

    // TODO add to this test as booking journey implemented
  })
})
