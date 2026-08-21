import TestData from '../../../server/routes/testutils/testData'
import VisitsPage from '../../pages/visits/visits'
import Page from '../../pages/page'
import VisitorsPage from '../../pages/visitors/visitors'
import CancelVisitorRequestPage from '../../pages/visitors/cancelVisitorRequest/cancelVisitorRequest'
import CancelVisitorRequestConfirmedPage from '../../pages/visitors/cancelVisitorRequest/cancelVisitorRequestConfirmed'

const bookerReference = TestData.bookerReference().value

context('Cancel a visitor request', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')

    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.bookerPrisonerInfoDto()] })
    cy.task('stubGetVisitors')
    cy.task('stubGetVisitorRequests', { visitorRequests: [] })
    cy.task('stubGetFuturePublicVisits', {
      bookerReference,
      visits: [],
    })
  })

  it('should be able to abandon the cancel a visitor request journey', () => {
    cy.task('stubGetVisitorRequests', { visitorRequests: [TestData.visitorRequest()] })

    // Visits home page
    cy.signIn()
    const visitsPage = Page.verifyOnPage(VisitsPage)

    // Navigate to Visitors page
    visitsPage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.visitorRequests().should('exist')

    // Start cancellation journey
    visitorsPage.cancelAVisitor(0)
    const cancelVisitorRequestPage = Page.verifyOnPage(CancelVisitorRequestPage)

    cancelVisitorRequestPage.visitorName().contains('Joan Phillips')
    cancelVisitorRequestPage.visitorDateOfBirth().contains('21 February 1980')

    // Abandon cancellation; return to Visitors page
    cancelVisitorRequestPage.cancelVisitNo().click()
    cancelVisitorRequestPage.confirmButton()

    Page.verifyOnPage(VisitorsPage)
  })

  it('should complete the cancel a visitor request journey', () => {
    const visitorRequest = TestData.visitorRequest()

    cy.task('stubGetVisitorRequests', { visitorRequests: [visitorRequest] })

    // Visits home page
    cy.signIn()
    const visitsPage = Page.verifyOnPage(VisitsPage)

    // Navigate to Visitors page
    visitsPage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.visitorRequests().should('exist')

    // Start cancellation journey
    visitorsPage.cancelAVisitor(0)
    const cancelVisitorRequestPage = Page.verifyOnPage(CancelVisitorRequestPage)

    cancelVisitorRequestPage.visitorName().contains('Joan Phillips')
    cancelVisitorRequestPage.visitorDateOfBirth().contains('21 February 1980')

    // Confirm cancellation
    cancelVisitorRequestPage.cancelVisitYes().click()

    cy.task('stubCancelVisitorRequest', {
      requestReference: visitorRequest.reference,
      bookerReference: TestData.bookerReference().value,
    })

    cancelVisitorRequestPage.confirmButton()
    Page.verifyOnPage(CancelVisitorRequestConfirmedPage)
  })
})
