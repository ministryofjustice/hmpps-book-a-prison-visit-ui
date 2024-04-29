import type {
  AuthDetailDto,
  BookerReference,
  PrisonerBasicInfoDto,
  VisitorBasicInfoDto,
} from '../../data/orchestrationApiTypes'

export default class TestData {
  static authDetailDto = ({
    oneLoginSub = 'sub_user1',
    email = 'user1@example.com',
    phoneNumber = undefined,
  }: Partial<AuthDetailDto> = {}): AuthDetailDto => ({ oneLoginSub, email, phoneNumber })

  static bookerReference = ({ value = 'aaaa-bbbb-cccc' }: Partial<BookerReference> = {}): BookerReference => ({ value })

  static prisonerBasicInfoDto = ({
    prisonerNumber = 'A1234BC',
    firstName = 'JOHN',
    lastName = 'SMITH',
  }: Partial<PrisonerBasicInfoDto> = {}): PrisonerBasicInfoDto => ({ prisonerNumber, firstName, lastName })

  static visitorBasicInfoDto = ({
    personId = 1234,
    firstName = 'Joan',
    lastName = 'Phillips',
    dateOfBirth = '1980-02-21',
  }: Partial<VisitorBasicInfoDto> = {}): VisitorBasicInfoDto => ({ personId, firstName, lastName, dateOfBirth })
}
