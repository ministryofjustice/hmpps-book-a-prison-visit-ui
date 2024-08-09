import paths from '../../server/constants/paths'
import TestData from '../../server/routes/testutils/testData'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VisitorsPage from '../pages/visitors'

context('Visitors page', () => {
  const visitors = [
    TestData.visitor(),
    TestData.visitor({
      visitorDisplayId: 9,
      visitorId: 8005,
      firstName: 'Keith',
      lastName: 'Richards',
      dateOfBirth: '1990-05-05',
    }),
  ]

  const prisoner = TestData.bookerPrisonerInfoDto({ prisonId: 'DHI' })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()
  })

  it('should show Visitors page with two visitors', () => {
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubGetVisitors', { visitors })

    homePage.goToServiceHeaderLinkByName('Visitors')
    const visitorsPage = Page.verifyOnPage(VisitorsPage)
    visitorsPage.backLink().should('have.attr', 'href', paths.HOME)
    visitorsPage.prisonerName().contains('John Smith')
    visitorsPage.visitorName(1).contains('Joan Phillips')
    visitorsPage.visitorDateOfBirth(1).contains('21 February 1980')
    visitorsPage.visitorName(2).contains('Keith Richards')
    visitorsPage.visitorDateOfBirth(2).contains('5 May 1990')
  })
})
