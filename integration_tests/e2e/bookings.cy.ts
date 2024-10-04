import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import BookingsPage from '../pages/bookings'
import CancelledVisitsPage from '../pages/bookings/cancelledVisitsPage'
import PastVisitsPage from '../pages/bookings/pastVisitsPage'
import VisitDetailsPage from '../pages/bookings/visit'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Bookings home page', () => {
  const orchestrationVisitDto = TestData.orchestrationVisitDto({
    startTimestamp: '2026-05-21T10:00:00',
    endTimestamp: '2026-05-21T11:30:00',
  })
  const pastVisitDto = TestData.orchestrationVisitDto({
    startTimestamp: '2023-05-30T10:00:00',
    endTimestamp: '2023-05-30T11:30:00',
  })
  const cancelledVisitDto = TestData.orchestrationVisitDto({
    startTimestamp: '2026-05-21T10:00:00',
    endTimestamp: '2026-05-21T11:30:00',
    outcomeStatus: 'ESTABLISHMENT_CANCELLED',
    visitStatus: 'CANCELLED',
  })

  const prison = TestData.prisonDto()
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

  it('should show Bookings home page with future visits and navigate to view the visit details', () => {
    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [orchestrationVisitDto],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Bookings')
    const bookingsPage = Page.verifyOnPage(BookingsPage)
    bookingsPage.visitDate(1).contains('Thursday 21 May 2026')
    bookingsPage.visitStartTime(1).contains('10am')
    bookingsPage.visitEndTime(1).contains('11:30am')
    bookingsPage.visitReference(1).contains('ab-cd-ef-gh')

    bookingsPage.visitLink(1).click()
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.backLink().should('have.attr', 'href', paths.BOOKINGS.HOME)
    visitDetailsPage.visitDate().contains('Thursday 21 May 2026')
    visitDetailsPage.visitStartTime().contains('10am')
    visitDetailsPage.visitEndTime().contains('11:30am')
    visitDetailsPage.prisonerName().contains('John Smith')
    visitDetailsPage.visitorName(1).contains('Keith Phillips')
    visitDetailsPage.additionalSupport().contains('Wheelchair access requested')
    visitDetailsPage.mainContactName().contains('Joan Phillips')
    visitDetailsPage.mainContactNumber().contains('01234 567890')
    visitDetailsPage.prisonName().contains(prison.prisonName)
    visitDetailsPage.prisonPhoneNumber().contains(prison.phoneNumber)
  })

  it('should show Past visits page with visits and navigate to view the visit details', () => {
    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [orchestrationVisitDto],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Bookings')
    const bookingsPage = Page.verifyOnPage(BookingsPage)

    cy.task('stubGetPastPublicVisits', {
      bookerReference: bookerReference.value,
      visits: [pastVisitDto],
    })

    bookingsPage.pastVisitsLink().click()

    const pastVisitsPage = Page.verifyOnPage(PastVisitsPage)
    pastVisitsPage.visitDate(1).contains('Tuesday 30 May 2023')
    pastVisitsPage.visitStartTime(1).contains('10am')
    pastVisitsPage.visitEndTime(1).contains('11:30am')
    pastVisitsPage.visitLink(1).click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.backLink().should('have.attr', 'href', paths.BOOKINGS.PAST)
    visitDetailsPage.visitDate().contains('Tuesday 30 May 2023')
    visitDetailsPage.visitStartTime().contains('10am')
    visitDetailsPage.visitEndTime().contains('11:30am')
  })

  it('should show Cancelled visits page with visits and navigate to view the visit details', () => {
    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [orchestrationVisitDto],
    })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Bookings')
    const bookingsPage = Page.verifyOnPage(BookingsPage)

    cy.task('stubGetCancelledPublicVisits', {
      bookerReference: bookerReference.value,
      visits: [cancelledVisitDto],
    })

    bookingsPage.cancelledVisitsLink().click()

    const cancelledVisitsPage = Page.verifyOnPage(CancelledVisitsPage)
    cancelledVisitsPage.visitDate(1).contains('Thursday 21 May 2026')
    cancelledVisitsPage.visitStartTime(1).contains('10am')
    cancelledVisitsPage.visitEndTime(1).contains('11:30am')
    cancelledVisitsPage.visitLink(1).click()

    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.backLink().should('have.attr', 'href', paths.BOOKINGS.CANCELLED)
    visitDetailsPage.visitCancelledBanner().contains('This visit was cancelled by the prison')
    visitDetailsPage.visitDate().contains('Thursday 21 May 2026')
    visitDetailsPage.visitStartTime().contains('10am')
    visitDetailsPage.visitEndTime().contains('11:30am')
  })
})
