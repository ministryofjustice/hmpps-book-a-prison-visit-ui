import TestData from '../../server/routes/testutils/testData'
import paths from '../../server/constants/paths'
import PrisonersPage from '../pages/prisoners/prisoners'
import Page from '../pages/page'
import PrisonerLocationPage from '../pages/addPrisoner/prisonerLocation'

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
})
