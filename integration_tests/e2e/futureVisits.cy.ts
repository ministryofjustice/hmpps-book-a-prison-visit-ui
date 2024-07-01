import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import BookingsPage from '../pages/booking'
import Page from '../pages/page'

context('Bookings home page', () => {
  const prisoner = TestData.prisonerInfoDto()
  const visit = TestData.visitDto({ startTimestamp: '2026-05-21T10:00:00', endTimestamp: '2026-05-21T11:30:00' })
  const bookerReference = TestData.bookerReference()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should show Bookings home page with future visits', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    cy.task('stubGetFuturePublicVisits', {
      bookerReference: bookerReference.value,
      visits: [visit],
    })

    cy.visit(paths.BOOKINGS.HOME)
    const bookingsPage = Page.verifyOnPage(BookingsPage)
    bookingsPage.visitDate(1).contains('Thursday 21 May 2026')
    bookingsPage.visitStartTime(1).contains('10am')
    bookingsPage.visitEndTime(1).contains('11:30am')
    bookingsPage.visitReference(1).contains('ab-cd-ef-gh')
  })
})
