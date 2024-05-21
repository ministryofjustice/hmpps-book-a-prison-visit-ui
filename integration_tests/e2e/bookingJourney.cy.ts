import { addDays, format, subYears } from 'date-fns'
import TestData from '../../server/routes/testutils/testData'
import SelectVisitorsPage from '../pages/bookingJourney/selectVisitors'
import HomePage from '../pages/home'
import Page from '../pages/page'
import { AvailableVisitSessionDto } from '../../server/data/orchestrationApiTypes'
import { DateFormats } from '../../server/utils/constants'

context('Booking journey', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown
  const prisoner = TestData.prisonerInfoDto()
  const visitors = [
    TestData.visitorInfoDto({
      visitorId: 1,
      firstName: 'Adult',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old
    }),
    TestData.visitorInfoDto({
      visitorId: 2,
      firstName: 'Child',
      lastName: 'One',
      dateOfBirth: format(subYears(today, 12), DateFormats.ISO_DATE), // 12-year-old
    }),
    TestData.visitorInfoDto({
      visitorId: 3,
      firstName: 'Child',
      lastName: 'Two',
      dateOfBirth: format(subYears(today, 5), DateFormats.ISO_DATE), // 5-year-old
    }),
  ]

  const tomorrow = addDays(today, 1)
  const in5Days = addDays(today, 5)
  const in10Days = addDays(today, 10)
  const in35Days = addDays(today, 35)
  const visitSessions: AvailableVisitSessionDto[] = [
    TestData.availableVisitSessionDto({
      sessionDate: format(tomorrow, DateFormats.ISO_DATE),
      sessionTemplateReference: 'a',
      sessionTimeSlot: { startTime: '10:00', endTime: '11:30' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: format(in5Days, DateFormats.ISO_DATE),
      sessionTemplateReference: 'b',
      sessionTimeSlot: { startTime: '09:00', endTime: '09:45' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: format(in5Days, DateFormats.ISO_DATE),
      sessionTemplateReference: 'c',
      sessionTimeSlot: { startTime: '14:00', endTime: '15:00' },
    }),
    TestData.availableVisitSessionDto({
      sessionDate: format(in10Days, DateFormats.ISO_DATE),
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
    selectVisitorsPage.getVisitorLabel(1).contains('Adult One, (25 years old)')
    selectVisitorsPage.getVisitorLabel(2).contains('Child One, (12 years old)')
    selectVisitorsPage.getVisitorLabel(3).contains('Child Two, (5 years old)')
    selectVisitorsPage.selectVisitor(1)
    selectVisitorsPage.selectVisitor(3)

    // Choose visit time
    cy.task('stubGetVisitSessions', {
      prisonId: prisoner.prisonCode,
      prisonerId: prisoner.prisonerNumber,
      visitorIds: [1, 3],
      visitSessions,
    })
    selectVisitorsPage.continue()

    // TODO add to this test as booking journey implemented
  })
})
