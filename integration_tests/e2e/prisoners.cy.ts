import TestData from '../../server/routes/testutils/testData'
import paths from '../../server/constants/paths'
import PrisonersPage from '../pages/prisoners/prisoners'
import Page from '../pages/page'
import PrisonerLocationPage from '../pages/addPrisoner/prisonerLocation'
import VisitorsPage from '../pages/visitors/visitors'

context('Prisoners page', () => {
  const prisoners = [
    TestData.bookerPrisonerInfoDto(),
    TestData.bookerPrisonerInfoDto({
      firstName: 'Roger',
      lastName: 'Jones',
      dateOfBirth: '1999-04-10',
      prisonerNumber: 'B4321CA',
    }),
  ]
  const bookerReference = TestData.bookerReference().value

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners })
    cy.task('stubGetFuturePublicVisits', {
      bookerReference,
      visits: [],
    })
    cy.task('stubGetSupportedPrisonIds')
    cy.task('stubGetVisitors', { visitors: [TestData.visitorInfoDto()] })
    cy.task('stubGetVisitorRequests')
    cy.signIn()
  })

  it('should show Prisoners page with two prisoners and navigate to add a new prisoner', () => {
    cy.visit(paths.PRISONERS)
    const prisonersPage = Page.verifyOnPage(PrisonersPage)
    prisonersPage.prisonerName(0).contains('John Smith')
    prisonersPage.prisonerDateOfBirth(0).contains('1 February 1980')
    prisonersPage.prisonerName(1).contains('Roger Jones')
    prisonersPage.prisonerDateOfBirth(1).contains('10 April 1999')
    prisonersPage.addANewPrisoner()

    Page.verifyOnPage(PrisonerLocationPage)
  })

  it('should show an added prisoner in the list on the Prisoners page', () => {
    cy.visit(paths.PRISONERS)
    const prisonersPage = Page.verifyOnPage(PrisonersPage)
    prisonersPage.addANewPrisoner()

    Page.verifyOnPage(PrisonerLocationPage)

    cy.task('stubGetPrisoners', {
      prisoners: [
        ...prisoners,
        TestData.bookerPrisonerInfoDto({
          prisonerNumber: 'C52333AD',
          firstName: 'Carol',
          lastName: 'Collins',
          dateOfBirth: '2000-01-01',
        }),
      ],
    })

    cy.visit(paths.PRISONERS)
    const prisonersPageAfterAdd = Page.verifyOnPage(PrisonersPage)
    prisonersPageAfterAdd.prisonerName(2).contains('Carol Collins')
    prisonersPageAfterAdd.prisonerDateOfBirth(2).contains('1 January 2000')
  })

  it('should navigate to the visitors page for the prisoner', () => {
    // This will need updating when multiple prisoners are supported on the visitors page
    cy.visit(paths.PRISONERS)
    const prisonersPage = Page.verifyOnPage(PrisonersPage)
    prisonersPage.prisonerName(0).contains('John Smith')
    prisonersPage.viewPrisonerVisitors(0)

    Page.verifyOnPage(VisitorsPage)
  })
})
