import TestData from '../../server/routes/testutils/testData'
import AddVisitorStartPage from '../pages/addVisitor/addVisitorStart'
import CheckVisitorDetailsPage from '../pages/addVisitor/checkVisitorDetails'
import VisitorDetailsPage from '../pages/addVisitor/visitorDetails'
import VisitorRequestFailAlreadyRequestedPage from '../pages/addVisitor/visitorRequestFailAlreadyRequested'
import VisitorRequestSuccessPage from '../pages/addVisitor/visitorRequestSuccess'
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
    cy.signIn()
  })

  it('should complete the add a visitor request journey', () => {
    // Home page
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)

    // Start link a new visitor journey
    visitorsPage.linkANewVisitor()
    const addVisitorStartPage = Page.verifyOnPage(AddVisitorStartPage)

    // Enter visitor details
    addVisitorStartPage.continue()
    const visitorDetailsPage = Page.verifyOnPage(VisitorDetailsPage)
    visitorDetailsPage.enterFirstName('Joan')
    visitorDetailsPage.enterLastName('Smith')
    visitorDetailsPage.enterVisitorDob(21, 2, 1980)

    // Check visitor request
    visitorDetailsPage.continue()
    const checkVisitorDetailsPage = Page.verifyOnPage(CheckVisitorDetailsPage)
    checkVisitorDetailsPage.firstName().contains('Joan')
    checkVisitorDetailsPage.lastName().contains('Smith')
    checkVisitorDetailsPage.dateOfBirth().contains('21/2/1980')

    // Change details and continue
    checkVisitorDetailsPage.changeDetails()
    visitorDetailsPage.checkOnPage()
    visitorDetailsPage.enterLastName('Phillips')
    visitorDetailsPage.continue()
    checkVisitorDetailsPage.checkOnPage()
    checkVisitorDetailsPage.lastName().contains('Phillips')

    // Submit request and get to confirmation
    cy.task('stubAddVisitorRequest')
    checkVisitorDetailsPage.submit()
    Page.verifyOnPage(VisitorRequestSuccessPage)
  })

  it('should complete the add a visitor request journey and fail with the duplicate request warning', () => {
    // Home page
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)

    // Start link a new visitor journey
    visitorsPage.linkANewVisitor()
    const addVisitorStartPage = Page.verifyOnPage(AddVisitorStartPage)

    // Enter visitor details
    addVisitorStartPage.continue()
    const visitorDetailsPage = Page.verifyOnPage(VisitorDetailsPage)
    visitorDetailsPage.enterFirstName('Joan')
    visitorDetailsPage.enterLastName('Phillips')
    visitorDetailsPage.enterVisitorDob(21, 2, 1980)

    // Check visitor request
    visitorDetailsPage.continue()
    const checkVisitorDetailsPage = Page.verifyOnPage(CheckVisitorDetailsPage)

    // Submit request and get failure page (duplicate request)
    cy.task('stubAddVisitorRequestFail')
    checkVisitorDetailsPage.submit()
    const visitorRequestFailAlreadyRequestedPage = Page.verifyOnPage(VisitorRequestFailAlreadyRequestedPage)
    visitorRequestFailAlreadyRequestedPage.getVisitorName().contains('Joan Phillips')
  })
})
