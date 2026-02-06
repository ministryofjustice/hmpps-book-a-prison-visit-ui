import TestData from '../../server/routes/testutils/testData'
import SelectVisitorsPage from '../pages/bookVisit/selectVisitors'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitorsPage from '../pages/visitors/visitors'

context('Visitors page', () => {
  const visitors = [
    TestData.visitorInfoDto(),
    TestData.visitorInfoDto({
      visitorId: 2000,
      firstName: 'Keith',
      lastName: 'Richards',
      dateOfBirth: '1990-05-05',
      visitorRestrictions: [{ restrictionType: 'BAN' }],
    }),
    TestData.visitorInfoDto({
      visitorId: 3000,
      firstName: 'John',
      lastName: 'Edwards',
      dateOfBirth: '2000-06-06',
      approved: false,
    }),
  ]

  const visitorRequests = [
    TestData.visitorRequest({
      firstName: 'Jack',
      lastName: 'Rogers',
      dateOfBirth: '1990-01-15',
    }),
  ]

  const prison = TestData.prisonDto()
  const prisoner = TestData.bookerPrisonerInfoDto()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubGetVisitorRequests', { visitorRequests })
    cy.task('stubValidatePrisonerPass')
  })

  it('should show Visitors page with two visitors (one having a BAN restriction) and one visitor request', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Visitors')

    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.prisonerName().contains('John Smith')
    visitorsPage.visitorName(0).contains('Joan Phillips')
    visitorsPage.visitorDateOfBirth(0).contains('21 February 1980')
    visitorsPage.visitorAvailability(0).contains('Yes')
    visitorsPage.visitorName(1).contains('Keith Richards')
    visitorsPage.visitorDateOfBirth(1).contains('5 May 1990')
    visitorsPage.visitorAvailability(1).contains('No, banned')
    visitorsPage.visitorName(2).contains('John Edwards')
    visitorsPage.visitorDateOfBirth(2).contains('6 June 2000')
    visitorsPage.visitorAvailability(2).contains('No, visitor not approved')
    visitorsPage.visitorRequests().should('exist')
    visitorsPage.visitorRequestName(0).contains('Jack Rogers')
    visitorsPage.visitorRequestDateOfBirth(0).contains('15 January 1990')
  })

  it('should not show a banned visitor on booking journey Select visitors page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.startBooking()

    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitorByNameLabel('Joan Phillips').should('exist')
    selectVisitorsPage.getVisitorByNameLabel('Keith Richards').should('not.exist')
  })
})
