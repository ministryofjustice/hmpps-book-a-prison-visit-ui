import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import BookingsPage from '../pages/booking'
import Page from '../pages/page'

context('Booking journey', () => {
  const prisoner = TestData.prisonerInfoDto()
  const visit = TestData.visitDto({ startTimestamp: '2026-05-21T10:00:00', endTimestamp: '2026-05-21T11:30:00' })
  const bookerReference = TestData.bookerReference()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should complete the booking journey', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    cy.task('stubGetFuturePublicVisit', {
      bookerReference: bookerReference.value,
      visits: [visit],
    })

    cy.visit(paths.BOOKINGS)
    const bookingsPage = Page.verifyOnPage(BookingsPage)
    bookingsPage.visitDate().contains('Thursday 21 May 2026')
    bookingsPage.visitStartTime().contains('10am')
    bookingsPage.visitEndTime().contains('11:30am')
    bookingsPage.visitReference().contains('ab-cd-ef-gh')
  })
})
