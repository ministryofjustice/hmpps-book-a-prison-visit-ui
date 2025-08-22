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
  ]

  const prison = TestData.prisonDto()
  const prisoner = TestData.bookerPrisonerInfoDto()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubValidatePrisonerPass')
  })

  it('should show Visitors page with two visitors (one having a BAN restriction', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.goToServiceHeaderLinkByName('Visitors')

    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.prisonerName().contains('John Smith')
    visitorsPage.visitorName(0).contains('Joan Phillips')
    visitorsPage.visitorDateOfBirth(0).contains('21 February 1980')
    visitorsPage.visitorName(1).contains('Keith Richards')
    visitorsPage.visitorDateOfBirth(1).contains('5 May 1990')
  })

  it('should not show a banned visitor on booking journey Select visitors page', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.startBooking()

    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.getVisitorByNameLabel('Joan Phillips').should('exist')
    selectVisitorsPage.getVisitorByNameLabel('Keith Richards').should('not.exist')
  })
})
