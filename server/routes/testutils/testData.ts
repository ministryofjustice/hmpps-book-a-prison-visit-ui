import type {
  ApplicationDto,
  AuthDetailDto,
  AvailableVisitSessionDto,
  BookerReference,
  PrisonDto,
  PrisonerInfoDto,
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
    sessionDate = '2024-05-01',
    sessionTemplateReference = 'v9d.7ed.7u',
    sessionTimeSlot = { startTime: '10:00', endTime: '11:30' },
    sessionRestriction = 'OPEN',
  }: Partial<AvailableVisitSessionDto> = {}): AvailableVisitSessionDto => ({
    sessionDate,
    sessionTemplateReference,
    sessionTimeSlot,
    sessionRestriction,
  })

  static bookerReference = ({ value = 'aaaa-bbbb-cccc' }: Partial<BookerReference> = {}): BookerReference => ({ value })

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

  static prisonerInfoDto = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    prisonCode = 'HEI',
  }: Partial<PrisonerInfoDto> = {}): PrisonerInfoDto => ({ prisonerNumber, firstName, lastName, prisonCode })

  static prisoner = ({
    prisonerDisplayId = 1,
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    prisonCode = 'HEI',
  }: Partial<Prisoner> = {}): Prisoner => ({ prisonerDisplayId, prisonerNumber, firstName, lastName, prisonCode })

  static visitorInfoDto = ({
    visitorId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
  }: Partial<VisitorInfoDto> = {}): VisitorInfoDto => ({ visitorId, firstName, lastName, dateOfBirth })

  static visitor = ({
    visitorDisplayId = 1,
    visitorId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
    adult = true,
  }: Partial<Visitor> = {}): Visitor => ({ visitorDisplayId, visitorId, lastName, firstName, dateOfBirth, adult })
}
