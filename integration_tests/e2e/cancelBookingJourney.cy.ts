import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import VisitsPage from '../pages/visits/visits'
import CancelConfirmedPage from '../pages/visits/cancel/cancelConfirmed'
import CancelVisitPage from '../pages/visits/cancel/cancelVisit'
import VisitDetailsPage from '../pages/visits/visitDetails'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Cancel booking journey', () => {
  const orchestrationVisitDto = TestData.orchestrationVisitDto({
    startTimestamp: '2026-05-21T10:00:00',
    endTimestamp: '2026-05-21T11:30:00',
  })

  const prisoner = TestData.bookerPrisonerInfoDto()
  const bookerReference = TestData.bookerReference()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrison')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()
  })

  it('should navigate to Future visits page, then view visit details and cancel it', () => {
    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [orchestrationVisitDto],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Visits')
    const visitsPage = Page.verifyOnPage(VisitsPage)
    visitsPage.visitDate(1).contains('Thursday 21 May 2026')
    visitsPage.visitStartTime(1).contains('10am')
    visitsPage.visitEndTime(1).contains('11:30am')
    visitsPage.visitReference(1).contains('ab-cd-ef-gh')

    visitsPage.visitLink(1).click()
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.backLink().should('have.attr', 'href', paths.VISITS.HOME)
    visitDetailsPage.visitDate().contains('Thursday 21 May 2026')
    visitDetailsPage.cancelVisitButton().contains('Cancel visit')
    visitDetailsPage.cancelVisitButton().click()

    const cancelVisitPage = Page.verifyOnPage(CancelVisitPage)
    cancelVisitPage.visitDate().contains('Thursday 21 May 2026')
    cancelVisitPage.visitStartTime().contains('10am')
    cancelVisitPage.visitEndTime().contains('11:30am')
    cancelVisitPage.prisonerName().contains('John Smith')
    cancelVisitPage.visitorName(1).contains('Keith Phillips')
    cancelVisitPage.cancelBookingNo().click()
    cancelVisitPage.confirmButton()

    Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.cancelVisitButton().click()

    Page.verifyOnPage(CancelVisitPage)
    cancelVisitPage.cancelBookingYes().click()

    cy.task('stubCancelVisit', {
      reference: orchestrationVisitDto.reference,
      bookerReference: bookerReference.value,
    })

    cancelVisitPage.confirmButton()

    const cancelConfirmedPage = Page.verifyOnPage(CancelConfirmedPage)
    cancelConfirmedPage.confirmationNotificationMessage().contains('An email and a text message will be sent')
  })
})
