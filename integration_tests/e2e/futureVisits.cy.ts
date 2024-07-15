import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import BookingsPage from '../pages/bookings'
import VisitDetailsPage from '../pages/bookings/visit'
import Page from '../pages/page'

context('Bookings home page', () => {
  const prisoner = TestData.bookerPrisonerInfoDto({ prisonId: 'DHI' })
  const orchestrationVisitDto = TestData.orchestrationVisitDto({
    startTimestamp: '2026-05-21T10:00:00',
    endTimestamp: '2026-05-21T11:30:00',
    prisonId: 'DHI',
  })
  const bookerReference = TestData.bookerReference()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should show Bookings home page with future visits and navigate to view the visit details', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [orchestrationVisitDto],
    })

    cy.visit(paths.BOOKINGS.HOME)
    const bookingsPage = Page.verifyOnPage(BookingsPage)
    bookingsPage.visitDate(1).contains('Thursday 21 May 2026')
    bookingsPage.visitStartTime(1).contains('10am')
    bookingsPage.visitEndTime(1).contains('11:30am')
    bookingsPage.visitReference(1).contains('ab-cd-ef-gh')

    bookingsPage.visitLink(1).click()
    const visitDetailsPage = Page.verifyOnPage(VisitDetailsPage)
    visitDetailsPage.visitDate().contains('Thursday 21 May 2026')
    visitDetailsPage.visitStartTime().contains('10am')
    visitDetailsPage.visitEndTime().contains('11:30am')
    visitDetailsPage.prisonerName().contains('John Smith')
    visitDetailsPage.visitorName(1).contains('Keith Phillips')
    visitDetailsPage.additionalSupport().contains('None')
    visitDetailsPage.mainContactName().contains('Joan Phillips')
    visitDetailsPage.mainContactNumber().contains('01234 567890')
    visitDetailsPage.prisonName().contains('Drake Hall (HMP & YOI)')
    visitDetailsPage.prisonPhoneNumber().contains('0121 661 2101')
  })
})
