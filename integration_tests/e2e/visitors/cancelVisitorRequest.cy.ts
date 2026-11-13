import TestData from '../../../server/routes/testutils/testData'
import VisitsPage from '../../pages/visits/visits'
import Page from '../../pages/page'
import VisitorsPage from '../../pages/visitors/visitors'
import CancelVisitorRequestPage from '../../pages/visitors/cancelVisitorRequest/cancelVisitorRequest'
import CancelVisitorRequestConfirmedPage from '../../pages/visitors/cancelVisitorRequest/cancelVisitorRequestConfirmed'
import PrisonersPage from '../../pages/prisoners/prisoners'

const bookerReference = TestData.bookerReference().value
const prisoner1 = TestData.bookerPrisonerInfoDto()
const prisoner2 = TestData.bookerPrisonerInfoDto({
  prisonerNumber: 'B2345CD',
  firstName: 'Lisa',
  dateOfBirth: '1992-05-23',
})

context('Cancel a visitor request', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')

    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner1, prisoner2] })
    cy.task('stubGetVisitors')
    cy.task('stubGetVisitors', {
      bookerReference: TestData.bookerReference(),
      prisonerNumber: prisoner2.prisoner.prisonerNumber,
    })
    cy.task('stubGetFuturePublicVisits', {
      bookerReference,
      visits: [],
    })
  })

  // This test uses the first prisoner
  it('should be able to abandon the cancel a visitor request journey', () => {
    cy.task('stubGetVisitorRequests', {
      prisonerNumber: prisoner1.prisoner.prisonerNumber,
      visitorRequests: [TestData.bookerPrisonerVisitorRequestDto()],
    })

    // Visits home page
    cy.signIn()
    const visitsPage = Page.verifyOnPage(VisitsPage)

    // Navigate to Visitors page
    visitsPage.goToServiceHeaderLinkByName('Visitors')
    const prisonersPage = Page.verifyOnPage(PrisonersPage)
    prisonersPage.viewPrisonerVisitors(0)
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.prisonerName().contains('John Smith')
    visitorsPage.visitorRequests().should('exist')

    // Start cancellation journey
    visitorsPage.cancelAVisitor(0)
    const cancelVisitorRequestPage = Page.verifyOnPage(CancelVisitorRequestPage)

    cancelVisitorRequestPage.visitorName().contains('Joan Phillips')
    cancelVisitorRequestPage.visitorDateOfBirth().contains('21 February 1980')

    // Abandon cancellation; return to Visitors page
    cancelVisitorRequestPage.cancelVisitNo().click()
    cancelVisitorRequestPage.confirm()

    const returnedVisitorsPage = Page.verifyOnPage(VisitorsPage)
    returnedVisitorsPage.prisonerName().contains('John Smith')
  })

  // This test uses the second prisoner
  it('should complete the cancel a visitor request journey', () => {
    const visitorRequest = TestData.bookerPrisonerVisitorRequestDto({ prisonerId: prisoner2.prisoner.prisonerNumber })

    cy.task('stubGetVisitorRequests', {
      visitorRequests: [visitorRequest],
      prisonerNumber: prisoner2.prisoner.prisonerNumber,
    })

    // Visits home page
    cy.signIn()
    const visitsPage = Page.verifyOnPage(VisitsPage)

    // Navigate to Visitors page
    visitsPage.goToServiceHeaderLinkByName('Visitors')
    const prisonersPage = Page.verifyOnPage(PrisonersPage)
    prisonersPage.viewPrisonerVisitors(1)
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.prisonerName().contains('Lisa Smith')
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

    cancelVisitorRequestPage.confirm()
    Page.verifyOnPage(CancelVisitorRequestConfirmedPage)
  })
})
