import { BookingConfirmed } from '../../@types/bapv'
import type {
  ApplicationDto,
  AuthDetailDto,
  AvailableVisitSessionDto,
  BookerReference,
  OrchestrationVisitDto,
  PrisonDto,
  BookerPrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
} from '../../data/orchestrationApiTypes'
import { Prisoner, Visitor } from '../../services/bookerService'

export default class TestData {
  static applicationDto = ({
    reference = 'aaa-bbb-ccc',
    sessionTemplateReference = 'v9d.7ed.7u',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    visitType = 'SOCIAL',
    visitRestriction = 'OPEN',
    startTimestamp = '2024-05-30T10:00:00',
    endTimestamp = '2024-05-30T11:30:00',
    visitNotes = [],
    visitContact = null,
    visitors = [{ nomisPersonId: 1234 }],
    visitorSupport = null,
  }: Partial<ApplicationDto> = {}): ApplicationDto =>
    ({
      reference,
      sessionTemplateReference,
      prisonerId,
      prisonId,
      visitType,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitNotes,
      visitContact,
      visitors,
      visitorSupport,
    }) as ApplicationDto

  static authDetailDto = ({
    oneLoginSub = 'sub_user1',
    email = 'user1@example.com',
    phoneNumber = undefined,
  }: Partial<AuthDetailDto> = {}): AuthDetailDto => ({ oneLoginSub, email, phoneNumber })

  static availableVisitSessionDto = ({
    sessionDate = '2024-05-30',
    sessionTemplateReference = 'a',
    sessionTimeSlot = { startTime: '10:00', endTime: '11:30' },
    sessionRestriction = 'OPEN',
  }: Partial<AvailableVisitSessionDto> = {}): AvailableVisitSessionDto => ({
    sessionDate,
    sessionTemplateReference,
    sessionTimeSlot,
    sessionRestriction,
  })

  static bookerPrisonerInfoDto = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    prisonId = 'HEI',
    availableVos = 2,
    nextAvailableVoDate = '2024-07-01',
  }: Partial<{
    prisonerNumber: string
    firstName: string
    lastName: string
    prisonId: string
    availableVos: number
    nextAvailableVoDate: string
  }> = {}): BookerPrisonerInfoDto => ({
    prisoner: { prisonerNumber, firstName, lastName, dateOfBirth: undefined, prisonId },
    availableVos,
    nextAvailableVoDate,
  })

  static bookerReference = ({ value = 'aaaa-bbbb-cccc' }: Partial<BookerReference> = {}): BookerReference => ({ value })

  static bookingConfirmed = ({
    prisonCode = this.prisonDto().code,
    prisonName = this.prisonDto().prisonName,
    visitReference = 'ab-cd-ef-gh',
    hasPhoneNumber = true,
  }: Partial<BookingConfirmed> = {}): BookingConfirmed => ({ prisonCode, prisonName, visitReference, hasPhoneNumber })

  static prisonDto = ({
    code = 'HEI',
    prisonName = 'Hewell (HMP)',
    active = true,
    policyNoticeDaysMax = 28,
    policyNoticeDaysMin = 2,
    maxTotalVisitors = 4,
    maxAdultVisitors = 2,
    maxChildVisitors = 3,
    adultAgeYears = 16,
    excludeDates = [],
    clients = [],
  }: Partial<PrisonDto> = {}): PrisonDto =>
    ({
      code,
      prisonName,
      active,
      policyNoticeDaysMax,
      policyNoticeDaysMin,
      maxTotalVisitors,
      maxAdultVisitors,
      maxChildVisitors,
      adultAgeYears,
      excludeDates,
      clients,
    }) as PrisonDto

  static prisoner = ({
    prisonerDisplayId = 'uuidv4-1',
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    prisonId = 'HEI',
    availableVos = 2,
    nextAvailableVoDate = '2024-07-01',
  }: Partial<Prisoner> = {}): Prisoner => ({
    prisonerDisplayId,
    prisonerNumber,
    firstName,
    lastName,
    prisonId,
    availableVos,
    nextAvailableVoDate,
  })

  static visitDto = ({
    applicationReference = 'aaa-bbb-ccc',
    reference = 'ab-cd-ef-gh',
    prisonerId = 'A1234BC',
    prisonId = 'HEI',
    sessionTemplateReference = 'v9d.7ed.7u',
    visitRoom = '',
    visitType = 'SOCIAL',
    visitStatus = 'BOOKED',
    outcomeStatus = undefined,
    visitRestriction = 'OPEN',
    startTimestamp = '2024-05-30T10:00:00',
    endTimestamp = '2024-05-30T11:30:00',
    visitNotes = [],
    visitContact = { name: 'Joan Phillips', telephone: '01234 567890' },
    visitors = [{ nomisPersonId: 1234, visitContact: true }],
    visitorSupport = { description: 'wheelchair access' },
  }: Partial<VisitDto> = {}): VisitDto =>
    ({
      applicationReference,
      reference,
      prisonerId,
      prisonId,
      sessionTemplateReference,
      visitRoom,
      visitType,
      visitStatus,
      outcomeStatus,
      visitRestriction,
      startTimestamp,
      endTimestamp,
      visitNotes,
      visitContact,
      visitors,
      visitorSupport,
    }) as VisitDto

  static visitorInfoDto = ({
    visitorId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
    visitorRestrictions = [],
  }: Partial<VisitorInfoDto> = {}): VisitorInfoDto => ({
    visitorId,
    firstName,
    lastName,
    dateOfBirth,
    visitorRestrictions,
  })

  static visitor = ({
    visitorDisplayId = 'uuidv4-1',
    visitorId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
    visitorRestrictions = [],
    adult = true,
  }: Partial<Visitor> = {}): Visitor => ({
    visitorDisplayId,
    visitorId,
    lastName,
    firstName,
    dateOfBirth,
    visitorRestrictions,
    adult,
  })

  static orchestrationVisitDto = ({
    reference = 'ab-cd-ef-gh',
    prisonerId = 'A1234BC',
    prisonId = 'DHI',
    visitStatus = 'BOOKED',
    outcomeStatus = undefined,
    startTimestamp = '2024-05-30T10:00:00',
    endTimestamp = '2024-05-30T11:30:00',
    visitContact = { name: 'Joan Phillips', telephone: '01234 567890' },
    visitors = [{ nomisPersonId: 1234, firstName: 'Keith', lastName: 'Phillips' }],
    visitorSupport = { description: 'Wheelchair access requested' },
  }: Partial<OrchestrationVisitDto> = {}): OrchestrationVisitDto =>
    ({
      reference,
      prisonerId,
      prisonId,
      visitStatus,
      outcomeStatus,
      startTimestamp,
      endTimestamp,
      visitContact,
      visitors,
      visitorSupport,
    }) as OrchestrationVisitDto
}
