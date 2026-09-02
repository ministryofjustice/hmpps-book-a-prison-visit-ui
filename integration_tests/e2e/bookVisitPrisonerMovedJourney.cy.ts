import { format, subYears } from 'date-fns'
import { DateFormats } from '../../server/constants/dateFormats'
import TestData from '../../server/routes/testutils/testData'
import VisitsPage from '../pages/visits/visits'
import Page from '../pages/page'
import ConfirmLocationSelectPrison from '../pages/confirmLocation/selectLocation.cy'
import IncorrectLocationPage from '../pages/confirmLocation/incorrectLocation.cy'
import UnsupportedPrisonPage from '../pages/confirmLocation/unsupportedPrison.cy'
import PvbPrisonPage from '../pages/confirmLocation/pvbPrisonPage.cy'
import PrisonUpdatedPage from '../pages/confirmLocation/prisonUpdatedPage.cy'
import SelectVisitorsPage from '../pages/bookVisit/selectVisitors'
import config from '../../server/config'

context('Book visit journey - prisoner moved prison', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown

  const adultVisitor = TestData.visitorInfoDto({
    visitorId: 1000,
    firstName: 'Adult',
    lastName: 'One',
    dateOfBirth: format(subYears(today, 25), DateFormats.API_DATE), // 25-year-old
  })

  const bookerReference = TestData.bookerReference().value

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')
    cy.task('stubGetSupportedPrisonIds')
  })

  describe('Book visit - prisoner moved journey', () => {
    it('should show prison updated page, if correct prison selected and supported in service', () => {
      const prisoner = TestData.bookerPrisonerInfoDto({
        prisonId: 'HEI',
        registeredPrisonId: 'DHI',
        registeredPrisonName: 'Drake Hall (HMP & YOI)',
      })
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.task('stubGetFuturePublicVisits', {
        bookerReference,
        visits: [],
      })
      cy.signIn()

      // Visits home page - prisoner shown
      const visitsPage = Page.verifyOnPage(VisitsPage)

      // Start book visit journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors: [adultVisitor] })
      cy.task('stubValidatePrisonerPass')
      cy.task('stubGetVisitorRequests')
      visitsPage.bookVisit()

      const confirmLocationSelectPrisonPage = Page.verifyOnPage(
        ConfirmLocationSelectPrison,
        'John is no longer at Drake Hall (HMP & YOI)',
      )

      confirmLocationSelectPrisonPage.prisonDropdown('Hewell (HMP & YOI)')

      cy.task('stubGetSupportedPrisonIds', ['HEI']) // (Selected prison is supported)
      cy.task('stubUpdatePrisonersRegisteredPrison', {})
      const prisonerUpdated = TestData.bookerPrisonerInfoDto()
      cy.task('stubGetPrisoners', { prisoners: [prisonerUpdated] })

      confirmLocationSelectPrisonPage.continueButton()

      const prisonUpdatedPage = Page.verifyOnPage(PrisonUpdatedPage, 'Hewell (HMP & YOI)')

      prisonUpdatedPage.bookVisit()

      Page.verifyOnPage(SelectVisitorsPage)
    })

    it('should show incorrect location page, if wrong prison selected', () => {
      const prisoner = TestData.bookerPrisonerInfoDto({
        prisonId: 'HEI',
        registeredPrisonId: 'FHI',
        registeredPrisonName: 'Foston Hall (HMP & YOI)',
      })
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.task('stubGetFuturePublicVisits', {
        bookerReference,
        visits: [],
      })
      cy.signIn()

      // Visits home page - prisoner shown
      const visitsPage = Page.verifyOnPage(VisitsPage)

      // Start book visit journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors: [adultVisitor] })
      cy.task('stubValidatePrisonerPass')
      cy.task('stubGetVisitorRequests')
      visitsPage.bookVisit()

      const confirmLocationSelectPrisonPage = Page.verifyOnPage(
        ConfirmLocationSelectPrison,
        'John is no longer at Foston Hall (HMP & YOI)',
      )
      confirmLocationSelectPrisonPage.findPrisonerLink().should('have.attr', 'href', 'https://www.gov.uk/find-prisoner')
      confirmLocationSelectPrisonPage.prisonDropdown('Cardiff (HMP & YOI)')
      confirmLocationSelectPrisonPage.continueButton()

      const incorrectLocationPage = Page.verifyOnPage(IncorrectLocationPage, 'John is not at Cardiff (HMP & YOI)')
      incorrectLocationPage.secondHeading().contains('What if I don’t know the prisoner’s location?')
      incorrectLocationPage.findPrisonerLink().should('have.attr', 'href', 'https://www.gov.uk/find-prisoner')
    })

    it('should show no digital service page, if correct prison selected but no digital service', () => {
      const prisoner = TestData.bookerPrisonerInfoDto({
        prisonId: 'ACI',
        registeredPrisonId: 'HEI',
        registeredPrisonName: 'Hewell (HMP & YOI)',
      })
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.task('stubGetFuturePublicVisits', {
        bookerReference,
        visits: [],
      })
      cy.signIn()

      // Visits home page - prisoner shown
      const visitsPage = Page.verifyOnPage(VisitsPage)

      // Start book visit journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors: [adultVisitor] })
      cy.task('stubValidatePrisonerPass')
      cy.task('stubGetVisitorRequests')
      visitsPage.bookVisit()

      const confirmLocationSelectPrisonPage = Page.verifyOnPage(
        ConfirmLocationSelectPrison,
        'John is no longer at Hewell (HMP & YOI)',
      )

      confirmLocationSelectPrisonPage.prisonDropdown('Altcourse (HMP & YOI)')
      confirmLocationSelectPrisonPage.continueButton()

      Page.verifyOnPage(UnsupportedPrisonPage, 'Altcourse (HMP & YOI)')
    })

    it('should show PVB page, if correct prison selected but they only use PVB', () => {
      const prisoner = TestData.bookerPrisonerInfoDto({
        prisonId: 'FHI',
        registeredPrisonId: 'DHI',
        registeredPrisonName: 'Drake Hall (HMP & YOI)',
      })
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.task('stubGetFuturePublicVisits', {
        bookerReference,
        visits: [],
      })
      cy.signIn()

      // Visits home page - prisoner shown
      const visitsPage = Page.verifyOnPage(VisitsPage)

      // Start book visit journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors: [adultVisitor] })
      cy.task('stubValidatePrisonerPass')
      cy.task('stubGetVisitorRequests')
      visitsPage.bookVisit()

      const confirmLocationSelectPrisonPage = Page.verifyOnPage(
        ConfirmLocationSelectPrison,
        'John is no longer at Drake Hall (HMP & YOI)',
      )

      confirmLocationSelectPrisonPage.prisonDropdown('Foston Hall (HMP & YOI)')

      cy.task('stubGetSupportedPrisonIds', ['HEI']) // (Selected prison not supported)
      confirmLocationSelectPrisonPage.continueButton()

      const pvbPrisonPage = Page.verifyOnPage(PvbPrisonPage, 'Foston Hall (HMP & YOI)')
      pvbPrisonPage.pvbLink().should('have.attr', 'href', config.pvbUrl)
    })
  })
})
