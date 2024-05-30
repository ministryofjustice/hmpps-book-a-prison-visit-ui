import { addDays, format, subYears } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import SelectVisitorsPage from '../pages/bookingJourney/selectVisitors'
import HomePage from '../pages/home'
import Page from '../pages/page'
import { AvailableVisitSessionDto } from '../../server/data/orchestrationApiTypes'
import { DateFormats } from '../../server/utils/constants'
import SelectVisitDateTimePage from '../pages/bookingJourney/selectVisitDateTime'
import SelectAdditionalSupportPage from '../pages/bookingJourney/selectAdditionalSupport'
import SelectVisitDateTimeNoSessionsPage from '../pages/bookingJourney/selectVisitDateTimeNoSessions'

context('Booking journey', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown
  const prisoner = TestData.prisonerInfoDto()
  const visitors = [
    TestData.visitorInfoDto({
      visitorId: 1000,
      firstName: 'Adult',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old
    }),
    TestData.visitorInfoDto({
      visitorId: 2000,
      firstName: 'Child',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 12), DateFormats.ISO_DATE), // 12-year-old
    }),
    TestData.visitorInfoDto({
      visitorId: 3000,
      firstName: 'Child',
      lastName: 'Two',
      dateOfBirth: format(subYears(today, 5), DateFormats.ISO_DATE), // 5-year-old
    }),
  ]

  const tomorrow = format(addDays(today, 1), DateFormats.ISO_DATE)
  const in5Days = format(addDays(today, 5), DateFormats.ISO_DATE)
  const in10Days = format(addDays(today, 10), DateFormats.ISO_DATE)
  const in35Days = format(addDays(today, 35), DateFormats.ISO_DATE)
  const visitSessions: AvailableVisitSessionDto[] = [
    TestData.availableVisitSessionDto({
      sessionDate: tomorrow,
      sessionTemplateReference: 'a',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: in5Days,
      sessionTemplateReference: 'b',
      sessionTimeSlot: { startTime: '09:00', endTime: '09:45' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: in5Days,
      sessionTemplateReference: 'c',
      sessionTimeSlot: { startTime: '14:00', endTime: '15:00' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: in10Days,
      sessionTemplateReference: 'd',
      sessionTimeSlot: { startTime: '14:00', endTime: '15:00' },
    }),
    // next month - testing multiple months
    TestData.availableVisitSessionDto({
      sessionDate: format(in35Days, DateFormats.ISO_DATE),
      sessionTemplateReference: 'e',
      sessionTimeSlot: { startTime: '09:00', endTime: '11:00' },
    }),
  ]

  const application = TestData.applicationDto({
    sessionTemplateReference: 'c',
    startTimestamp: `${in5Days}T14:00`,
    endTimestamp: `${in5Days}T15:00`,
    visitors: [{ nomisPersonId: 1000 }, { nomisPersonId: 3000 }],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubHmppsAuthToken')
  })

  it('should complete the booking journey', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
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
    selectVisitorsPage.getVisitorLabel(1).contains('Adult One (25 years old)')
    selectVisitorsPage.getVisitorLabel(2).contains('Child One (12 years old)')
    selectVisitorsPage.getVisitorLabel(3).contains('Child Two (5 years old)')
    selectVisitorsPage.selectVisitor(1)
    selectVisitorsPage.selectVisitor(3)

    // Choose visit time
    cy.task('stubGetVisitSessions', {
      prisonId: prisoner.prisonCode,
      prisonerId: prisoner.prisonerNumber,
      visitorIds: [1000, 3000],
      visitSessions,
    })
    selectVisitorsPage.continue()
    const selectVisitDateTimePage = Page.verifyOnPage(SelectVisitDateTimePage)
    selectVisitDateTimePage.clickCalendarDay(in5Days)
    selectVisitDateTimePage.getSessionLabel(in5Days, 1).contains('2pm to 3pm (1 hour)')
    selectVisitDateTimePage.selectSession(in5Days, 1)
    cy.task('stubCreateVisitApplication', { application, bookerReference: TestData.bookerReference().value })
    selectVisitDateTimePage.continue()

    // Additional support
    const selectAdditionalSupportPage = Page.verifyOnPage(SelectAdditionalSupportPage)
    selectAdditionalSupportPage.selectYes()
    selectAdditionalSupportPage.enterSupportDetails('Wheelchair access')
    selectAdditionalSupportPage.continue()

    // TODO add to this test as booking journey implemented
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
      selectVisitorsPage.selectVisitor(3)

      // Choose visit time
      cy.task('stubGetVisitSessions', {
        prisonId: prisoner.prisonCode,
        prisonerId: prisoner.prisonerNumber,
        visitorIds: [1000, 3000],
        visitSessions: [],
      })
      selectVisitorsPage.continue()

      // No sessions so drop-out page and return to home
      const selectVisitDateTimeNoSessions = Page.verifyOnPage(SelectVisitDateTimeNoSessionsPage)
      selectVisitDateTimeNoSessions.returnToHome()
      Page.verifyOnPage(HomePage)
    })
  })
})
