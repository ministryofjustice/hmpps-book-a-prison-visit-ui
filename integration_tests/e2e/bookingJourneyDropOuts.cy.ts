import { addDays, format, subYears } from 'date-fns'
import { AvailableVisitSessionDto } from '../../server/data/orchestrationApiTypes'
import { DateFormats } from '../../server/constants/dateFormats'
import TestData from '../../server/routes/testutils/testData'
import ChooseVisitTimePage from '../pages/bookVisit/chooseVisitTime'
import ChooseVisitTimeNoSessionsPage from '../pages/bookVisit/chooseVisitTimeNoSessions'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SelectVisitorsPage from '../pages/bookVisit/selectVisitors'
import CannotBookPage from '../pages/bookVisit/cannotBook'

context('Booking journey - drop-out points', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown
  const prisoner = TestData.bookerPrisonerInfoDto()
  const visitors = [
    TestData.visitorInfoDto({
      visitorId: 1000,
      firstName: 'Adult',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old
    }),
  ]

  const tomorrow = format(addDays(today, 1), DateFormats.ISO_DATE)
  const in10Days = format(addDays(today, 10), DateFormats.ISO_DATE)

  const visitSessions: AvailableVisitSessionDto[] = [
    TestData.availableVisitSessionDto({
      sessionDate: tomorrow,
      sessionTemplateReference: 'a',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
    }),
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  describe('Booking journey - drop-out points', () => {
    it('should show drop-out page when no available visit sessions', () => {
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.signIn()

      // Home page - prisoner shown
      const homePage = Page.verifyOnPage(HomePage)

      // Start booking journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors })
      homePage.startBooking()

      // Select visitors page - choose visitors
      const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
      selectVisitorsPage.selectVisitor(1)
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

      // No sessions so drop-out page and return to home
      const chooseVisitTimeNoSessionsPage = Page.verifyOnPage(ChooseVisitTimeNoSessionsPage)
      chooseVisitTimeNoSessionsPage.returnToHome()
      Page.verifyOnPage(HomePage)
    })

    it('should return to choose time page with message when selected session no longer available', () => {
      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisoner] })
      cy.signIn()

      // Home page - prisoner shown
      const homePage = Page.verifyOnPage(HomePage)

      // Start booking journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors })
      homePage.startBooking()

      // Select visitors page - choose visitors
      const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
      selectVisitorsPage.selectVisitor(1)
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
      chooseVisitTimePage.getMessage().contains('Your visit time is no longer available. Select a new time.')
    })

    it('should show drop-out page when prisoner has no VOs', () => {
      const prisonerWithoutVOs = TestData.bookerPrisonerInfoDto({ availableVos: 0, nextAvailableVoDate: in10Days })

      cy.task('stubGetBookerReference')
      cy.task('stubGetPrisoners', { prisoners: [prisonerWithoutVOs] })
      cy.signIn()

      // Home page - prisoner shown
      const homePage = Page.verifyOnPage(HomePage)

      // Start booking journey
      cy.task('stubGetPrison', prison)
      cy.task('stubGetVisitors', { visitors })
      homePage.startBooking()

      // Visit cannot be booked page
      const cannotBookPage = Page.verifyOnPage(CannotBookPage)
      cannotBookPage.getPrisonerName().contains('John Smith')
      cannotBookPage.getBookFromDate().contains(format(in10Days, DateFormats.PRETTY_DATE))

      // Back link back to Home page
      cannotBookPage.backLink().click()
      Page.verifyOnPage(HomePage)
    })
  })
})
