import type { AuthDetailDto, BookerReference, PrisonerInfoDto, VisitorInfoDto } from '../../data/orchestrationApiTypes'

export default class TestData {
  static authDetailDto = ({
    oneLoginSub = 'sub_user1',
    email = 'user1@example.com',
    phoneNumber = undefined,
  }: Partial<AuthDetailDto> = {}): AuthDetailDto => ({ oneLoginSub, email, phoneNumber })

  static bookerReference = ({ value = 'aaaa-bbbb-cccc' }: Partial<BookerReference> = {}): BookerReference => ({ value })

  static prisonerInfoDto = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
    prisonCode = 'HEI',
  }: Partial<PrisonerInfoDto> = {}): PrisonerInfoDto => ({ prisonerNumber, firstName, lastName, prisonCode })

  static visitorInfoDto = ({
    personId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
  }: Partial<VisitorInfoDto> = {}): VisitorInfoDto => ({ personId, firstName, lastName, dateOfBirth })
}
