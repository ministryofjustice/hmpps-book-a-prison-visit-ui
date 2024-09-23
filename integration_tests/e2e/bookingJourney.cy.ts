import { addDays, format, subYears } from 'date-fns'
import { AvailableVisitSessionDto } from '../../server/data/orchestrationApiTypes'
import { DateFormats } from '../../server/constants/dateFormats'
import TestData from '../../server/routes/testutils/testData'
import AdditionalSupportPage from '../pages/bookVisit/additionalSupport'
import ChooseVisitTimePage from '../pages/bookVisit/chooseVisitTime'
import HomePage from '../pages/home'
import Page from '../pages/page'
import SelectVisitorsPage from '../pages/bookVisit/selectVisitors'
import MainContactPage from '../pages/bookVisit/mainContact'
import CheckVisitDetailsPage from '../pages/bookVisit/checkVisitDetails'
import VisitBookedPage from '../pages/bookVisit/visitBooked'
import ClosedVisitPage from '../pages/bookVisit/closedVisit'

context('Booking journey', () => {
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

  it('should complete the booking journey (OPEN visit)', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    const bookerReference = TestData.bookerReference().value

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
    selectVisitorsPage.getVisitorByNameLabel('Adult One').contains('Adult One (25 years old)')
    selectVisitorsPage.getVisitorByNameLabel('Child One').contains('Child One (12 years old)')
    selectVisitorsPage.getVisitorByNameLabel('Child Two').contains('Child Two (5 years old)')
    selectVisitorsPage.selectVisitorByName('Adult One')
    selectVisitorsPage.selectVisitorByName('Child Two')
    cy.task('stubGetSessionRestriction', {
      prisonerId: prisoner.prisoner.prisonerNumber,
      visitorIds: [1000, 3000],
    })

    // Choose visit time
    cy.task('stubGetVisitSessions', {
      prisonId: prisoner.prisoner.prisonId,
      prisonerId: prisoner.prisoner.prisonerNumber,
      visitorIds: [1000, 3000],
      bookerReference,
      visitSessions,
    })
    selectVisitorsPage.continue()
    const chooseVisitTimePage = Page.verifyOnPage(ChooseVisitTimePage)
    chooseVisitTimePage.clickCalendarDay(in5Days)
    chooseVisitTimePage.getSessionLabel(in5Days, 1).contains('2pm to 3pm (1 hour)')
    chooseVisitTimePage.selectSession(in5Days, 1)
    cy.task('stubCreateVisitApplication', { application, bookerReference })
    chooseVisitTimePage.continue()

    // Additional support
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.selectYes()
    additionalSupportPage.enterSupportDetails('Wheelchair access')
    additionalSupportPage.continue()

    // Main contact
    const mainContactPage = Page.verifyOnPage(MainContactPage)
    mainContactPage.selectVisitorByName('Adult One')
    mainContactPage.checkHasPhoneNumber()
    mainContactPage.enterPhoneNumber('01234 567 890')
    cy.task('stubChangeVisitApplication', {
      ...application,
      visitContact: { name: 'Adult One', telephone: '01234 567 890' },
      visitors: [
        { nomisPersonId: 1000, visitContact: true },
        { nomisPersonId: 3000, visitContact: false },
      ],
      visitorSupport: { description: 'Wheelchair access' },
    })
    mainContactPage.continue()

    // Check visit details
    const checkVisitDetailsPage = Page.verifyOnPage(CheckVisitDetailsPage)
    checkVisitDetailsPage.prisonerName().contains('John Smith')
    checkVisitDetailsPage.visitorName(1).contains('Adult One (25 years old)')
    checkVisitDetailsPage.visitorName(2).contains('Child Two (5 years old')
    checkVisitDetailsPage.visitDate().contains(format(in5Days, DateFormats.PRETTY_DATE))
    checkVisitDetailsPage.visitTime().contains('2pm to 3pm')
    checkVisitDetailsPage.additionalSupport().contains('Wheelchair access')
    checkVisitDetailsPage.mainContactName().contains('Adult One')
    checkVisitDetailsPage.mainContactNumber().contains('01234 567 890')

    cy.task('stubBookVisit', { visit: TestData.visitDto(), bookerReference: TestData.bookerReference().value })
    checkVisitDetailsPage.continue()

    const visitBookedPage = Page.verifyOnPage(VisitBookedPage)
    visitBookedPage.bookingReference().contains('ab-cd-ef-gh')
    visitBookedPage
      .phoneNumberText()
      .contains(
        'A text message confirming the visit will be sent to the main contact. This will include the booking reference.',
      )
  })

  it('should show closed visit interruption card (CLOSED visit)', () => {
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()

    const bookerReference = TestData.bookerReference().value

    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    homePage.startBooking()

    // Select visitors page - choose visitors
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
    selectVisitorsPage.selectVisitorByName('Adult One')
    cy.task('stubGetSessionRestriction', {
      prisonerId: prisoner.prisoner.prisonerNumber,
      visitorIds: [1000],
      sessionRestriction: 'CLOSED',
    })
    selectVisitorsPage.continue()

    // Closed visit interruption card page
    const closedVisitPage = Page.verifyOnPage(ClosedVisitPage)

    // Choose visit time
    cy.task('stubGetVisitSessions', {
      prisonId: prisoner.prisoner.prisonId,
      prisonerId: prisoner.prisoner.prisonerNumber,
      visitorIds: [1000],
      bookerReference,
      visitSessions,
    })
    closedVisitPage.continue()
    Page.verifyOnPage(ChooseVisitTimePage)
  })
})
