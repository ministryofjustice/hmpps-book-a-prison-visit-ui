import TestData from '../../server/routes/testutils/testData'
import AddVisitorStartPage from '../pages/addVisitor/addVisitorStart'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitorsPage from '../pages/visitors/visitors'

context('Add a visitor', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')

    cy.task('stubGetSupportedPrisons')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.task('stubGetVisitors')
  })

  it('should complete the add a visitor request journey', () => {
    cy.signIn()

    // Home page
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)

    // Start link a new visitor journey
    visitorsPage.linkANewVisitor()
    Page.verifyOnPage(AddVisitorStartPage)

    // TODO expand test as journey built out
  })
})
