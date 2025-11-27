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
    cy.task('stubGetActiveVisitorRequests', {
      visitorRequests: [
        TestData.activeVisitorRequest({
          reference: 'cccc-bbbb-aaaa',
          firstName: 'Jack',
          lastName: 'Rogers',
          dateOfBirth: '1990-01-15',
        }),
      ],
    })
    cy.task('stubGetVisitors')
    cy.task('clearRateLimits')
    cy.signIn()
  })

  it('should complete the add a visitor request journey', () => {
    // Home page
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.requestVisitorName(1).contains('Jack Rogers')
    visitorsPage.requestVisitorDateOfBirth(1).contains('15 January 1990')

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
    cy.signIn()
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

  describe('Rate limiting', () => {
    // using low, custom limits set in feature.env for max add visitor requests per booker
    it('should limit the number of times a booker and request to add a visitor and allow retry after expiry', () => {
      const attemptAddVisitorRequestJourney = (count: number) => {
        cy.log(`Add visitor request attempt ${count}`)

        // Home page
        cy.signIn()
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

        // Submit request and get to confirmation
        cy.task('stubAddVisitorRequest')
        checkVisitorDetailsPage.submit()
      }

      // Try 2 times and should succeed
      attemptAddVisitorRequestJourney(1)
      Page.verifyOnPage(VisitorRequestSuccessPage)
      attemptAddVisitorRequestJourney(2)
      Page.verifyOnPage(VisitorRequestSuccessPage)

      // Next attempt should fail (max visitor requests = 2)
      attemptAddVisitorRequestJourney(3)
      cy.contains('Too Many Requests')

      // Wait for rate limits to expire
      cy.task('waitUntilRateLimitsExpire')

      // Next attempt should succeed as limit now expired
      attemptAddVisitorRequestJourney(4)
      Page.verifyOnPage(VisitorRequestSuccessPage)
    })
  })
})
