import TestData from '../../server/routes/testutils/testData'
import AddVisitorStartPage from '../pages/addVisitor/addVisitorStart'
import CheckVisitorDetailsPage from '../pages/addVisitor/checkVisitorDetails'
import VisitorApprovedPage from '../pages/addVisitor/visitorApproved'
import VisitorDetailsPage from '../pages/addVisitor/visitorDetails'
import VisitorRequestFailAlreadyRequestedPage from '../pages/addVisitor/visitorRequestFailAlreadyRequested'
import VisitorRequestedPage from '../pages/addVisitor/visitorRequested'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitorsPage from '../pages/visitors/visitors'

context('Add a visitor', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')

    cy.task('stubGetSupportedPrisons')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.task('stubGetVisitors')
    cy.task('stubGetVisitorRequests', { visitorRequests: [] })
    cy.task('clearRateLimits')
  })

  it('should complete the add a visitor request journey', () => {
    // Home page
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.visitorRequests().should('not.exist')

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
    Page.verifyOnPage(VisitorRequestedPage)
  })

  it('should complete the add a visitor request journey - with the auto-approved final step', () => {
    // Home page
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)

    // Navigate to Visitors page
    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.visitorRequests().should('not.exist')

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
    cy.task('stubAddVisitorRequest', {
      visitorRequestResponse: TestData.createVisitorRequestResponseDto({ status: 'AUTO_APPROVED' }),
    })
    checkVisitorDetailsPage.submit()
    const visitorApprovedPage = Page.verifyOnPage(VisitorApprovedPage)
    visitorApprovedPage
      .visitorApprovedText()
      .contains('Joan Phillips will appear as a visitor when you book visits for John Smith')
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
      Page.verifyOnPage(VisitorRequestedPage)
      attemptAddVisitorRequestJourney(2)
      Page.verifyOnPage(VisitorRequestedPage)

      // Next attempt should fail (max visitor requests = 2)
      attemptAddVisitorRequestJourney(3)
      cy.contains('Too Many Requests')

      // Wait for rate limits to expire
      cy.task('waitUntilRateLimitsExpire')

      // Next attempt should succeed as limit now expired
      attemptAddVisitorRequestJourney(4)
      Page.verifyOnPage(VisitorRequestedPage)
    })
  })
})
