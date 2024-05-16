import { format, subYears } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import SelectVisitorsPage from '../pages/bookingJourney/selectVisitors'
import HomePage from '../pages/home'
import Page from '../pages/page'

context('Booking journey', () => {
  const today = new Date()
  const prison = TestData.prisonDto()
  const visitors = [
    TestData.visitorInfoDto({
      personId: 1,
      firstName: 'Adult',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 25), 'yyyy-MM-dd'), // 25-year-old
    }),
    TestData.visitorInfoDto({
      personId: 2,
      firstName: 'Child',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 12), 'yyyy-MM-dd'), // 12-year-old
    }),
    TestData.visitorInfoDto({
      personId: 3,
      firstName: 'Child',
      lastName: 'Two',
      dateOfBirth: format(subYears(today, 5), 'yyyy-MM-dd'), // 5-year-old
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should complete the booking journey', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [TestData.prisonerInfoDto()] })
    cy.signIn()

    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    homePage.startBooking()

    // Select visitors page - choose visitors
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.visitorsMaxTotal().contains(prison.maxTotalVisitors)
    selectVisitorsPage.prisonName().contains(prison.prisonName)
    selectVisitorsPage.visitorsMaxAdults().contains(prison.maxAdultVisitors)
    selectVisitorsPage.visitorsMaxChildren().contains(prison.maxChildVisitors)
    selectVisitorsPage.visitorsAdultAge().eq(0).contains(prison.adultAgeYears)
    selectVisitorsPage.visitorsAdultAge().eq(1).contains(prison.adultAgeYears)
    selectVisitorsPage.getVisitorLabel(0).contains('Adult One, (25 years old)')
    selectVisitorsPage.getVisitorLabel(1).contains('Child One, (12 years old)')
    selectVisitorsPage.getVisitorLabel(2).contains('Child Two, (5 years old)')
    selectVisitorsPage.selectVisitor(0)
    selectVisitorsPage.selectVisitor(2)
    selectVisitorsPage.continue()

    // TODO add to this test as booking journey implemented
  })
})
