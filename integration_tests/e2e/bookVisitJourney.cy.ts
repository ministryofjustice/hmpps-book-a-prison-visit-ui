import { addDays, addYears, format, subYears } from 'date-fns'
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
import ContactDetailsPage from '../pages/bookVisit/contactDetails'
import VisitRequestedPage from '../pages/bookVisit/visitRequested'
import { formatDate } from '../../server/utils/utils'

context('Book visit journey', () => {
  const today = new Date()
  const prison = TestData.prisonDto({ policyNoticeDaysMax: 36 }) // > 31 so always 2 months shown
  const prisoner = TestData.bookerPrisonerInfoDto()

  const banExpiryDate = format(addYears(today, 1), DateFormats.ISO_DATE)
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
    TestData.visitorInfoDto({
      visitorId: 4000,
      firstName: 'Adult',
      lastName: 'Banned',
      dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old
      visitorRestrictions: [{ restrictionType: 'BAN', expiryDate: banExpiryDate }],
    }),
    TestData.visitorInfoDto({
      visitorId: 5000,
      firstName: 'Adult',
      lastName: 'NotApproved',
      dateOfBirth: format(subYears(today, 25), DateFormats.ISO_DATE), // 25-year-old,
      approved: false,
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

  const bookerReference = TestData.bookerReference().value

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubHmppsAuthToken')

    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [prisoner] })
    cy.signIn()
  })

  it('should complete the booking journey (OPEN visit) - visit BOOKED (AUTO_APPROVED)', () => {
    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubValidatePrisonerPass')
    cy.task('stubGetVisitorRequests')
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
    selectVisitorsPage.bannedVisitor(1).contains('Adult Banned (25 years old)')
    selectVisitorsPage.bannedVisitorExpiryDate(1).contains(`Adult is banned until ${formatDate(banExpiryDate)}`)
    selectVisitorsPage.notApprovedVisitor(2).contains('Adult NotApproved (25 years old)')
    selectVisitorsPage.visitorRequest(1).contains('Joan Phillips')
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
    mainContactPage.continue()

    // Contact details
    const contactDetailsPage = Page.verifyOnPage(ContactDetailsPage, 'Adult One')
    contactDetailsPage.checkGetUpdatesByEmail()
    contactDetailsPage.enterEmail('adult.one@example.com')
    contactDetailsPage.checkGetUpdatesByPhone()
    contactDetailsPage.enterPhoneNumber('07712 000 000')
    cy.task('stubChangeVisitApplication', {
      ...application,
      visitContact: { name: 'Adult One', telephone: '07712 000 000', email: 'adult.one@example.com' },
      visitors: [
        { nomisPersonId: 1000, visitContact: true },
        { nomisPersonId: 3000, visitContact: false },
      ],
      visitorSupport: { description: 'Wheelchair access' },
    })
    contactDetailsPage.continue()

    // Check visit details
    const checkVisitDetailsPage = Page.verifyOnPage(CheckVisitDetailsPage)
    checkVisitDetailsPage.prisonerName().contains('John Smith')
    checkVisitDetailsPage.prisonName().contains('Hewell (HMP)')
    checkVisitDetailsPage.visitorName(1).contains('Adult One (25 years old)')
    checkVisitDetailsPage.visitorName(2).contains('Child Two (5 years old')
    checkVisitDetailsPage.visitDate().contains(format(in5Days, DateFormats.PRETTY_DATE))
    checkVisitDetailsPage.visitTime().contains('2pm to 3pm')
    checkVisitDetailsPage.additionalSupport().contains('Wheelchair access')
    checkVisitDetailsPage.mainContactName().contains('Adult One')
    checkVisitDetailsPage.contactDetailsEmail().contains('adult.one@example.com')
    checkVisitDetailsPage.contactDetailsPhone().contains('07712 000 000')

    cy.task('stubBookVisit', {
      visit: TestData.visitDto(),
      bookerReference: TestData.bookerReference().value,
      isRequestBooking: false,
      visitorDetails: [
        { visitorId: 1000, visitorAge: 25 },
        { visitorId: 3000, visitorAge: 5 },
      ],
    })
    checkVisitDetailsPage.submit()

    // Visit booked
    const visitBookedPage = Page.verifyOnPage(VisitBookedPage)
    visitBookedPage.visitReference().contains('ab-cd-ef-gh')
    visitBookedPage
      .confirmationNotificationMessage()
      .contains('An email and a text message confirming the visit will be sent')
  })

  it('should complete the booking journey (OPEN visit) - visit BOOKED (REQUESTED)', () => {
    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubValidatePrisonerPass')
    cy.task('stubGetVisitorRequests')
    homePage.startBooking()

    // Select visitors page - choose visitors
    const selectVisitorsPage = Page.verifyOnPage(SelectVisitorsPage)
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
      // set needs review flag for returned sessions
      visitSessions: visitSessions.map(visitSession => ({ ...visitSession, sessionForReview: true })),
    })
    selectVisitorsPage.continue()
    const chooseVisitTimePage = Page.verifyOnPage(ChooseVisitTimePage)
    chooseVisitTimePage.clickCalendarDay(in5Days)
    chooseVisitTimePage.selectSession(in5Days, 1)
    cy.task('stubCreateVisitApplication', { application, bookerReference })
    chooseVisitTimePage.continue()

    // Additional support
    const additionalSupportPage = Page.verifyOnPage(AdditionalSupportPage)
    additionalSupportPage.selectNo()
    additionalSupportPage.continue()

    // Main contact
    const mainContactPage = Page.verifyOnPage(MainContactPage)
    mainContactPage.selectVisitorByName('Adult One')
    mainContactPage.continue()

    // Contact details
    const contactDetailsPage = Page.verifyOnPage(ContactDetailsPage, 'Adult One')
    contactDetailsPage.checkGetUpdatesByEmail()
    contactDetailsPage.enterEmail('adult.one@example.com')
    cy.task('stubChangeVisitApplication', {
      ...application,
      visitContact: { name: 'Adult One', email: 'adult.one@example.com' },
      visitors: [
        { nomisPersonId: 1000, visitContact: true },
        { nomisPersonId: 3000, visitContact: false },
      ],
      visitorSupport: undefined,
    })
    contactDetailsPage.continue()

    // Check visit details
    const checkVisitDetailsPage = Page.verifyOnPage(CheckVisitDetailsPage)
    checkVisitDetailsPage.prisonerName().contains('John Smith')
    checkVisitDetailsPage.prisonName().contains('Hewell (HMP)')
    checkVisitDetailsPage.visitorName(1).contains('Adult One (25 years old)')
    checkVisitDetailsPage.visitorName(2).contains('Child Two (5 years old')
    checkVisitDetailsPage.visitDate().contains(format(in5Days, DateFormats.PRETTY_DATE))
    checkVisitDetailsPage.visitTime().contains('2pm to 3pm')
    checkVisitDetailsPage.additionalSupport().contains('None')
    checkVisitDetailsPage.mainContactName().contains('Adult One')
    checkVisitDetailsPage.contactDetailsEmail().contains('adult.one@example.com')

    cy.task('stubBookVisit', {
      visit: TestData.visitDto({ visitSubStatus: 'REQUESTED' }),
      bookerReference: TestData.bookerReference().value,
      isRequestBooking: true,
      visitorDetails: [
        { visitorId: 1000, visitorAge: 25 },
        { visitorId: 3000, visitorAge: 5 },
      ],
    })
    checkVisitDetailsPage.submit()

    // Visit requested
    const visitRequestedPage = Page.verifyOnPage(VisitRequestedPage)
    visitRequestedPage.requestReference().contains('ab-cd-ef-gh')
  })

  it('should be possible to start booking journey with no VOs if REMAND prisoner', () => {
    const remandPrisoner = TestData.bookerPrisonerInfoDto({ availableVos: 0, convictedStatus: 'Remand' })
    cy.task('stubGetBookerReference')
    cy.task('stubGetPrisoners', { prisoners: [remandPrisoner] })
    cy.signIn()

    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubValidatePrisonerPass')
    cy.task('stubGetVisitorRequests')
    homePage.startBooking()

    // Select visitors page - choose visitors
    Page.verifyOnPage(SelectVisitorsPage)
  })

  it('should show closed visit interruption card (CLOSED visit)', () => {
    // Home page - prisoner shown
    const homePage = Page.verifyOnPage(HomePage)
    homePage.prisonerName().contains('John Smith')

    // Start booking journey
    cy.task('stubGetPrison', prison)
    cy.task('stubGetVisitors', { visitors })
    cy.task('stubValidatePrisonerPass')
    cy.task('stubGetVisitorRequests')
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
