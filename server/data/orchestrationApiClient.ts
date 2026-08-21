import { RestClient, asSystem, SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import {
  ApplicationDto,
  AuthDetailDto,
  AvailableVisitSessionDto,
  BookerReference,
  BookingOrchestrationRequestDto,
  ChangeApplicationDto,
  CreateApplicationDto,
  OrchestrationVisitDto,
  PrisonDto,
  BookerPrisonerInfoDto,
  VisitDto,
  VisitorInfoDto,
  AvailableVisitSessionRestrictionDto,
  CancelVisitOrchestrationDto,
  RegisterPrisonerForBookerDto,
  BookingRequestVisitorDetailsDto,
  AddVisitorToBookerPrisonerRequestDto,
  BookerVisitorRequestValidationErrorResponse,
  BookerPrisonerVisitorRequestDto,
  CreateVisitorRequestResponseDto,
  PermittedPrisonerForBookerDto,
  WithdrawVisitorRequestDto,
} from './orchestrationApiTypes'

export type SessionRestriction = AvailableVisitSessionDto['sessionRestriction']

export default class OrchestrationApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient | undefined) {
    super('orchestrationApiClient', config.apis.orchestration, logger, authenticationClient)
  }

  // orchestration-visits-controller

  async bookVisit({
    applicationReference,
    actionedBy,
    isRequestBooking,
    visitorDetails,
  }: {
    applicationReference: string
    actionedBy: string
    isRequestBooking: boolean
    visitorDetails: BookingRequestVisitorDetailsDto[]
  }): Promise<VisitDto> {
    return this.put(
      {
        path: `/visits/${applicationReference}/book`,
        data: <BookingOrchestrationRequestDto>{
          applicationMethodType: 'WEBSITE',
          allowOverBooking: false,
          actionedBy,
          userType: 'PUBLIC',
          isRequestBooking,
          visitorDetails,
        },
      },
      asSystem(),
    )
  }

  async cancelVisit({
    applicationReference,
    actionedBy,
  }: {
    applicationReference: string
    actionedBy: string
  }): Promise<void> {
    await this.put(
      {
        path: `/visits/${applicationReference}/cancel`,
        data: <CancelVisitOrchestrationDto>{
          cancelOutcome: {
            outcomeStatus: 'BOOKER_CANCELLED',
          },
          applicationMethodType: 'WEBSITE',
          actionedBy,
          userType: 'PUBLIC',
        },
      },
      asSystem(),
    )
  }

  async getFuturePublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.get({ path: `/public/booker/${bookerReference}/visits/booked/future` }, asSystem())
  }

  async getPastPublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.get({ path: `/public/booker/${bookerReference}/visits/booked/past` }, asSystem())
  }

  async getCancelledPublicVisits(bookerReference: string): Promise<OrchestrationVisitDto[]> {
    return this.get({ path: `/public/booker/${bookerReference}/visits/cancelled` }, asSystem())
  }

  // orchestration-applications-controller

  async changeVisitApplication({
    applicationReference,
    applicationRestriction,
    sessionTemplateReference,
    sessionDate,
    visitContact,
    visitors,
    visitorSupport,
  }: {
    applicationReference: string
    applicationRestriction: SessionRestriction
    sessionTemplateReference: string
    sessionDate: string
    visitContact: ChangeApplicationDto['visitContact']
    visitors: ChangeApplicationDto['visitors']
    visitorSupport: ChangeApplicationDto['visitorSupport']
  }): Promise<ApplicationDto> {
    return this.put(
      {
        path: `/visits/application/${applicationReference}/slot/change`,
        data: <ChangeApplicationDto>{
          applicationRestriction,
          sessionTemplateReference,
          sessionDate,
          visitContact,
          visitors,
          visitorSupport,
          allowOverBooking: false,
        },
      },
      asSystem(),
    )
  }

  async createVisitApplication({
    prisonerId,
    sessionTemplateReference,
    sessionDate,
    applicationRestriction,
    visitorIds,
    bookerReference,
  }: {
    prisonerId: string
    sessionTemplateReference: string
    sessionDate: string
    applicationRestriction: SessionRestriction
    visitorIds: number[]
    bookerReference: string
  }): Promise<ApplicationDto> {
    return this.post(
      {
        path: '/visits/application/slot/reserve',
        data: <CreateApplicationDto>{
          prisonerId,
          sessionTemplateReference,
          sessionDate,
          applicationRestriction,
          visitors: visitorIds.map(id => {
            return {
              nomisPersonId: id,
            }
          }),
          userType: 'PUBLIC',
          actionedBy: bookerReference,
          allowOverBooking: false,
        },
      },
      asSystem(),
    )
  }

  // public-booker-controller

  async getBookerReference(authDetailDto: AuthDetailDto): Promise<BookerReference> {
    return this.put(
      {
        path: '/public/booker/register/auth',
        data: { ...authDetailDto },
      },
      asSystem(),
    )
  }

  async getVisitorRequests(bookerReference: string): Promise<BookerPrisonerVisitorRequestDto[]> {
    return this.get(
      {
        path: `/public/booker/${bookerReference}/permitted/visitors/requests`,
      },
      asSystem(),
    )
  }

  async addVisitorRequest({
    bookerReference,
    prisonerId,
    addVisitorRequest,
  }: {
    bookerReference: string
    prisonerId: string
    addVisitorRequest: AddVisitorToBookerPrisonerRequestDto
  }): Promise<
    CreateVisitorRequestResponseDto['status'] | BookerVisitorRequestValidationErrorResponse['validationError']
  > {
    try {
      const result = await this.post<CreateVisitorRequestResponseDto>(
        {
          path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/permitted/visitors/request`,
          data: { ...addVisitorRequest },
        },
        asSystem(),
      )
      return result.status
    } catch (error) {
      const sanitisedError = error as SanitisedError<BookerVisitorRequestValidationErrorResponse>
      if (sanitisedError?.responseStatus === 422 && sanitisedError.data?.validationError) {
        return sanitisedError.data.validationError
      }
      throw error
    }
  }

  async withdrawVisitorRequest({
    visitorReference,
    bookerReference,
  }: {
    visitorReference: string
    bookerReference: string
  }): Promise<void> {
    await this.put(
      {
        path: `/visitor-requests/${visitorReference}/withdraw`,
        data: <WithdrawVisitorRequestDto>{
          bookerReference,
        },
      },
      asSystem(),
    )
  }

  async registerPrisoner(bookerReference: string, prisoner: RegisterPrisonerForBookerDto): Promise<boolean> {
    try {
      await this.post(
        {
          path: `/public/booker/${bookerReference}/permitted/prisoners/register`,
          data: { ...prisoner },
          raw: true, // needed because no JSON response body: an HTTP 200 is true
        },
        asSystem(),
      )
      return true
    } catch (error) {
      if ((<SanitisedError>error)?.responseStatus === 422) {
        return false
      }
      throw error
    }
  }

  async getPrisoners(bookerReference: string): Promise<BookerPrisonerInfoDto[]> {
    return this.get({ path: `/public/booker/${bookerReference}/permitted/prisoners` }, asSystem())
  }

  async validatePrisoner(bookerReference: string, prisonerNumber: string): Promise<true> {
    await this.get(
      {
        path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerNumber}/validate`,
        raw: true, // needed because no JSON response body: an HTTP 200 is true
      },
      asSystem(),
    )
    return true // API will return HTTP 422 for invalid prisoner, which will be caught in service layer
  }

  async updatePrisonersRegisteredPrison({
    bookerReference,
    prisonerId,
    prisonId,
  }: {
    bookerReference: string
    prisonerId: string
    prisonId: string
  }): Promise<PermittedPrisonerForBookerDto> {
    return this.put(
      {
        path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerId}/prison`,
        data: { prisonId },
      },
      asSystem(),
    )
  }

  async getVisitors(bookerReference: string, prisonerNumber: string): Promise<VisitorInfoDto[]> {
    return this.get(
      {
        path: `/public/booker/${bookerReference}/permitted/prisoners/${prisonerNumber}/permitted/visitors`,
      },
      asSystem(),
    )
  }

  // orchestration-sessions-controller

  async getVisitSessions({
    prisonId,
    prisonerId,
    visitorIds,
    excludedApplicationReference,
    bookerReference,
  }: {
    prisonId: string
    prisonerId: string
    visitorIds: number[]
    excludedApplicationReference?: string
    bookerReference: string
  }): Promise<AvailableVisitSessionDto[]> {
    return this.get(
      {
        path: '/visit-sessions/public/available',
        query: new URLSearchParams({
          prisonId,
          prisonerId,
          visitors: visitorIds.join(','),
          username: bookerReference,
          ...(excludedApplicationReference && { excludedApplicationReference }),
          userType: 'PUBLIC',
        }).toString(),
      },
      asSystem(),
    )
  }

  async getSessionRestriction({
    prisonerId,
    visitorIds,
  }: {
    prisonerId: string
    visitorIds: number[]
  }): Promise<SessionRestriction> {
    const { sessionRestriction } = await this.get<AvailableVisitSessionRestrictionDto>(
      {
        path: '/visit-sessions/available/restriction',
        query: new URLSearchParams({
          prisonerId,
          visitors: visitorIds.join(','),
        }).toString(),
      },
      asSystem(),
    )
    return sessionRestriction
  }

  // orchestration-prisons-config-controller

  async getSupportedPrisonIds(): Promise<string[]> {
    return this.get({ path: '/config/prisons/user-type/PUBLIC/supported' }, asSystem())
  }

  async getPrison(prisonCode: string): Promise<PrisonDto> {
    return this.get({ path: `/config/prisons/prison/${prisonCode}` }, asSystem())
  }
}
