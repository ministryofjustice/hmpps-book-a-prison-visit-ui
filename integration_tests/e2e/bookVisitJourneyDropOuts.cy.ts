import { addDays, format, subYears } from 'date-fns'
import { AvailableVisitSessionDto } from '../../server/data/orchestrationApiTypes'
import { DateFormats } from '../../server/constants/dateFormats'
import TestData from '../../server/routes/testutils/testData'
import ChooseVisitTimePage from '../pages/bookVisit/chooseVisitTime'
import ChooseVisitTimeNoSessionsPage from '../pages/bookVisit/chooseVisitTimeNoSessions'
import VisitsPage from '../pages/visits/visits'
import Page from '../pages/page'
import SelectVisitorsPage from '../pages/bookVisit/selectVisitors'
import CannotBookPage from '../pages/bookVisit/cannotBook'

context('Book visit journey - drop-out points', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown
  const prisoner = TestData.bookerPrisonerInfoDto()

  const adultVisitor = TestData.visitorInfoDto({
    visitorId: 1000,
    firstName: 'Adult',
    lastName: 'One',
    dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old
  })
  const childVisitor = TestData.visitorInfoDto({
    visitorId: 1000,
    firstName: 'Child',
    lastName: 'One',
    dateOfBirth: format(subYears(today, 5), DateFormats.ISO_DATE), // 5-year-old
  })

  const tomorrow = format(addDays(today, 1), DateFormats.ISO_DATE)
  const in10Days = format(addDays(today, 10), DateFormats.ISO_DATE)

  const visitSessions: AvailableVisitSessionDto[] = [
    TestData.availableVisitSessionDto({
      sessionDate: tomorrow,
      sessionTemplateReference: 'a',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
    }),
  ]

  const bookerReference = TestData.bookerReference().value

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')
    cy.task('stubPrisonNames')
  })

  describe('Book visit journey - drop-out points', () => {
    it('should show drop-out page when no available visit sessions', () => {
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

      // Select visitors page - choose visitors
      const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
      selectVisitorsPage.selectVisitorByName('Adult One')
      cy.task('stubGetSessionRestriction', {
        prisonerId: prisoner.prisoner.prisonerNumber,
        visitorIds: [1000],
      })

      // Choose visit time
      cy.task('stubGetVisitSessions', {
        prisonId: prisoner.prisoner.prisonId,
        prisonerId: prisoner.prisoner.prisonerNumber,
        visitorIds: [1000],
        visitSessions: [],
      })
      selectVisitorsPage.continue()

      // No sessions so arrive on drop-out page
      const chooseVisitTimeNoSessionsPage = Page.verifyOnPage(ChooseVisitTimeNoSessionsPage)
      chooseVisitTimeNoSessionsPage.noSessionsPrisonerName().contains('John Smith')
      chooseVisitTimeNoSessionsPage.prisonWebsite().should('have.attr', 'href', prison.webAddress)
    })

    it('should return to choose time page with message when selected session no longer available', () => {
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

      // Select visitors page - choose visitors
      const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
      selectVisitorsPage.selectVisitorByName('Adult One')
      cy.task('stubGetSessionRestriction', {
        prisonerId: prisoner.prisoner.prisonerNumber,
        visitorIds: [1000],
      })

      // Choose visit time
      cy.task('stubGetVisitSessions', {
        prisonId: prisoner.prisoner.prisonId,
        prisonerId: prisoner.prisoner.prisonerNumber,
        visitorIds: [1000],
        visitSessions,
      })
      selectVisitorsPage.continue()
      const chooseVisitTimePage = Page.verifyOnPage(ChooseVisitTimePage)
      chooseVisitTimePage.clickCalendarDay(tomorrow)
      chooseVisitTimePage.selectSession(tomorrow, 0)

      // Mock create application fail and selected session no longer available
      cy.task('stubCreateVisitApplicationFail')
      cy.task('stubGetVisitSessions', {
        prisonId: prisoner.prisoner.prisonId,
        prisonerId: prisoner.prisoner.prisonerNumber,
        visitorIds: [1000],
        visitSessions: [visitSessions[0]],
      })

      // Choose time - should be redirected back with info message shown
      chooseVisitTimePage.continue()
      chooseVisitTimePage.checkOnPage()
      chooseVisitTimePage.getMessages(0).contains(/Your visit time is no longer available(.*)Select a new time\./)
    })

    it('should show drop-out page when prisoner has no VOs', () => {
      const prisonerWithoutVOs = TestData.bookerPrisonerInfoDto({ availableVos: 0, nextAvailableVoDate: in10Days })

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisonerWithoutVOs] })
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

      // Visit cannot be booked page
      const cannotBookPage = Page.verifyOnPage(CannotBookPage)
      cannotBookPage.getCannotBookReason().contains('John Smith')
      cy.contains('has used their allowance of visits')
      cannotBookPage.getBookFromDate().contains(format(in10Days, DateFormats.PRETTY_DATE))

      // Back link back to Visits home page
      cannotBookPage.backLink().click()
      Page.verifyOnPage(VisitsPage)
    })

    it('should show drop-out page when prisoner has been released', () => {
      const prisonerWithoutVOs = TestData.bookerPrisonerInfoDto({ availableVos: 0, nextAvailableVoDate: in10Days })

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisonerWithoutVOs] })
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
      cy.task('stubValidatePrisonerFail')
      visitsPage.bookVisit()

      // Visit cannot be booked page
      const cannotBookPage = Page.verifyOnPage(CannotBookPage)
      cannotBookPage.getCannotBookReason().contains('John Smith')
      cannotBookPage.getCannotBookReason().contains(prison.prisonName)
      cannotBookPage.getCannotBookReason().contains('have moved to another prison or been released')

      // Back link back to Visits home page
      cannotBookPage.backLink().click()
      Page.verifyOnPage(VisitsPage)
    })

    it('should show drop-out page when no eligible visitors over 18', () => {
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
      cy.task('stubGetVisitors', { visitors: [childVisitor] })
      cy.task('stubValidatePrisonerPass')
      cy.task('stubGetVisitorRequests')
      visitsPage.bookVisit()

      // Visit cannot be booked page
      const cannotBookPage = Page.verifyOnPage(CannotBookPage)
      cannotBookPage.getCannotBookReason().contains('One person on a visit must be 18 years old or older')

      // Back link back to Visits home page
      cannotBookPage.backLink().click()
      Page.verifyOnPage(VisitsPage)
    })
  })
})
